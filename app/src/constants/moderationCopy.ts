export type CopyTier = "A" | "B" | "C";

export interface RejectCopy {
  headline: string;
  sub: string;
  ctaPrimary: string;
  ctaSecondary?: string;
}

export const REJECT_COPY: Record<CopyTier, RejectCopy> = {
  A: {
    headline: "AURA UNREADABLE.",
    sub: "keep building, king. drop another.",
    ctaPrimary: "TRY AGAIN →",
  },
  B: {
    headline: "SYSTEM CAN'T LOCK IN.",
    sub: "your aura's loading. try a different angle.",
    ctaPrimary: "RETRY →",
  },
  C: {
    headline: "WE COULDN'T COOK THIS ONE.",
    sub: "take 5. come back. the kitchen's open later.",
    ctaPrimary: "CONTACT SUPPORT",
    ctaSecondary: "BACK TO HOME",
  },
};

export const HARD_LOCKED_COPY: RejectCopy = {
  headline: "ACCOUNT UNDER REVIEW.",
  sub: "email help@mogster.app to unlock — we'll cook again soon.",
  ctaPrimary: "EMAIL SUPPORT",
};
