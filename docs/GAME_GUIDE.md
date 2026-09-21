# Neon Trail game guide

A synthwave browser game where you guide a growing trail of colorful segments through neon arenas.

## Run it

```bash
npm install
npm run dev
```

Use `npm run build` for a production bundle and `npm test` for the gameplay-logic tests.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / WASD | Steer (and move the level-select cursor) |
| `Enter` | Start the selected level, or retry / advance after a level ends |
| `M` | Toggle progression mode on the level select |
| `Space` or `P` | Pause or resume |
| `V` | Toggle first-person scan view |
| `Esc` | Return to the level select |

Food adds one or more trail segments and gives new segments its color. Matching the most recently collected food color lets you safely consume the corresponding roaming character. First-person scan view is especially important in the second stage: pass through glowing crystals while in that view to clear them.

## Level select and progression

The game opens on a level select screen. Every level is always unlocked, and each card shows its
objective, grid size, tick speed, and your best score. Press `M` to switch progression mode:

- **Campaign** — clearing a level rolls straight into the next one and your score carries over.
- **Single level** — clearing a level returns you to the level select and each run starts at zero.

The chosen mode and your per-level best scores are stored in `localStorage`.

## Levels

Levels are authored as standalone, versioned JSON documents in `src/game/levels/` — one file per
level, plus a `manifest.json` that defines campaign order. Every `.json` file in that folder is
discovered automatically, validated against the schema in `src/game/levelSchema.mjs`, and exposed
through the registry in `src/game/levels/index.ts`.

Each level defines its grid, tick speed, starting trail, obstacles, enemies, food table, weighted
spawn rules, objective, and first-person availability.

**See [`LEVEL_FORMAT.md`](LEVEL_FORMAT.md)** for the full schema reference, gameplay semantics,
validation error codes, and the editor read/write contract.

## Level editor

`.github/extensions/level-editor/` is a Copilot canvas extension that edits these files visually.
Ask Copilot to open the **Neon Trail level editor** canvas, optionally naming a level to open.

The left panel lists levels and campaign order. The middle grid lets you paint walls, crystals,
enemies, trails, patrol paths, and spawn regions. The right panel edits metadata, objectives,
food, spawn rules, and validation issues.

Use **Save to repo** to write `src/game/levels/<id>.json`. The canvas validates the level before
saving, so the file is ready to commit and review in a pull request.
