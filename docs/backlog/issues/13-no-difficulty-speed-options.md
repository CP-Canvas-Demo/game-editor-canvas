# 13. No difficulty or speed adjustment options for players who need a slower pace

**Type:** enhancement  
**Priority:** p3  
**Area:** accessibility  
**Labels:** enhancement, priority: p3, area: accessibility

## Summary

Each level's `speedMs` (tick interval) is fixed by the level author with no in-game way to slow the game down. Players with slower reaction times, motor impairments, or who are simply new to the genre have no way to make any level easier without editing the level files themselves.

## Expected

Players should be able to choose an easier pace (e.g. a "relaxed" speed multiplier) independent of level authoring.

## Actual

The only way to change pace is to hand-edit a level's `speedMs` value in its JSON file.

## Suggested next step

Add a simple game-wide speed multiplier setting (e.g. 75%/100%/125% of each level's configured `speedMs`), persisted the same way `progressionMode` already is.
