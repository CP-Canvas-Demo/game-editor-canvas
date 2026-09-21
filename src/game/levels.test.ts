import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import afterglow from "./levels/afterglow-alley.json";
import manifest from "./levels/manifest.json";
import { LEVELS, getLevelById, getLevelIndex, getNextLevelId, LEVEL_LOAD_FAILURES } from "./levels";
import { validateLevel } from "./levelSchema.mjs";

function clone(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(afterglow)) as Record<string, unknown>;
}

function codesFor(input: unknown, path: string): string[] {
  const result = validateLevel(input);
  expect(result.ok).toBe(false);
  return result.issues.filter((issue) => issue.path === path).map((issue) => issue.code);
}

describe("level registry", () => {
  it("loads every shipped level without validation failures", () => {
    expect(LEVEL_LOAD_FAILURES).toEqual([]);
    expect(LEVELS.length).toBeGreaterThanOrEqual(2);
  });

  // Asserted against the manifest rather than a fixed list so that levels added
  // through the level editor do not break the suite.
  it("orders levels by the campaign manifest and exposes lookups", () => {
    const ids = LEVELS.map((level) => level.id);
    expect(ids.slice(0, manifest.campaign.length)).toEqual(manifest.campaign);

    const extras = ids.slice(manifest.campaign.length);
    expect(extras).toEqual([...extras].sort());

    expect(getLevelById("mirror-metro")?.name).toBe("Mirror Metro");
    ids.forEach((id, index) => {
      expect(getLevelIndex(id)).toBe(index);
      expect(getNextLevelId(id)).toBe(ids[index + 1]);
    });
    expect(getNextLevelId("nope")).toBeUndefined();
  });

  it("keeps level ids unique", () => {
    expect(new Set(LEVELS.map((level) => level.id)).size).toBe(LEVELS.length);
  });

  // The level editor rewrites these files with its own pretty-printer. If that
  // drifts from the hand-authored style, every editor save produces a noisy
  // whitespace-only diff, so pin it here.
  it("round-trips shipped level files through the editor serializer byte-for-byte", async () => {
    const { serializeLevel } = await import("../../.github/extensions/level-editor/levelStore.mjs");
    const dir = fileURLToPath(new URL("./levels/", import.meta.url));
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".json") && name !== "manifest.json")) {
      const original = readFileSync(join(dir, file), "utf8");
      expect(serializeLevel(JSON.parse(original)), `${file} is not editor-stable`).toBe(original);
    }
  });
});

describe("validateLevel", () => {
  it("accepts every shipped level", () => {
    for (const level of LEVELS) {
      expect(validateLevel(JSON.parse(JSON.stringify(level))).ok).toBe(true);
    }
  });

  it("rejects non-objects and unknown versions", () => {
    expect(validateLevel(null).ok).toBe(false);
    expect(codesFor({ ...clone(), version: 2 }, "version")).toContain("unsupported-version");
  });

  it("rejects out-of-bounds obstacles", () => {
    const level = clone();
    (level.obstacles as { position: { x: number } }[])[0].position.x = 99;
    expect(codesFor(level, "obstacles[0].position")).toContain("out-of-bounds");
  });

  it("rejects duplicate obstacle ids and overlapping cells", () => {
    const level = clone();
    const obstacles = level.obstacles as Record<string, unknown>[];
    obstacles[1] = JSON.parse(JSON.stringify(obstacles[0]));
    const issues = validateLevel(level);
    expect(issues.ok).toBe(false);
    const codes = issues.issues.map((issue) => issue.code);
    expect(codes).toContain("duplicate-id");
    expect(codes).toContain("overlap");
  });

  it("rejects a non-contiguous starting trail", () => {
    const level = clone();
    (level.initialSnake as { x: number }[])[1].x = 0;
    expect(codesFor(level, "initialSnake[1]")).toContain("not-contiguous");
  });

  it("rejects spawn rules that reference unknown food", () => {
    const level = clone();
    (level.spawns as { foodId: string }[])[0].foodId = "ghost";
    expect(codesFor(level, "spawns[0].foodId")).toContain("unknown-reference");
  });

  it("rejects a collect objective without a food id", () => {
    const level = clone();
    level.objective = { type: "collect", target: 3 };
    expect(codesFor(level, "objective.foodId")).toContain("missing-field");
  });

  it("rejects a crystal objective that cannot be satisfied", () => {
    const level = clone();
    level.objective = { type: "clear-crystals", target: 3, requiresFirstPerson: true };
    expect(codesFor(level, "objective.target")).toContain("unsolvable-objective");
  });

  it("rejects breakable non-crystal obstacles", () => {
    const level = clone();
    (level.obstacles as Record<string, unknown>[])[0].breakableInFirstPerson = true;
    expect(codesFor(level, "obstacles[0].breakableInFirstPerson")).toContain("invalid-value");
  });

  it("rejects enemies that can never be eaten", () => {
    const level = clone();
    level.food = (level.food as { id: string }[]).filter((food) => food.id !== "pulse");
    level.spawns = (level.spawns as { foodId: string }[]).filter((rule) => rule.foodId !== "pulse");
    expect(codesFor(level, "enemies[0].edibleAfterFood")).toContain("unknown-reference");
  });

  it("round-trips a valid level through JSON without losing data", () => {
    const result = validateLevel(clone());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(JSON.parse(JSON.stringify(result.level))).toEqual(afterglow);
  });
});
