# 14. No onboarding or tutorial for first-time players

**Type:** enhancement  
**Priority:** p2  
**Area:** ui  
**Labels:** enhancement, priority: p2, area: ui

## Summary

The only explanation of controls and objective is the small monospace HUD text shown during play (`[WASD/ARROWS] STEER   [V] VIEW   [SPACE/P] PAUSE   [ESC] LEVELS`) and the README. A first-time player who has not read the README has no in-app explanation of concepts like matching food colors to eat enemies, or what the first-person view is for.

## Expected

A new player should be able to learn the core mechanics (steering, eating food, matching food colors to safely pass enemies, using first-person view to clear crystals) from inside the game itself.

## Actual

There is no first-run help screen, tooltip, or guided first level; the HUD text is present but easy to miss and does not explain *why* mechanics like `edibleAfterFood` matter.

## Suggested next step

Add a brief "how to play" screen accessible from the level select (and optionally shown automatically on first visit), or a guided first level introducing one mechanic at a time.
