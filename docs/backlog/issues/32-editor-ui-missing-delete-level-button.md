# 32. Level editor's visual UI has no button wired to its own delete-level action

**Type:** bug
**Priority:** p2
**Area:** levels
**Labels:** bug, priority: p2, area: levels

## Summary

The level editor backend fully supports deleting a level: `levelStore.mjs` exports
`deleteLevel()`, `extension.mjs` registers a `delete_level` canvas action and a
`POST /api/delete` HTTP endpoint, and `ui/editor.js`'s `api` object even defines
`remove: (id) => request("POST", "/api/delete", { id })`. However, `api.remove` is never called
anywhere else in `editor.js`, and neither `ui/index.html` nor `ui/editor.css` contain any
"delete"/"remove" button or control. The only way to actually delete a level is to ask Copilot
chat to invoke the `delete_level` canvas action directly — the visual panel itself offers no path
to it.

## Repro steps

1. Open the Neon Trail level editor canvas.
2. Look for any button, menu item, or control to delete the currently open level.
3. Search `ui/index.html` / `ui/editor.css` for "delete" or "remove" — no matches.

## Expected

A visible "Delete level" control in the editor panel (with a confirmation step, since deletion is
destructive) that calls the already-implemented `api.remove`/`delete_level` path.

## Actual

The delete capability exists end-to-end in the backend and the client's API layer, but is
completely unreachable from the UI a player/author actually sees.

## Suggested fix

Add a delete button (e.g. in the level list panel, next to each entry) that calls `api.remove(id)`
after a confirmation prompt, mirroring how the existing `create`/`save` buttons are wired.
