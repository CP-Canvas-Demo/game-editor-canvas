# 51. No localization/i18n plan — all text is hard-coded English

**Type:** gtm
**Priority:** p3
**Labels:** gtm, priority: p3

## Summary

Every player-facing string across `MenuScene`, `GameScene`, level names/subtitles/objective
descriptions, and UI copy is hard-coded English text embedded directly in scene code and level
JSON. There is no separation of strings from logic, and no plan for supporting additional
languages if the game were ever shown to a non-English-speaking audience.

## Expected

At minimum, a plan (and ideally a starting structure) for extracting player-facing strings into a
lookup table/locale file, so translation becomes a data change rather than a code change.

## Actual

Every string is embedded directly in TypeScript source and level JSON with no indirection.

## Suggested next step

Introduce a small strings/locale module now (even English-only) that all scenes read from, so a
future translation effort is additive rather than a rewrite.
