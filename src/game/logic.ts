import type { Direction, FoodSpawnRule, LevelDefinition, Point } from "./types";

export const directionVector: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isOpposite(a: Direction, b: Direction): boolean {
  return (a === "up" && b === "down") || (a === "down" && b === "up") || (a === "left" && b === "right") || (a === "right" && b === "left");
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function pickSpawnRule(rules: FoodSpawnRule[], random = Math.random): FoodSpawnRule {
  const total = rules.reduce((sum, rule) => sum + rule.weight, 0);
  let roll = random() * total;
  for (const rule of rules) {
    roll -= rule.weight;
    if (roll <= 0) return rule;
  }
  return rules[rules.length - 1];
}

export function isValidCell(point: Point, level: LevelDefinition, occupied: Point[]): boolean {
  return point.x >= 0 && point.y >= 0 && point.x < level.grid.width && point.y < level.grid.height
    && !occupied.some((cell) => samePoint(cell, point))
    && !level.obstacles.some((obstacle) => samePoint(obstacle.position, point));
}
