# 40. No level thumbnail/preview art on level-select cards

**Type:** enhancement
**Priority:** p3
**Area:** ui
**Labels:** enhancement, priority: p3, area: ui

## Summary

Level-select cards (`MenuScene.createCard()`) are text-only: a title, a subtitle, and a stats
line (objective, grid size, speed, best score). There is no visual preview of what a level
actually looks like — its layout, obstacle density, color palette — before starting it.

## Expected

Each card would show a small rendered thumbnail of the level's grid (obstacles, starting snake
position, food/enemy density) so players can visually distinguish levels at a glance, not just by
reading stats.

## Actual

Every card looks structurally identical; the only differentiator is text.

## Suggested next step

Render a small (e.g. 96x60px) top-down thumbnail per card by drawing the level's `grid`,
`obstacles`, and `initialSnake` at a reduced scale — this can reuse the same drawing primitives
`GameScene`'s skyline view already uses, just scaled down and static.

---
_Full record: `docs/backlog/issues/40-no-level-thumbnails.md`_
