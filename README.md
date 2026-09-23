# Learn with the Copilot canvas

This repo is a small Phaser game used as a learning example. The game is only the illustration.

## Canvas exercises

Try these two canvas exercises in **separate Copilot sessions** so each can work independently.
After starting them, return to this session and explore the built-in Neon Trail level editor
below while the other sessions work. The level editor is already available; you do not need to
wait for either new canvas to be created.

### 1. Visualize the game logic

In a separate session, use `/create-canvas` to create a visual representation of the game's code
logic and flow. Ask Copilot to trace a few important paths through the game and show how the
relevant parts connect. **GPT-5.6 Luna** is a suggested smaller model for this exercise.

### 2. Explore the issue backlog

In another separate session, use `/create-canvas` to create a simple project-level Issue Backlog
canvas for `CP-Canvas-Demo/game-editor-canvas`. It should show live open GitHub issues in a
searchable list with each issue's number, title, and labels. Add a **Summarize with Copilot**
button that summarizes an issue only when clicked and displays the result in the canvas.

Keep this canvas strictly read-only: it must not create or edit issues, post comments or
reactions, change labels, or write to the repository. It must not run anything automatically
when opened or refreshed. Follow the repository's existing canvas patterns, but leave the
Neon Trail level-editor canvas untouched. Keep the implementation small and use the Copilot App's
supported integration.

## Learning objective

While those sessions work, use the already-provisioned **Neon Trail level editor** canvas in the
Copilot app to create a new level configuration file for the repo.

1. Ask Copilot to open the **Neon Trail level editor** canvas.
2. Choose **New**, edit the grid and level details, then fix any validation messages.
3. Select **Save to repo**.
4. Review the new JSON file in `src/game/levels/`

The canvas edits real JSON files in the working tree. There is no export step.

### What the level editor does

It is a visual editor for level configuration files. You can paint the map, set the objective,
edit food and spawn rules, reorder campaign levels, and check validation issues before saving.

For the game details and controls, see [`docs/GAME_GUIDE.md`](docs/GAME_GUIDE.md). For the JSON
schema, see [`docs/LEVEL_FORMAT.md`](docs/LEVEL_FORMAT.md).
