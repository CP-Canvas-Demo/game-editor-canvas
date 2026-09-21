# 49. README's "empty diff on unchanged save" claim has no automated test

**Type:** tech-debt
**Priority:** p3
**Labels:** tech-debt, priority: p3

## Summary

`README.md`'s "Level editor" section states: "The serializer reproduces the hand-authored
formatting byte for byte, so opening a level and saving it unchanged produces an empty diff." This
is backed by a genuinely careful custom formatter in `levelStore.mjs`'s `serializeLevel()`/
`format()` functions — but nothing in the test suite (`logic.test.ts`, `levels.test.ts`, 18 tests
total) actually verifies this round-trip property. A future change to `format()` or
`orderLevelKeys()` could silently break byte-for-byte reproduction with no test catching the
regression before it surfaces as unexpected diffs in every future level-editor PR.

## Expected

A test that reads each shipped level file, parses it, re-serializes it via `serializeLevel()`, and
asserts the result is byte-identical to the original file contents — directly verifying the
README's claim.

## Actual

The claim is currently only true "by inspection" and by virtue of nobody having broken it yet; it
isn't protected by any automated check.

## Suggested fix

Add a test (e.g. in a new `levelStore.test.ts` alongside the existing level tests, or wherever the
project's test runner can reach `.github/extensions/level-editor/levelStore.mjs`) that round-trips
every file in `src/game/levels/*.json` through `serializeLevel(JSON.parse(...))` and asserts
byte-for-byte equality with the file on disk.
