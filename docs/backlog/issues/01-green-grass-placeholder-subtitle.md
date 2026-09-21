# 01. Green Grass level ships with a placeholder subtitle ("Untitled signal")

**Type:** bug  
**Priority:** p2  
**Area:** levels  
**Labels:** bug, priority: p2, area: levels

## Summary

The level select screen shows "Untitled signal" as the subtitle for Green Grass instead of real flavour text, because `src/game/levels/green-grass.json` was never given a proper `subtitle` value before shipping.

## Repro steps

1. Run `npm run dev` and open the app.
2. Look at card 3, "Green Grass", on the level select screen.

## Expected

Every level card shows a short, in-universe line of flavour text under its name (e.g. Afterglow Alley: "Ease into the current").

## Actual

Green Grass shows the literal placeholder string "Untitled signal", which reads as an authoring mistake rather than content.

## Screenshot

![Green Grass level ships with a placeholder subtitle ("Untitled signal")](../screenshots/01-menu.png)

## Suggested fix

Author a real one-line subtitle for `green-grass.json` consistent with the other levels tone, and add a lightweight authoring lint (or an editor validation warning) that flags subtitles matching common placeholder strings like "Untitled" / "TODO".
