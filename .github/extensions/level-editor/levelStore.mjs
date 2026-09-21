// Repo-backed storage for Neon Trail level documents.
//
// The editor treats the repo file path as the durable ID: every save writes a
// real `src/game/levels/<id>.json` that the game loads and the user commits
// through a normal PR. Nothing is kept in a private store.

import { readFile, writeFile, readdir, unlink, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateLevel, orderLevelKeys } from "../../../src/game/levelSchema.mjs";

const extensionDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(extensionDir, "..", "..", "..");
export const levelsDir = path.join(repoRoot, "src", "game", "levels");
export const manifestPath = path.join(levelsDir, "manifest.json");

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

export class StoreError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function assertValidId(id) {
  if (typeof id !== "string" || !ID_PATTERN.test(id)) {
    throw new StoreError(
      "invalid_level_id",
      `Level id "${id}" must be lowercase kebab-case (letters, digits and hyphens, starting with a letter or digit).`,
    );
  }
  return id;
}

function levelPath(id) {
  return path.join(levelsDir, `${assertValidId(id)}.json`);
}

/**
 * Serializes a level document in the same hand-authored style as the shipped
 * files: arrays expand one element per line, and any object whose subtree
 * contains no array stays on a single line. Keeps editor saves diff-friendly
 * against files a human wrote by hand.
 */
export function serializeLevel(level) {
  return `${format(orderLevelKeys(level), 0)}\n`;
}

function containsArray(value) {
  if (Array.isArray(value)) return true;
  if (value && typeof value === "object") return Object.values(value).some(containsArray);
  return false;
}

