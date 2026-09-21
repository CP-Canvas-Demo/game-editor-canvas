# 22. GameScene.ts mixes rendering, input handling, and simulation logic in one 450-line file

**Type:** tech-debt  
**Priority:** p3  
**Labels:** tech-debt, priority: p3

## Summary

`src/scenes/GameScene.ts` currently owns keyboard input handling, the full movement/collision simulation, objective checking, and all skyline + first-person rendering in a single class, making it harder to unit test simulation logic in isolation the way `logic.ts` already demonstrates is possible.

## Expected

Simulation logic (movement, collision resolution, objective completion, food/enemy interactions) should be separable from rendering and input handling, so it can be tested the same way `src/game/logic.ts` is tested today.

## Actual

Any change to how a tick is resolved requires touching the same file that owns rendering, making the class large and harder to safely change or test.

## Suggested fix

Extract the per-tick simulation step (currently `moveSnake()`) into a pure function in `src/game/logic.ts`-style modules that takes state in and returns new state out, leaving `GameScene` responsible only for orchestration, input, and drawing.
