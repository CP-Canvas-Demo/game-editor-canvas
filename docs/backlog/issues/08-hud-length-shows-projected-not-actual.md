# 08. HUD "LENGTH" stat shows a projected value instead of the snake's actual current length

**Type:** bug  
**Priority:** p3  
**Area:** ui  
**Labels:** bug, priority: p3, area: ui

## Summary

The HUD text is built from `this.snake.length + this.growth`, i.e. the current segment count plus growth that has been collected but not yet materialized into segments. This means the displayed "LENGTH" is a look-ahead value, not the number of segments currently on the board.

## Repro steps

1. Eat a food item that grants `growth: 3` or more (e.g. "pulse").
2. Compare the HUD's LENGTH number against the number of segments actually visible on the board immediately afterward.

## Expected

LENGTH should reflect the number of segments currently rendered on the board (or, if a projected value is intentional, it should be labeled to make that clear, e.g. "LENGTH (will be)").

## Actual

LENGTH jumps up immediately by the full growth amount even though the extra segments are added gradually over the next few ticks, so the stat visibly disagrees with what's on screen for a few ticks after eating high-growth food.

## Suggested fix

Either display `this.snake.length` alone (actual current length) or relabel/clarify the stat if the projected value is the intended design.
