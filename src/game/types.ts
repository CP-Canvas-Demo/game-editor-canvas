export type Point = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";
export type FoodKind = "spark" | "prism" | "pulse" | "nova";
export type EnemyKind = "roller" | "glitch";

export interface FoodDefinition {
  id: string;
  kind: FoodKind;
  color: number;
  growth: number;
  score: number;
  rarity: number;
  firstPersonOnly?: boolean;
}

export interface FoodSpawnRule {
  foodId: string;
  weight: number;
  maxActive: number;
  intervalMs: number;
  regions?: Point[];
}

export interface ObstacleDefinition {
  id: string;
  position: Point;
  kind: "wall" | "crystal";
  breakableInFirstPerson?: boolean;
}

export interface EnemyDefinition {
  id: string;
  kind: EnemyKind;
  position: Point;
  patrol?: Point[];
  edibleAfterFood?: FoodKind;
}

export interface LevelObjective {
  type: "score" | "collect" | "clear-crystals";
  target: number;
  foodId?: string;
  requiresFirstPerson?: boolean;
}

export interface LevelDefinition {
  version: 1;
  id: string;
  name: string;
  subtitle: string;
  grid: { width: number; height: number };
  speedMs: number;
  initialSnake: Point[];
  obstacles: ObstacleDefinition[];
  enemies: EnemyDefinition[];
  food: FoodDefinition[];
  spawns: FoodSpawnRule[];
  objective: LevelObjective;
  firstPersonEnabled: boolean;
}

export interface FoodInstance extends FoodDefinition {
  position: Point;
}
