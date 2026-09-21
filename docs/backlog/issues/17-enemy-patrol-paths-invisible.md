# 17. Enemy patrol paths are invisible until a player physically encounters them

**Type:** enhancement  
**Priority:** p3  
**Area:** gameplay  
**Labels:** enhancement, priority: p3, area: gameplay

## Summary

Enemies simply appear and move along their `patrol` waypoints with no visual telegraph (no path outline, no preview) anywhere in the UI — not on the level select, not in first-person view, not in the skyline view.

## Expected

Players should have some way to anticipate enemy movement patterns, especially on levels like Green Grass where a roller patrols a 9-cell-long corridor.

## Actual

The only way to learn a patrol pattern is trial and error during a live run, which is punishing given that colliding with a non-edible enemy ends the run immediately.

## Suggested next step

Draw a faint dotted/dashed line along each enemy's patrol route in the skyline view (toggleable, so it does not clutter high-density levels).
