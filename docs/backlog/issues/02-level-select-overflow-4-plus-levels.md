# 02. Level select screen overlaps footer UI and clips off-canvas once 4+ levels exist

**Type:** bug  
**Priority:** p1  
**Area:** ui  
**Labels:** bug, priority: p1, area: ui

## Summary

MenuScene lays out level cards at fixed pixel offsets (`FIRST_CARD_Y = 250`, `CARD_GAP = 112`) with no scrolling, pagination, or dynamic sizing. The game currently ships exactly 3 levels, which happens to fit, but the level editor's entire purpose is to let people add more levels — and the layout was never built to support that.

## Repro steps

1. Open a session console and get the running Phaser game: `window.__neonTrailGame`.
2. Get the menu scene and push a few synthetic cards onto `scene.cards` via the existing `createCard` method (or, without touching internals, just add 3+ more `.json` files under `src/game/levels/` with the level editor and reload).
3. Reload the level select screen.

## Expected

Level select scales to any number of levels: for example by scrolling, paginating, or reflowing into columns, while keeping the progression-mode footer and control hints fully readable.

## Actual

The 4th card already visually overlaps the "PROGRESSION: CAMPAIGN" footer text and the "[UP/DOWN...] SELECT" control hints; the 5th and 6th cards render fully or partially below the visible 720px canvas with no way to scroll to them (see screenshot — cards 4-6 are clipped/overlapping even though keyboard navigation can still silently select them).

## Screenshot

![Level select screen overlaps footer UI and clips off-canvas once 4+ levels exist](../screenshots/06-menu-6-levels-overflow.png)

## Suggested fix

Add scrolling (mouse wheel / drag) or pagination to the level list, and keep the footer pinned below the scrollable area instead of at a fixed absolute Y that content can grow into. This is the single highest-priority item in this pass because it silently breaks the core promise of the level editor doc ("every `.json` file dropped into `levels/` is loaded... no TypeScript edit required").
