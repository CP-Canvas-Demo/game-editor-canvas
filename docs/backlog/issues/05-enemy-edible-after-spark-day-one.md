# 05. Enemies with `edibleAfterFood: "spark"` are safe to eat before collecting any food

**Type:** bug  
**Priority:** p3  
**Area:** gameplay  
**Labels:** bug, priority: p3, area: gameplay

## Summary

`GameScene` initializes `lastFoodKind = "spark"` at the start of every level (before any food has been eaten). Any enemy authored with `edibleAfterFood: "spark"` is therefore edible from the very first tick, bypassing the intended "eat a matching food first" mechanic. This exact gotcha is already called out in `docs/LEVEL_FORMAT.md` ("an enemy whose first enemy is `edibleAfterFood: "spark"` is edible from the very first tick") but nothing in the validator warns level authors about it, and no current shipped level happens to use it.

## Repro steps

1. Author a level with an enemy that has `edibleAfterFood: "spark"`.
2. Start the level and immediately run into that enemy without eating anything.

## Expected

An `edibleAfterFood` enemy should require the player to actually eat a matching food during the current run before it becomes safe, regardless of which food kind that is.

## Actual

Enemies tied to the `spark` food kind are exploitable immediately, defeating the mechanic's purpose, purely because of the arbitrary initial value chosen for `lastFoodKind`.

## Suggested fix

Initialize `lastFoodKind` to a sentinel value that matches no real `FoodKind` (e.g. `null` / `"none"`) instead of `"spark"`, and add a validator warning when `edibleAfterFood` targets a food that would be satisfied by the initial state.
