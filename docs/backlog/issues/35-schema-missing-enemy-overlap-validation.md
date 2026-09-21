# 35. Level schema never validates enemy positions against obstacles, the snake, or other enemies

**Type:** bug
**Priority:** p2
**Area:** levels
**Labels:** bug, priority: p2, area: levels

## Summary

`levelSchema.mjs` is thorough about overlap checks in some places but not others:

- `validateObstacles()` checks obstacle-vs-obstacle overlap (`"overlap"` issue on a repeated
  cell).
- `validateInitialSnake()` checks snake-vs-snake overlap *and* snake-vs-obstacle overlap
  (`"Segment starts inside an obstacle"`).
- `validateEnemies()` only checks that an enemy's `position` and each `patrol` waypoint are
  in-bounds (`inBounds(position, grid)`) — it never checks the enemy's position against
  `obstacles`, the `initialSnake`, or any other enemy's position.

This is an authoring-time validation gap: the same class of mistake that's caught for obstacles
and the snake is not caught for enemies, even though it's just as easy to make with the level
editor's grid-paint tools.

## Repro steps

1. Author a level (by hand or via the editor) with an enemy whose `position` matches an
   obstacle's `position`, or matches a starting `initialSnake` segment.
2. Run the validator against it.

## Expected

Placing an enemy on top of an obstacle or the starting snake should produce an `"overlap"`
validation issue, consistent with the checks that already exist for obstacles and the snake.

## Actual

The level validates successfully with no warning, even though the resulting runtime behavior is
ambiguous (an enemy embedded in a wall, or spawned directly on the snake's starting body).

## Suggested fix

Extend `validateEnemies()` to check each enemy's `position` against the already-computed
obstacle and snake occupancy sets (the same sets `validateInitialSnake()` already builds), and
also track enemy-vs-enemy overlap the way `validateObstacles()` tracks obstacle-vs-obstacle
overlap.
