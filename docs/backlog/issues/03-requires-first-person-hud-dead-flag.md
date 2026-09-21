# 03. Objective flag `requiresFirstPerson` has no observable effect despite docs claiming it changes the HUD

**Type:** bug  
**Priority:** p3  
**Area:** levels  
**Labels:** bug, priority: p3, area: levels

## Summary

`docs/LEVEL_FORMAT.md` documents `objective.requiresFirstPerson` as "Authoring hint surfaced in the HUD," and the schema validator (`levelSchema.mjs`) even rejects `requiresFirstPerson: true` combined with `firstPersonEnabled: false`. But `GameScene.objectiveText()` unconditionally appends "IN FIRST-PERSON" to every `clear-crystals` objective's HUD text regardless of the flag's value, so the flag has zero effect on anything a player can see.

## Repro steps

1. Open `src/scenes/GameScene.ts`, `objectiveText()`.
2. Compare against `mirror-metro.json`, which sets `requiresFirstPerson: true`, versus a hypothetical `clear-crystals` level that omits it — both would render identical HUD text.

## Expected

Either the HUD text should differ based on `requiresFirstPerson` (matching the documented behaviour), or the field should be removed/repurposed if it is not meant to do anything at runtime.

## Actual

The field is validated at authoring time but is otherwise fully inert at runtime, contradicting its own documentation.

## Suggested fix

Make `objectiveText()` branch on `objective.requiresFirstPerson` (e.g. only append "IN FIRST-PERSON" when the flag is set), or update `docs/LEVEL_FORMAT.md` to stop claiming it affects the HUD and clarify it is purely a validator-time authoring guard.
