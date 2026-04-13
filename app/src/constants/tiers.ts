export const TIERS = [
  { name: "Down Bad", min: 0, max: 199, color: "#374151" },
  { name: "NPC", min: 200, max: 399, color: "#6B7280" },
  { name: "6-7", min: 400, max: 599, color: "#D97706" },
  { name: "Cooking", min: 600, max: 799, color: "#F59E0B" },
  { name: "HIM / HER", min: 800, max: 899, color: "#8B5CF6" },
  { name: "Sigma", min: 900, max: 949, color: "#F59E0B" },
  { name: "Mog God", min: 950, max: 999, color: "#EC4899" },
  { name: "Skibidi Legendary", min: 1000, max: 1000, color: "#10B981" },
] as const;

export function getTierForScore(score: number) {
  return TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];
}
