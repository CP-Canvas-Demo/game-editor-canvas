# 42. Level-select cards don't indicate whether a level uses first-person view

**Type:** enhancement
**Priority:** p3
**Area:** ui
**Labels:** enhancement, priority: p3, area: ui

## Summary

`describeLevel()` shows the objective, grid size, tick speed, and best score for each level, but
nothing indicates whether `firstPersonEnabled` is true for that level, or whether its objective
requires using first-person view at all. A player has no way to know before starting a level
whether the `V` key will do anything.

## Expected

A small badge or stat line entry (e.g. "FIRST-PERSON AVAILABLE" or an icon) on any card where
`level.firstPersonEnabled` is true, so players know what mechanics a level uses before committing
to it.

## Actual

The only way to discover whether a level supports first-person view is to start it and try
pressing `V`.

## Suggested next step

Add a short indicator to `describeLevel()`'s stats line, conditionally rendered when
`level.firstPersonEnabled` is true.

---
_Full record: `docs/backlog/issues/42-no-first-person-indicator-on-cards.md`_
