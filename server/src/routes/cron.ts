import { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase";
import { sendPush } from "../lib/push";
import { getTodayChallenge } from "../lib/daily";

export async function cronRoutes(app: FastifyInstance) {
  app.post("/cron/daily-challenge-announce", async (req, reply) => {
    const secret = req.headers["x-cron-secret"];
    if (!secret || secret !== process.env.CRON_SHARED_SECRET) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const challenge = getTodayChallenge();
    const { data: rows, error } = await supabase.from("push_tokens").select("user_id");
    if (error) {
      app.log.error(error, "cron/daily-challenge: failed to list push_tokens");
      return reply.code(500).send({ error: "db_error" });
    }

    const title = `Today's challenge: ${challenge.title}`;
    const body = `${challenge.description} +${challenge.bonus_multiplier}× aura if you pass.`;
    let count = 0;
    for (const row of rows ?? []) {
      await sendPush(row.user_id, {
        title,
        body,
        data: { url: "mogster://" },
      });
      count++;
    }
    return { ok: true, count };
  });
}
