# 38. Food never spawns on a cell where a crystal was broken, unlike every other collision check

**Type:** bug
**Priority:** p3
**Area:** gameplay
**Labels:** bug, priority: p3, area: gameplay

## Summary

`GameScene` tracks two different obstacle lists once a run starts: `this.level.obstacles` (the
original, immutable level definition) and `this.obstacles` (a mutable copy that has crystals
removed from it once they're broken in first-person view). `moveSnake()` and `moveEnemies()` both
correctly use the mutated list for collision checks (`{ ...this.level, obstacles: this.obstacles }`),
so the snake and enemies can freely move through a cell where a crystal used to be. `addFood()`,
however, calls `isValidCell(candidate, this.level, occupied)` — passing `this.level` directly,
which still contains the *original* obstacle list including already-broken crystals.

## Repro steps

1. Play a level with `breakableInFirstPerson` crystals (e.g. Mirror Metro).
2. Break several crystals via first-person view.
3. Keep playing and observe where food spawns over time.

## Expected

Once a crystal is broken and its cell becomes walkable (as confirmed by the snake/enemies being
able to occupy it), that cell should also become eligible as a food-spawn candidate, consistent
with how it's treated everywhere else.

## Actual

Cleared-crystal cells are permanently excluded from the food-spawn candidate pool for the rest of
the run, silently shrinking the effective playable spawn area the more crystals a player clears —
the opposite of what should happen as a level opens up.

## Suggested fix

Change `addFood()`'s `isValidCell` call to pass `{ ...this.level, obstacles: this.obstacles }`,
the same collision-level object already used by `moveSnake()` and `moveEnemies()`, so all three
checks stay consistent.
