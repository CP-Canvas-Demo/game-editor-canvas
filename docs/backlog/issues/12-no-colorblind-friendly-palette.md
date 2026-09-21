# 12. No colorblind-friendly palette or shape-based distinction for food/enemy/crystal colors

**Type:** enhancement  
**Priority:** p2  
**Area:** accessibility  
**Labels:** enhancement, priority: p2, area: accessibility

## Summary

Food kinds, enemies, and crystals are currently distinguished primarily by hue (pink/magenta "glitch" vs teal "roller"; four different food colors). `EnemyKind`/`FoodKind` already have distinct shapes drawn (circle vs square vs triangle in first-person), but in the top-down "skyline" view every food item and every enemy uses the same rounded-rect/circle shape and relies entirely on color to differentiate.

## Expected

Every gameplay-relevant category (food kind, enemy kind, breakable vs. non-breakable obstacle) should be distinguishable without relying on color alone, for players with color vision deficiencies.

## Actual

In the skyline (top-down) view, food items and enemies are only reliably told apart by their fill color, which is a common accessibility gap for red-green and blue-yellow colorblind players.

## Suggested next step

Reuse the shape differentiation already implemented in the first-person view (triangle for crystal, square for barrier, distinct icon per food/enemy kind) in the top-down view as well, or add a small icon/glyph overlay per kind.
