import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import { cronRoutes } from "../cron";

vi.mock("../../lib/push", () => ({
  sendPush: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [{ user_id: "u1" }, { user_id: "u2" }],
        error: null,
      }),
    })),
  },
}));

const SECRET = "test-secret";
process.env.CRON_SHARED_SECRET = SECRET;

async function buildApp() {
  const app = Fastify();
  await app.register(cronRoutes);
  return app;
}

beforeEach(() => vi.clearAllMocks());

describe("POST /cron/daily-challenge-announce", () => {
  it("rejects without shared secret header", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url: "/cron/daily-challenge-announce" });
    expect(res.statusCode).toBe(401);
  });

  it("rejects with wrong shared secret", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/cron/daily-challenge-announce",
      headers: { "x-cron-secret": "wrong" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("sends a push to every user with a push token", async () => {
    const { sendPush } = await import("../../lib/push");
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/cron/daily-challenge-announce",
      headers: { "x-cron-secret": SECRET },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(2);
    expect(sendPush).toHaveBeenCalledTimes(2);
    expect(sendPush).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        data: { url: "mogster://" },
      })
    );
  });
});
