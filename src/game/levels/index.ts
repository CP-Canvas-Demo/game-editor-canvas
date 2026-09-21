import type { LevelDefinition } from "../types";
import { formatIssues, validateLevel } from "../levelSchema.mjs";
import manifest from "./manifest.json";

/**
 * Every `*.json` file in this folder (except the manifest) is treated as a level
 * document. New files authored by the level editor are picked up automatically;
 * `manifest.json` only controls campaign ordering.
 */
const modules = import.meta.glob<{ default: unknown }>("./*.json", { eager: true });

export interface LevelLoadFailure {
  file: string;
  message: string;
}

function loadLevels(): { levels: LevelDefinition[]; failures: LevelLoadFailure[] } {
  const levels: LevelDefinition[] = [];
  const failures: LevelLoadFailure[] = [];

  for (const [file, module] of Object.entries(modules)) {
    if (file.endsWith("manifest.json")) continue;
    const result = validateLevel(module.default);
    if (result.ok) levels.push(result.level);
    else failures.push({ file, message: `${file} is not a valid level:\n${formatIssues(result.issues)}` });
  }

  const order = manifest.campaign;
  levels.sort((a, b) => {
    const indexA = order.indexOf(a.id);
    const indexB = order.indexOf(b.id);
    // Levels missing from the manifest keep their alphabetical order after the campaign.
    if (indexA === -1 && indexB === -1) return a.id.localeCompare(b.id);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const seen = new Set<string>();
  for (const level of levels) {
    if (seen.has(level.id)) failures.push({ file: level.id, message: `Duplicate level id "${level.id}".` });
    seen.add(level.id);
  }

  for (const id of order) {
    if (!seen.has(id)) failures.push({ file: "manifest.json", message: `Manifest lists unknown level id "${id}".` });
  }

  return { levels, failures };
}

const loaded = loadLevels();

if (loaded.failures.length > 0) {
  const report = loaded.failures.map((failure) => failure.message).join("\n\n");
  if (import.meta.env?.DEV) throw new Error(`Level load failed:\n\n${report}`);
  console.error(`Level load failed:\n\n${report}`);
}

export const LEVELS: LevelDefinition[] = loaded.levels;
export const LEVEL_LOAD_FAILURES: LevelLoadFailure[] = loaded.failures;

export function getLevelById(id: string): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function getLevelIndex(id: string): number {
  return LEVELS.findIndex((level) => level.id === id);
}

/** Next level in campaign order, or `undefined` when the campaign is finished. */
export function getNextLevelId(id: string): string | undefined {
  const index = getLevelIndex(id);
  if (index < 0 || index >= LEVELS.length - 1) return undefined;
  return LEVELS[index + 1].id;
}

export function getFirstLevelId(): string {
  return LEVELS[0]?.id ?? "";
}
