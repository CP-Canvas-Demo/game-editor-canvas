# 16. Esc instantly discards an in-progress run with no confirmation

**Type:** enhancement  
**Priority:** p3  
**Area:** ui  
**Labels:** enhancement, priority: p3, area: ui

## Summary

`handleKey()` maps `Escape` directly to `this.scene.start("menu")` with no confirmation step, at any point during a run, including mid-level in single-level mode where the score is not preserved.

## Expected

Leaving an active run (especially one with a non-trivial score in single-level mode) should ask for confirmation, or at least warn that progress will be lost.

## Actual

A single accidental `Esc` press mid-run instantly discards the current attempt, with no undo.

## Suggested next step

Show a lightweight "Quit run? [Enter] confirm / [Esc] cancel" confirmation prompt before returning to the menu once the player has made meaningful progress (e.g. score > 0).
