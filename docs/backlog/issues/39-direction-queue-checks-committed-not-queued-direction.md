# 39. Rapid opposite-direction key presses can reverse the snake into its own neck

**Type:** bug
**Priority:** p2
**Area:** gameplay
**Labels:** bug, priority: p2, area: gameplay

## Summary

`GameScene.handleKey()` guards direction changes with:

```ts
if (!isOpposite(this.direction, candidate)) this.queuedDirection = candidate;
```

This checks the new candidate against `this.direction` — the direction that was last *committed*
by `moveSnake()` on the previous tick — not against `this.queuedDirection`, which is what will
actually be committed on the *next* tick. If two opposite-direction keys are pressed in quick
succession within the same tick window (easily done at normal human reaction speed, especially on
slower `speedMs` levels), both keystrokes are validated against the same stale `this.direction`
and neither is rejected relative to the other. The second keypress silently overwrites the first
in `queuedDirection`, and on the next tick the snake moves in a direction directly opposite its
most recent queued turn — a classic snake-clone bug that lets the head double back into the
segment immediately behind it.

## Repro steps

1. Start any level moving right.
2. Quickly press Down then Up (or any two opposite keys) within roughly one tick interval
   (`speedMs`, e.g. 150ms on Afterglow Alley).
3. Observe the snake's direction on the following tick.

## Expected

Only genuine 180°-reversals relative to the *pending* direction should be rejected; once a
direction is queued, a second key press that would reverse *that* queued direction (not just the
last committed one) should also be rejected, so the snake can never be steered into itself no
matter how fast the player presses keys.

## Actual

Pressing two opposite keys inside one tick window bypasses the reversal guard, because the check
only ever compares against the direction from one tick ago, not against the currently-queued one.

## Suggested fix

Change the guard to `if (!isOpposite(this.queuedDirection, candidate)) this.queuedDirection = candidate;`
so each new key press is validated against the most recent pending direction, not the last
committed one.
