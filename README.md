# Learn with the Copilot canvas

This repo is a small Phaser game used as a learning example. The game is only the illustration.

**Prerequisite:** These exercises use the Copilot App as the example host. Add
`CP-Canvas-Demo/game-editor-canvas` to the Copilot App, then start a session for the repository.

## Canvas exercises

Start the first two canvas exercises in **separate Copilot sessions** so each can work
independently. Then return to this session and do exercise 3 with the built-in Neon Trail level
editor while the other sessions work. The level editor is already available; you do not need to
wait for either new canvas to be created.

### 1. Visualize the game logic

In a separate session, use

`--- copy below`

/create-canvas create a visual representation of the code logic and flow, Diagram type: Interactive code flowchart. Show the logic as labeled nodes connected by directed arrows, with branches for decisions and source-file references on each node. Allow selecting a node to view its details.

`---`

**GPT-5.6 Luna** is a suggested smaller model for this exercise. The prompt is open ended, so results will be different across attempts and models. See example [output](game-flow-canvas.png)

### 2. Explore the issue backlog

In another separate session, use the below prompt, try it both in Autopilot and with Plan mode.

`--- copy below`

/create-canvas to create a simple project-level Issue Backlog
canvas. Show a list of live open GitHub issues labeled `bug`, with each issue's number and title. Add an Analyze effort to fix button for each issue.
Only when clicked, Copilot should analyze the effort to fix that bug and return the analysis in
chat, not in the canvas.

`--- `

**GPT-5.6 Luna** is a suggested smaller model for this exercise. The prompt is open ended, so results will be different across attempts and models. See example [output](issue-backlog.png)

Keep this canvas strictly read-only: it must not create or edit issues, post comments or
reactions, change labels, or write to the repository. It must not run anything automatically
when opened or refreshed. Follow the repository's existing canvas patterns.

### 3. Create a level with the Neon Trail editor canvas

While those sessions work, use the already-provisioned **Neon Trail level editor** canvas in the
Copilot app to create a new level configuration file for the repo.

1. Ask Copilot to `open the Neon Trail level editor canvas`.
2. Choose **New**, edit the grid and level details, then fix any validation messages.
3. Select **Save to repo**.
4. Review the new JSON file in `src/game/levels/`

The canvas edits real JSON files in the working tree. There is no export step.

### What the level editor does

It is a visual editor for level configuration files. You can paint the map, set the objective,
edit food and spawn rules, reorder campaign levels, and check validation issues before saving.

For the game details and controls, see [`docs/GAME_GUIDE.md`](docs/GAME_GUIDE.md). For the JSON
schema, see [`docs/LEVEL_FORMAT.md`](docs/LEVEL_FORMAT.md).
