# 33. Level-select navigation permanently breaks (NaN) if every level is deleted or invalid

**Type:** bug
**Priority:** p3
**Area:** ui
**Labels:** bug, priority: p3, area: ui

## Summary

`MenuScene.handleKey()` computes the next/previous selected index as
`(this.selected + 1) % LEVELS.length` and `(this.selected - 1 + LEVELS.length) % LEVELS.length`.
If every level file is deleted (now possible in principle via the level editor's `delete_level`
action — see issue #32) or every level fails schema validation, `LEVELS` (from
`src/game/levels/index.ts`) is an empty array, so `LEVELS.length` is `0` and any modulo against it
evaluates to `NaN` in JavaScript.

## Repro steps

1. Delete or invalidate every level file so `LEVELS.length === 0` (e.g. via the level editor, or
   by temporarily renaming all files under `src/game/levels/` other than `manifest.json`).
2. Load the menu screen.
3. Press an arrow key / `W`/`S`.

## Expected

With zero playable levels, the menu should show an explicit "no levels available" state, and
navigation keys should be a no-op rather than corrupting internal state.

## Actual

`this.selected` becomes `NaN` on the first navigation keypress and never recovers (every
subsequent `NaN ± 1 % 0` calculation stays `NaN`), silently breaking the level-select screen with
no player-visible error.

## Suggested fix

Guard `handleKey()`'s navigation branches with `if (LEVELS.length === 0) return;`, and render an
explicit empty state (e.g. "No levels found — add one with the level editor") when `LEVELS.length`
is 0, instead of relying on there always being at least one level.
