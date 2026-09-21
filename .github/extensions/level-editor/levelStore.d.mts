// Type declarations for levelStore.mjs, so the game's TypeScript build can
// consume the editor's serializer in tests without `allowJs`.

import type { LevelDefinition } from "../../../src/game/types";
import type { ValidationIssue, ValidationResult } from "../../../src/game/levelSchema.d.mts";

export declare const repoRoot: string;
export declare const levelsDir: string;
export declare const manifestPath: string;

export declare class StoreError extends Error {
  constructor(code: string, message: string);
  code: string;
}

export interface LevelManifest {
  version: 1;
  campaign: string[];
}

export interface LevelListEntry {
  id: string;
  /** File name within `src/game/levels/`, e.g. `mirror-metro.json`. */
  file: string;
  document: unknown;
  valid: boolean;
  issues: ValidationIssue[];
  inCampaign: boolean;
  campaignIndex: number;
}

export declare function assertValidId(id: unknown): string;

/** Pretty-prints a level in the hand-authored house style. */
export declare function serializeLevel(level: Record<string, unknown>): string;

export declare function readManifest(): Promise<LevelManifest>;
export declare function writeManifest(campaign: string[]): Promise<LevelManifest>;
export declare function listLevels(): Promise<{ levels: LevelListEntry[]; manifest: LevelManifest }>;
export declare function readLevel(id: string): Promise<unknown>;
export declare function saveLevel(
  document: unknown,
  options?: { previousId?: string; addToCampaign?: boolean },
): Promise<{ level: LevelDefinition; file: string }>;
export declare function deleteLevel(id: string): Promise<{ id: string; file: string }>;
export declare function createTemplate(options?: {
  id?: string;
  name?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  speedMs?: number;
}): Record<string, unknown>;

export declare function validateLevel(input: unknown): ValidationResult;
