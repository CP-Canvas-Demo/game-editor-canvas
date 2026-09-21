# 11. The game has no audio: no music, no sound effects

**Type:** enhancement  
**Priority:** p2  
**Area:** audio  
**Labels:** enhancement, priority: p2, area: audio

## Summary

There are no audio assets in the repository and no `this.sound` calls anywhere in `GameScene` or `MenuScene`. Eating food, breaking crystals, colliding with an enemy, clearing a level, and losing a run are all currently silent.

## Expected

Core feedback moments (eat food, break a crystal, clear a level, lose a run, menu navigation) have at least minimal audio feedback, and a background music loop reinforces the synthwave theme.

## Actual

The entire experience is silent.

## Suggested next step

Start with a small set of short SFX (eat, break-crystal, hit-enemy, level-clear, signal-lost, menu-move/select) plus one looping synth track, gated behind a simple mute toggle.
