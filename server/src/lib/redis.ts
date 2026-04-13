import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const LEADERBOARD_KEYS = {
  global: "leaderboard:global",
  path: (path: string) => `leaderboard:path:${path}`,
  friends: (userId: string) => `leaderboard:friends:${userId}`,
} as const;
