# 34. Level card title/subtitle text has no word-wrap and can overflow the card

**Type:** bug
**Priority:** p3
**Area:** ui
**Labels:** bug, priority: p3, area: ui

## Summary

`MenuScene.createCard()` creates the title and meta/subtitle `Text` objects with no `wordWrap`
configuration:

```ts
const title = this.add.text(..., `${index + 1}. ${level.name.toUpperCase()}`, { ... });
const meta = this.add.text(..., this.describeLevel(level, best), { ... });
```

Cards are a fixed 900px wide (`CARD_WIDTH`). Since the level editor lets any author set an
arbitrary `name`/`subtitle` string (bounded only by JSON string limits, not by rendered pixel
width), a level with a long name or subtitle will render past the card's right edge instead of
wrapping to a second line or being truncated with an ellipsis.

## Repro steps

1. Use the level editor to create a level with a long name, e.g. "The Absolutely Longest Signal
   Name That Anyone Has Ever Authored For This Game".
2. Open the level select screen and observe the title text.

## Expected

Long titles/subtitles should wrap within the card bounds or be truncated with an ellipsis, so the
card layout never visually breaks regardless of author-entered text length.

## Actual

The text renders at full width and overflows past the card's right edge (and potentially over the
next card, depending on vertical spacing), with no clipping or wrapping.

## Suggested fix

Set `wordWrap: { width: CARD_WIDTH - 52 }` (accounting for the existing left padding) on both the
title and meta `Text` objects, or truncate the string to a safe character count before rendering.
