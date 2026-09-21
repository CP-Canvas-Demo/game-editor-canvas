# Learn with the Copilot canvas

This repo is a small Phaser game used as a learning example. The game is only the illustration.

## Learning objective

Use the **Neon Trail level editor** canvas in the Copilot app to create a new level configuration
file for the repo.

1. Ask Copilot to open the **Neon Trail level editor** canvas.
2. Choose **New**, edit the grid and level details, then fix any validation messages.
3. Select **Save to repo**.
4. Review the new JSON file in `src/game/levels/`, then commit it or open a pull request.

The canvas edits real JSON files in the working tree. There is no export step.

## What the level editor does

It is a visual editor for level configuration files. You can paint the map, set the objective,
edit food and spawn rules, reorder campaign levels, and check validation issues before saving.

For the game details and controls, see [`docs/GAME_GUIDE.md`](docs/GAME_GUIDE.md). For the JSON
schema, see [`docs/LEVEL_FORMAT.md`](docs/LEVEL_FORMAT.md).
