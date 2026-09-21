# 09. Multiple enemies can occupy the same grid cell because patrol movement never checks other enemies

**Type:** bug  
**Priority:** p3  
**Area:** gameplay  
**Labels:** bug, priority: p3, area: gameplay

## Summary

`moveEnemies()` validates each enemy's next patrol step with `isValidCell(target, ..., this.snake.map(...))`, only excluding the snake's own segments and obstacles. It never excludes other enemies' current positions, so two enemies with overlapping/crossing patrol paths can end up sharing a cell.

## Repro steps

1. Author a level with two enemies whose patrol paths cross the same cell at the same time index (`Math.floor(this.time.now / 1250) % patrol.length`).
2. Watch them overlap on the board.

## Expected

Enemies should not be able to occupy the same cell as another enemy, the same way they cannot occupy an obstacle cell.

## Actual

Two enemies visually overlap/stack on the same cell, which looks like a rendering glitch and makes the "safe to eat" check ambiguous (only one of the stacked enemies is actually detected via `find`, so the other is invisible to collision logic that tick).

## Suggested fix

Add the other enemies' current positions to the occupied list passed to `isValidCell` in `moveEnemies()`.
