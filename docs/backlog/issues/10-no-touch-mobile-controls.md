# 10. No touch/mobile controls despite shipping a mobile-friendly viewport meta tag

**Type:** enhancement  
**Priority:** p2  
**Area:** accessibility  
**Labels:** enhancement, priority: p2, area: accessibility

## Summary

The only input handling in the codebase is `this.input.keyboard?.on("keydown", ...)` in both `MenuScene` and `GameScene`. `index.html` ships `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, implying some intent for mobile/responsive support, but there are no on-screen directional controls, swipe handling, or any other touch input path.

## Expected

A visitor on a phone or tablet should be able to at least steer the snake and navigate the menu without a physical keyboard.

## Actual

On a touch device the game loads and renders, but there is no way to play it at all: no button will move the snake or select a level.

## Suggested next step

Add on-screen directional buttons (or swipe-to-steer) rendered only when a touch-capable pointer is detected, reusing the existing `direction`/`queuedDirection` plumbing in `GameScene` and `selected` navigation in `MenuScene`.
