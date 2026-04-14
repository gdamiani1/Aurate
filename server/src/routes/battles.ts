import { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { supabase } from "../lib/supabase";
import { rateAura } from "../ai/rate";
import { generateFightNarrative, fallbackNarrative, FighterSummary } from "../ai/battle";
import { pickWinner, classifyMargin, BattleMargin } from "../battles/helpers";
import { SigmaPath, SIGMA_PATHS } from "../ai/types";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isCameraSource(request: AuthedRequest): boolean {
  return (request.headers["x-source"] as string | undefined) === "camera";
}

async function uploadBattlePhoto(
  userId: string,
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  const fileName = `${userId}/battle-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("aura-pics")
    .upload(fileName, buffer, { contentType: mimetype });
  if (error) throw new Error("Upload failed");
  const { data } = supabase.storage.from("aura-pics").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function battleRoutes(app: FastifyInstance) {
  app.register(multipart, { limits: { fileSize: 10_000_000 } });

  // ─── Create battle ───
  app.post("/battles/create", { preHandler: requireAuth }, async (request: AuthedRequest, reply) => {
    if (!isCameraSource(request)) {
      return reply.status(400).send({ error: "Battles require camera only bro" });
    }

    const challengerId = request.userId!;
    const opponentUsername = request.headers["x-opponent-username"] as string;
    const sigmaPath = request.headers["x-sigma-path"] as SigmaPath;

    if (!opponentUsername) return reply.status(400).send({ error: "Missing opponent username" });
    if (!SIGMA_PATHS[sigmaPath]) return reply.status(400).send({ error: "Invalid sigma path" });

    // Look up opponent
    const { data: opponent } = await supabase
      .from("profiles").select("id, username").eq("username", opponentUsername).single();
    if (!opponent) return reply.status(404).send({ error: "Opponent not found" });
    if (opponent.id === challengerId) return reply.status(400).send({ error: "Can't battle yourself" });

    // Must be accepted friends
    const { data: friendship } = await supabase
      .from("friendships").select("id")
      .or(`and(requester_id.eq.${challengerId},addressee_id.eq.${opponent.id}),and(requester_id.eq.${opponent.id},addressee_id.eq.${challengerId})`)
      .eq("status", "accepted")
      .maybeSingle();
    if (!friendship) return reply.status(403).send({ error: "Only friends can battle" });

    // No existing pending battle between pair
    const { data: pending } = await supabase
      .from("battles").select("id")
      .or(`and(challenger_id.eq.${challengerId},opponent_id.eq.${opponent.id}),and(challenger_id.eq.${opponent.id},opponent_id.eq.${challengerId})`)
      .eq("status", "awaiting_opponent")
      .maybeSingle();
    if (pending) return reply.status(409).send({ error: "You already have a pending battle with this user" });

    // 24h loss cooldown check
    const cooldownCutoff = new Date(Date.now() - ONE_DAY_MS).toISOString();
    const { data: recentLoss } = await supabase
      .from("battles").select("id")
      .eq("winner_id", opponent.id)
      .or(`challenger_id.eq.${challengerId},opponent_id.eq.${challengerId}`)
      .gt("completed_at", cooldownCutoff)
      .maybeSingle();
    if (recentLoss) return reply.status(429).send({ error: "You can't rematch for 24h after a loss bro" });

    // Read photo
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: "No pic detected" });
    if (!["image/jpeg", "image/png"].includes(data.mimetype)) {
      return reply.status(400).send({ error: "JPEG or PNG only" });
    }
    const buffer = await data.toBuffer();

    // Upload photo
    const imageUrl = await uploadBattlePhoto(challengerId, buffer, data.mimetype);

    // Rate challenger photo (reuses existing AI pipeline)
    const result = await rateAura(buffer.toString("base64"), sigmaPath);

    // Insert aura_check row for challenger
    const { data: check, error: checkErr } = await supabase
      .from("aura_checks")
      .insert({
        user_id: challengerId,
        image_url: imageUrl,
        sigma_path: sigmaPath,
        aura_score: result.aura_score,
        personality_read: result.personality_read,
        roast: result.roast,
        aura_color: result.aura_color,
        tier: result.tier,
        stats: result.stats,
      }).select().single();
    if (checkErr) return reply.status(500).send({ error: "DB insert failed" });

    // Insert battle row
    const expiresAt = new Date(Date.now() + ONE_DAY_MS).toISOString();
    const { data: battle, error: battleErr } = await supabase
      .from("battles")
      .insert({
        challenger_id: challengerId,
        opponent_id: opponent.id,
        sigma_path: sigmaPath,
        challenger_check_id: check.id,
        expires_at: expiresAt,
      }).select().single();
    if (battleErr) return reply.status(500).send({ error: "Battle create failed" });

    return { battle_id: battle.id, expires_at: expiresAt };
  });
}
