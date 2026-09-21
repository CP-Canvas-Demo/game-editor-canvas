# 23. UI layout uses hard-coded pixel offsets with no responsive or overflow handling

**Type:** tech-debt  
**Priority:** p2  
**Labels:** tech-debt, priority: p2

## Summary

Both `MenuScene` (`CARD_X`, `FIRST_CARD_Y`, `CARD_GAP`, footer text at fixed Y) and `GameScene` (`CELL`, `BOARD_X`, `BOARD_Y`) use fixed pixel constants with no logic to reflow, scroll, or scale content based on how much there is (this is the direct root cause of the level-select overflow bug reported separately in this backlog).

## Expected

Layout code should size/position itself based on actual content (level count, grid size) rather than assuming a fixed maximum.

## Actual

Content that exceeds the assumptions baked into these constants (e.g. more than 3 levels, or a very large level grid) silently overlaps or clips instead of adapting.

## Suggested fix

Introduce a layout pass that computes card/board positioning from the current content size, and add basic bounds/overflow handling (scroll, scale-to-fit, or pagination) as a general pattern rather than a one-off fix.
