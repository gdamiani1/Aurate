export interface FighterInput {
  userId: string;
  score: number;
  stats: { label: string; score: number }[];
}

export interface WinnerResult {
  winnerId: string | "draw";
  loserId: string | null;
}

export function maxStat(stats: { label: string; score: number }[]): number {
  if (!stats.length) return 0;
  return Math.max(...stats.map((s) => s.score));
}

export function pickWinner(a: FighterInput, b: FighterInput): WinnerResult {
  if (a.score > b.score) return { winnerId: a.userId, loserId: b.userId };
  if (b.score > a.score) return { winnerId: b.userId, loserId: a.userId };
  // tiebreak: higher single stat
  const aMax = maxStat(a.stats);
  const bMax = maxStat(b.stats);
  if (aMax > bMax) return { winnerId: a.userId, loserId: b.userId };
  if (bMax > aMax) return { winnerId: b.userId, loserId: a.userId };
  return { winnerId: "draw", loserId: null };
}

export type BattleMargin = "TKO" | "UD" | "SD" | "DRAW" | "FORFEIT";

export function classifyMargin(winnerScore: number, loserScore: number): BattleMargin {
  const diff = Math.abs(winnerScore - loserScore);
  if (diff === 0) return "DRAW";
  if (diff > 200) return "TKO";
  if (diff > 50) return "UD";
  return "SD";
}
