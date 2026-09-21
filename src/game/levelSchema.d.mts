import type { Direction, EnemyKind, FoodKind, LevelDefinition, ObstacleDefinition } from "./types";

export declare const LEVEL_FORMAT_VERSION: 1;

export declare const FOOD_KINDS: FoodKind[];
export declare const ENEMY_KINDS: EnemyKind[];
export declare const OBSTACLE_KINDS: ObstacleDefinition["kind"][];
export declare const OBJECTIVE_TYPES: readonly ["score", "collect", "clear-crystals"];
export declare const DIRECTIONS: Direction[];

export declare const GRID_LIMITS: { minWidth: number; maxWidth: number; minHeight: number; maxHeight: number };
export declare const SPEED_LIMITS: { min: number; max: number };

/**
 * Stable machine-readable codes so the level editor can attach an issue to a
 * specific control instead of showing a raw message.
 */
export type ValidationCode =
  | "not-an-object"
  | "missing-field"
  | "invalid-type"
  | "invalid-value"
  | "unsupported-version"
  | "duplicate-id"
  | "unknown-reference"
  | "out-of-bounds"
  | "not-contiguous"
  | "overlap"
  | "unsolvable-objective";

export interface ValidationIssue {
  /** Dot/bracket path into the level document, e.g. `obstacles[2].position.x`. */
  path: string;
  code: ValidationCode;
  message: string;
}

export type ValidationResult =
  | { ok: true; level: LevelDefinition; issues: [] }
  | { ok: false; level: null; issues: ValidationIssue[] };

export declare function validateLevel(input: unknown): ValidationResult;
export declare function formatIssues(issues: ValidationIssue[]): string;

export declare const LEVEL_KEY_ORDER: string[];
export declare function orderLevelKeys(level: Record<string, unknown>): Record<string, unknown>;
