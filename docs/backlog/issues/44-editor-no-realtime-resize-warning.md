# 44. Level editor doesn't warn in real time when a grid resize strands existing entities

**Type:** enhancement
**Priority:** p3
**Area:** levels
**Labels:** enhancement, priority: p3, area: levels

## Summary

An author can shrink a level's `grid.width`/`grid.height` in the editor after obstacles, enemies,
or the starting snake have already been placed near the old edges. `levelSchema.mjs` will
correctly reject the resulting document as `out-of-bounds` when the author tries to save — but
nothing in the editor UI itself warns about this *while* resizing, before the save attempt.

## Expected

Resizing the grid smaller than the current placement of any obstacle/enemy/snake segment should
immediately surface a warning (e.g. highlighting the now out-of-bounds cells, or listing them in
the existing live validation-issues panel) as soon as the resize happens, not only when save is
attempted.

## Actual

The problem is invisible until the author clicks save and gets a rejected write with a list of
`out-of-bounds` errors to work backward from.

## Suggested next step

Run `validateLevel()` against the in-progress document on every grid-size change (the editor
already has a `validate_level`/`POST /api/validate` path used elsewhere) and feed the resulting
issues into the existing live issue panel immediately, rather than only at save time.

---
_Full record: `docs/backlog/issues/44-editor-no-realtime-resize-warning.md`_
