import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { isOpposite, isValidCell, pickSpawnRule } from "./logic";

describe("game logic", () => {
  it("prevents immediate reversals", () => {
    expect(isOpposite("left", "right")).toBe(true);
    expect(isOpposite("up", "right")).toBe(false);
  });

  it("rejects board, occupied, and obstacle cells", () => {
    const level = LEVELS[0];
    expect(isValidCell({ x: -1, y: 0 }, level, [])).toBe(false);
    expect(isValidCell({ x: 7, y: 8 }, level, [{ x: 7, y: 8 }])).toBe(false);
    expect(isValidCell({ x: 2, y: 3 }, level, [])).toBe(false);
    expect(isValidCell({ x: 10, y: 10 }, level, [])).toBe(true);
  });

  it("selects weighted food rules predictably", () => {
    const rules = LEVELS[0].spawns;
    expect(pickSpawnRule(rules, () => 0).foodId).toBe("spark");
    expect(pickSpawnRule(rules, () => 0.99).foodId).toBe("pulse");
  });
});
