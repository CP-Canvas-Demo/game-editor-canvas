# 31. Level editor template still defaults to the placeholder subtitle "Untitled signal"

**Type:** bug
**Priority:** p2
**Area:** levels
**Labels:** bug, priority: p2, area: levels

## Summary

`createTemplate()` in `.github/extensions/level-editor/levelStore.mjs` hard-codes
`subtitle: subtitle ?? "Untitled signal"` for every new level scaffolded from the editor. This is
the exact same placeholder string already reported as shipping in Green Grass (issue #4/"Green
Grass level ships with a placeholder subtitle"). That earlier issue fixes the one level that
already leaked the placeholder into production; this issue is about the source: the template that
keeps generating it for every future level, with nothing in the editor UI or the schema validator
flagging an unedited placeholder before save.

## Repro steps

1. Open the Neon Trail level editor canvas and click "New" to scaffold a level.
2. Save without touching the subtitle field.
3. Note the saved file's `subtitle` is literally `"Untitled signal"`.

## Expected

Either the template should leave `subtitle` empty/omit it (forcing the author to fill it in
before the document validates), or the validator/editor should warn when a subtitle still matches
the template's default string.

## Actual

A level can be saved and shipped with the literal placeholder subtitle with no warning anywhere
in the pipeline, exactly reproducing the Green Grass bug for the next level someone authors.

## Suggested fix

Add a validator check (or an editor-side lint) that flags `subtitle === "Untitled signal"` as an
`invalid-value`/warning-level issue, the same way other placeholder-detection is proposed for
issue #4, so the fix addresses the template itself rather than only the one already-shipped level.
