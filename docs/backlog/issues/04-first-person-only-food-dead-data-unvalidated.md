# 04. Validator catches one "dead data" case for first-person content but not its sibling case

**Type:** bug  
**Priority:** p2  
**Area:** levels  
**Labels:** bug, priority: p2, area: levels

## Summary

`docs/LEVEL_FORMAT.md` explicitly calls out that "`firstPersonOnly` food in a level with `firstPersonEnabled: false` is uncollectable dead data" (a known authoring footgun) — but unlike the analogous `requiresFirstPerson` + `firstPersonEnabled: false` combination, which the schema validator rejects with an error, this one is never checked in `levelSchema.mjs`.

## Repro steps

1. Author (or hand-edit) a level with `firstPersonEnabled: false` and a food entry with `firstPersonOnly: true`.
2. Run the validator / load the level in dev.

## Expected

The validator should flag the same class of authoring mistake it already flags for `requiresFirstPerson`, since both are "impossible to satisfy" configurations.

## Actual

The level loads without any warning or error, silently shipping a food item that can never be collected.

## Suggested fix

Add a validation rule mirroring the existing `requiresFirstPerson` check: emit an `unreachable-content` (or similar) issue when any `food[].firstPersonOnly` is true while `firstPersonEnabled` is false.
