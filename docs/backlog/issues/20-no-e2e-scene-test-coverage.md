# 20. No automated test coverage for GameScene or MenuScene, only for pure logic

**Type:** tech-debt  
**Priority:** p2  
**Labels:** tech-debt, priority: p2

## Summary

The existing test suite (`logic.test.ts`, `levels.test.ts`, 18 tests total) only covers pure helper functions and level-file validation. There is no automated coverage at all for the actual playable behaviour in `GameScene.ts` or `MenuScene.ts` (movement, collisions, objective completion, pause, first-person view, menu navigation).

## Expected

Core scene behaviour (movement/collision resolution, objective completion, pause/resume, view toggling, menu card selection) should have automated regression coverage.

## Actual

A regression in, for example, collision handling or objective checking would only be caught by manual playtesting.

## Suggested fix

Add a lightweight browser-based test layer (e.g. Playwright against the dev server) covering the critical paths identified in this QA pass, and/or extract more scene logic into pure, directly-testable functions the way `logic.ts` already does.
