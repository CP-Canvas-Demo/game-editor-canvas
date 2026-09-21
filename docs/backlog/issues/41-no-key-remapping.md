# 41. No key remapping or alternate control scheme

**Type:** enhancement
**Priority:** p3
**Area:** accessibility
**Labels:** enhancement, priority: p3, area: accessibility

## Summary

Both `MenuScene` and `GameScene` hard-code the same fixed key set (arrow keys / WASD for movement,
`V`, `Space`/`P`, `Esc`, `M`, `Enter`) with no way for a player to rebind any of them. Players with
different keyboard layouts (e.g. AZERTY, where WASD sits in a different physical location), or who
simply prefer a different control scheme, have no option.

## Expected

Players should be able to view and optionally remap the core controls (steer, pause, first-person
toggle, mode toggle) from a settings screen, persisted the same way `progressionMode` already is.

## Actual

The control scheme is entirely fixed in code; the only way to use different keys is to edit
`handleKey()` directly.

## Suggested next step

Add a small key-binding settings screen (or an in-menu overlay) that lets players remap the four
directional keys and the three action keys, storing the mapping in `localStorage` alongside the
existing `neon-trail.progressionMode` key.

---
_Full record: `docs/backlog/issues/41-no-key-remapping.md`_
