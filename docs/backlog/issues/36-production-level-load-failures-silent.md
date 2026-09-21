# 36. Level-load failures are completely silent to players in production builds

**Type:** bug
**Priority:** p2
**Area:** levels
**Labels:** bug, priority: p2, area: levels

## Summary

`src/game/levels/index.ts`'s `loadLevels()` collects failures for invalid JSON, levels that fail
schema validation, duplicate level ids, and manifest entries pointing at unknown ids. In dev mode
these throw a hard error (`if (import.meta.env?.DEV) throw new Error(...)`), which is good for
catching authoring mistakes immediately. But in a production build, the same failures only reach
`console.error(...)` — the game continues to run with whichever levels *did* load successfully,
and the player sees nothing indicating a level is missing or broken.

## Repro steps

1. Ship a build where one level file has invalid JSON, or two levels share the same `id`, or
   `manifest.json` references an id that no longer exists (e.g. after a rename that missed
   updating the manifest — see also the level editor's rename/delete flows).
2. Run `npm run build` and open the production build.
3. Observe that the affected level(s) are just missing from the level-select screen; only the
   browser devtools console shows any indication why.

## Expected

A production build with a broken level should surface *something* player-visible — even a small,
dismissible in-app banner ("1 level failed to load — see console") — rather than relying entirely
on a console message no player will ever open.

## Actual

The failure is invisible outside of devtools; a player (or a QA pass without console access)
would simply see fewer levels than expected with no explanation.

## Suggested fix

Surface `LEVEL_LOAD_FAILURES.length` (already exported from `levels/index.ts`) as a small warning
banner in `MenuScene`, shown whenever it's non-zero, in addition to the existing console logging.
