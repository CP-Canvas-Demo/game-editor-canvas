# 07. First-person view can still be toggled with `V` while the game is paused

**Type:** bug  
**Priority:** p3  
**Area:** gameplay  
**Labels:** bug, priority: p3, area: gameplay

## Summary

`handleKey()` guards the `V` toggle with `this.level.firstPersonEnabled && !this.ended` but not `!this.paused`, so unlike movement (which is frozen via `moveSnake`'s own paused check), the view can still be flipped while the "PAUSED" message is shown, which is inconsistent with how every other in-run action behaves.

## Repro steps

1. Start a level with `firstPersonEnabled: true`.
2. Press Space/P to pause.
3. Press V.

## Expected

While paused, no gameplay-affecting input (including the view toggle) should be processed until the game is resumed, matching the behaviour of movement input.

## Actual

The view flips between skyline and first-person while paused, and the HUD/render updates accordingly, even though the "PAUSED" overlay message is still showing.

## Suggested fix

Add `&& !this.paused` to the `V` key condition in `handleKey()`, consistent with how movement is already frozen.