function format(value, depth) {
  const pad = "  ".repeat(depth);
  const inner = "  ".repeat(depth + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => `${inner}${format(item, depth + 1)}`);
    return `[\n${items.join(",\n")}\n${pad}]`;
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).filter((key) => value[key] !== undefined);
    if (keys.length === 0) return "{}";
    // Depth 0 is the level document itself, which always expands.
    if (depth > 0 && !containsArray(value)) {
      return `{ ${keys.map((key) => `${JSON.stringify(key)}: ${format(value[key], depth + 1)}`).join(", ")} }`;
    }
    const entries = keys.map((key) => `${inner}${JSON.stringify(key)}: ${format(value[key], depth + 1)}`);
    return `{\n${entries.join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value);
}

export async function readManifest() {
  try {
    const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
    const campaign = Array.isArray(parsed.campaign) ? parsed.campaign.filter((id) => typeof id === "string") : [];
    return { version: 1, campaign };
  } catch {
    return { version: 1, campaign: [] };
  }
}

export async function writeManifest(campaign) {
  const unique = [];
  for (const id of campaign) {
    if (typeof id === "string" && !unique.includes(id)) unique.push(id);
  }
  const body = `{\n  "version": 1,\n  "campaign": [${unique.map((id) => JSON.stringify(id)).join(", ")}]\n}\n`;
  await mkdir(levelsDir, { recursive: true });
  await writeFile(manifestPath, body, "utf8");
  return { version: 1, campaign: unique };
}

/** Reads every level file, returning invalid ones with their issues attached. */
export async function listLevels() {
  await mkdir(levelsDir, { recursive: true });
  const files = (await readdir(levelsDir)).filter((file) => file.endsWith(".json") && file !== "manifest.json").sort();
  const manifest = await readManifest();

  const levels = [];
  for (const file of files) {
    const id = file.replace(/\.json$/, "");
    let raw = null;
    let parseError = null;
    try {
      raw = JSON.parse(await readFile(path.join(levelsDir, file), "utf8"));
    } catch (error) {
      parseError = error.message;
    }
    const result = parseError ? null : validateLevel(raw);
    levels.push({
      id,
      file,
      document: raw,
      valid: Boolean(result?.ok),
      issues: parseError ? [{ path: "level", code: "invalid-type", message: `Not valid JSON: ${parseError}` }] : (result?.issues ?? []),
      inCampaign: manifest.campaign.includes(id),
      campaignIndex: manifest.campaign.indexOf(id),
    });
  }

  levels.sort((a, b) => {
    const ia = a.campaignIndex === -1 ? Number.MAX_SAFE_INTEGER : a.campaignIndex;
    const ib = b.campaignIndex === -1 ? Number.MAX_SAFE_INTEGER : b.campaignIndex;
    return ia === ib ? a.id.localeCompare(b.id) : ia - ib;
  });

  return { levels, manifest };
}

export async function readLevel(id) {
  const file = levelPath(id);
  if (!existsSync(file)) throw new StoreError("level_not_found", `No level file for id "${id}".`);
  return JSON.parse(await readFile(file, "utf8"));
}

/**
 * Validates and writes a level. Refuses to write anything the game could not
 * load, so a saved file is always a loadable level.
 *
 * `previousId` lets a rename move the file and keep the campaign slot.
 */
export async function saveLevel(document, { previousId, addToCampaign = true } = {}) {
  const result = validateLevel(document);
  if (!result.ok) {
    throw new StoreError("level_invalid", `Refusing to save an invalid level:\n${result.issues.map((i) => `  - [${i.code}] ${i.path}: ${i.message}`).join("\n")}`);
  }
  const level = result.level;
  assertValidId(level.id);

  const renaming = typeof previousId === "string" && previousId !== level.id;
  if (!renaming && !previousId && existsSync(levelPath(level.id))) {
    // Overwriting an existing file is fine; this branch exists only to make the
    // intent explicit for readers.
  }

  await mkdir(levelsDir, { recursive: true });
  await writeFile(levelPath(level.id), serializeLevel(level), "utf8");

  const manifest = await readManifest();
  let campaign = manifest.campaign;
  if (renaming) {
    const index = campaign.indexOf(previousId);
    campaign = index === -1 ? campaign : campaign.map((id) => (id === previousId ? level.id : id));
    if (existsSync(levelPath(previousId))) await unlink(levelPath(previousId));
  }
  if (addToCampaign && !campaign.includes(level.id)) campaign = [...campaign, level.id];
  await writeManifest(campaign);

  return { level, file: path.relative(repoRoot, levelPath(level.id)) };
}

export async function deleteLevel(id) {
  const file = levelPath(id);
  if (!existsSync(file)) throw new StoreError("level_not_found", `No level file for id "${id}".`);
  await unlink(file);
  const manifest = await readManifest();
  await writeManifest(manifest.campaign.filter((entry) => entry !== id));
  return { id, file: path.relative(repoRoot, file) };
}

const DEFAULT_FOOD = [
  { id: "spark", kind: "spark", color: 16768842, growth: 1, score: 50, rarity: 1 },
  { id: "prism", kind: "prism", color: 3598079, growth: 2, score: 120, rarity: 0.7 },
  { id: "pulse", kind: "pulse", color: 16732120, growth: 3, score: 220, rarity: 0.35 },
  { id: "nova", kind: "nova", color: 10320895, growth: 4, score: 400, rarity: 0.15, firstPersonOnly: true },
];

/** A minimal but already-valid level, so a new file is playable immediately. */
export function createTemplate({ id, name, subtitle, width = 24, height = 15, speedMs = 150 } = {}) {
  const levelId = id ?? "new-level";
  const midY = Math.floor(height / 2);
  return orderLevelKeys({
    version: 1,
    id: levelId,
    name: name ?? "New Level",
    subtitle: subtitle ?? "Untitled signal",
    grid: { width, height },
    speedMs,
    firstPersonEnabled: true,
    initialSnake: [
      { x: 5, y: midY },
      { x: 4, y: midY },
      { x: 3, y: midY },
    ],
    obstacles: [],
    enemies: [],
    food: DEFAULT_FOOD.map((food) => ({ ...food })),
    spawns: [
      { foodId: "spark", weight: 5, maxActive: 2, intervalMs: 1900 },
      { foodId: "prism", weight: 3, maxActive: 1, intervalMs: 2900 },
      { foodId: "pulse", weight: 1, maxActive: 1, intervalMs: 4500 },
    ],
    objective: { type: "score", target: 900 },
  });
}

export { validateLevel };
