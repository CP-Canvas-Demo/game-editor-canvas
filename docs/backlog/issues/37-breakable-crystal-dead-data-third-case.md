# 37. Third instance of the first-person "dead data" gotcha: unbreakable crystals go unvalidated

**Type:** bug
**Priority:** p2
**Area:** levels
**Labels:** bug, priority: p2, area: levels

## Summary

There are two previously-reported instances of the same class of bug — content that is
authored as first-person-only but the level disables first-person view entirely, making that
content permanently unusable with no validator warning:

- Issue #4: `food[].firstPersonOnly` food with `firstPersonEnabled: false`.
- Issue #3: `objective.requiresFirstPerson` with `firstPersonEnabled: false` (this one *is*
  validated, but the HUD never reflects it — see #3).

This is the third, previously-unreported instance: `obstacles[].breakableInFirstPerson` on a
`crystal`. `GameScene.moveSnake()` only breaks a crystal when `crystal && this.firstPerson` is
true, and the `V` key toggle to enter first-person view is itself gated by
`this.level.firstPersonEnabled`. So a crystal authored with `breakableInFirstPerson: true` in a
level with `firstPersonEnabled: false` can *never* be broken — but `levelSchema.mjs`'s obstacle
validation never checks this combination the way it checks the food and objective cases.

## Repro steps

1. Author a level with `firstPersonEnabled: false` and at least one obstacle with
   `kind: "crystal"`, `breakableInFirstPerson: true`.
2. Run the validator; note it accepts the level with no issue.
3. Load the level in-game; note the crystal can never be broken because `V` never does anything.

## Expected

The validator should flag `breakableInFirstPerson: true` crystals in a level with
`firstPersonEnabled: false` as an `unreachable-content`/`invalid-value` issue, exactly like the
existing checks for first-person-only food and first-person-required objectives.

## Actual

The level validates cleanly and ships with permanently dead, uninteractable decorative crystals
that look breakable but never are.

## Suggested fix

When fixing #3 and #4's underlying pattern, add the equivalent check to `validateObstacles()` (or
a shared cross-field validation pass) for `breakableInFirstPerson` crystals combined with
`firstPersonEnabled: false`, so all three instances of this gotcha are closed together.
