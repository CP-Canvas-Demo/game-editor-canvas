# 43. Level editor has no "duplicate level" action

**Type:** enhancement
**Priority:** p3
**Area:** levels
**Labels:** enhancement, priority: p3, area: levels

## Summary

The level editor (`extension.mjs`/`levelStore.mjs`) supports creating a brand-new level from the
generic starter template (`create_level`/`createTemplate()`), reading, saving, and deleting a
level — but there's no action to clone an *existing* level as a starting point. Authoring a level
that's a variant of one that already exists (e.g. a harder remix of Afterglow Alley) means
manually recreating every obstacle, enemy, food entry, and spawn rule by hand.

## Expected

A "Duplicate" action that reads an existing level's document, assigns it a new id (and a
"(copy)"-style name), and saves it as a new file — reusing the same validated
read → mutate id/name → `saveLevel()` pipeline `create_level` already uses for templates.

## Actual

The only starting points for a new level are the from-scratch template or manually retyping an
existing level's JSON.

## Suggested next step

Add a `duplicate_level` canvas action (and a matching `POST /api/duplicate` endpoint / UI button)
that takes an existing level's `id`, deep-clones its document with a new `id`/`name`, and calls
the existing `saveLevel()` path.

---
_Full record: `docs/backlog/issues/43-editor-no-duplicate-level-action.md`_
