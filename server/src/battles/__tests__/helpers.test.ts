import { describe, it, expect } from "vitest";
import { pickWinner, classifyMargin } from "../helpers";

describe("pickWinner", () => {
  it("higher score wins", () => {
    const result = pickWinner(
      { userId: "a", score: 800, stats: [{ label: "x", score: 80 }] },
      { userId: "b", score: 600, stats: [{ label: "x", score: 60 }] }
    );
    expect(result.winnerId).toBe("a");
  });

  it("tie broken by max single stat", () => {
    const result = pickWinner(
      { userId: "a", score: 700, stats: [{ label: "x", score: 80 }] },
      { userId: "b", score: 700, stats: [{ label: "x", score: 95 }] }
    );
    expect(result.winnerId).toBe("b");
  });

  it("returns draw when score AND max stat equal", () => {
    const result = pickWinner(
      { userId: "a", score: 700, stats: [{ label: "x", score: 80 }] },
      { userId: "b", score: 700, stats: [{ label: "x", score: 80 }] }
    );
    expect(result.winnerId).toBe("draw");
  });
});

describe("classifyMargin", () => {
  it("TKO when difference > 200", () => {
    expect(classifyMargin(900, 650)).toBe("TKO");
  });
  it("UD when difference 51-200", () => {
    expect(classifyMargin(800, 700)).toBe("UD");
  });
  it("SD when difference 1-50", () => {
    expect(classifyMargin(800, 770)).toBe("SD");
  });
  it("DRAW when equal", () => {
    expect(classifyMargin(800, 800)).toBe("DRAW");
  });
});
