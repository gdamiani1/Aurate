import { FastifyInstance } from "fastify";
import { redis, LEADERBOARD_KEYS } from "../lib/redis";
import { supabase } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

export async function leaderboardRoutes(app: FastifyInstance) {
  // Global Mog Board
  app.get("/mogboard/global", { preHandler: requireAuth }, async (request) => {
    const { limit = "50", offset = "0" } = request.query as {
      limit?: string;
      offset?: string;
    };

    // @upstash/redis zrange with rev: true returns [member, score, member, score, ...]
    const results = await redis.zrange<string[]>(
      LEADERBOARD_KEYS.global,
      Number(offset),
      Number(offset) + Number(limit) - 1,
      { rev: true, withScores: true }
    );

    // Parse pairs: [member, score, member, score, ...]
    const entries = [];
    for (let i = 0; i < results.length; i += 2) {
      entries.push({
        user_id: results[i] as string,
        peak_aura: Number(results[i + 1]),
      });
    }
    if (entries.length === 0) return { leaderboard: [] };

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, tier, current_streak")
      .in("id", entries.map((e) => e.user_id));
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return {
      leaderboard: entries.map((e, i) => ({
        rank: Number(offset) + i + 1,
        ...profileMap.get(e.user_id),
        peak_aura: e.peak_aura,
      })),
    };
  });

  // Path-specific Mog Board
  app.get("/mogboard/path/:path", { preHandler: requireAuth }, async (request) => {
    const { path } = request.params as { path: string };
    const { limit = "50" } = request.query as { limit?: string };

    const results = await redis.zrange<string[]>(
      LEADERBOARD_KEYS.path(path),
      0,
      Number(limit) - 1,
      { rev: true, withScores: true }
    );

    const entries = [];
    for (let i = 0; i < results.length; i += 2) {
      entries.push({ user_id: results[i] as string, score: Number(results[i + 1]) });
    }
    if (entries.length === 0) return { leaderboard: [] };

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, tier")
      .in("id", entries.map((e) => e.user_id));
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return {
      leaderboard: entries.map((e, i) => ({
        rank: i + 1,
        ...profileMap.get(e.user_id),
        score: e.score,
      })),
    };
  });

  // Friends Mog Board
  app.get("/mogboard/circle/:userId", { preHandler: requireAuth }, async (request) => {
    const { userId } = request.params as { userId: string };
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "accepted");

    const friendIds = (friendships || []).map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );
    friendIds.push(userId);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, peak_aura, tier, current_streak")
      .in("id", friendIds)
      .order("peak_aura", { ascending: false });

    return {
      leaderboard: (profiles || []).map((p, i) => ({ rank: i + 1, ...p })),
    };
  });
}
