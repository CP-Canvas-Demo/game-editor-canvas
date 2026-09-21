# Neon Trail — QA backlog and GTM plan

This folder is the portable, human-readable record of a full QA pass over the game (bugs,
improvements, and tech debt) plus a go-to-market plan, written as plain markdown so it stays
usable even if this repository is moved or exported elsewhere. Each item here was also opened as
a labeled GitHub issue in this repository; the markdown files are the durable source of truth.

- [`GTM-PLAN.md`](./GTM-PLAN.md) — positioning, launch readiness checklist, and suggested
  sequencing.
- [`issues/`](./issues/) — one markdown file per backlog item (54 total), each with a summary,
  repro steps where applicable, expected/actual behaviour, and a suggested fix or next step.
- [`screenshots/`](./screenshots/) — screenshots captured during the QA pass, referenced from the
  relevant issue files.

## How this was produced

The QA pass combined:
1. Static review of the gameplay logic, scenes, level schema, and level data
   (`src/game/logic.ts`, `src/scenes/GameScene.ts`, `src/scenes/MenuScene.ts`,
   `src/game/levelSchema.mjs`, `docs/LEVEL_FORMAT.md`, and all shipped level JSON files).
2. A live, automated pass against the running dev server (menu navigation, all 3 levels, pause,
   first-person view, objective completion, and a stress test of the level-select screen with
   more levels than currently ship) using browser automation, with screenshots captured for
   confirmed findings.
3. The existing automated test suite (`npm test`, 18 tests) and production build
   (`npm run build`) as a baseline — both pass cleanly as of this writing.
4. A second pass reading the Copilot canvas level editor internals
   (`.github/extensions/level-editor/{extension.mjs,levelStore.mjs,ui/editor.js,ui/index.html}`),
   `src/main.ts`, `src/game/storage.ts`, `src/game/levels/index.ts`, `index.html`,
   `package.json`, and deeper sections of `levelSchema.mjs`/`GameScene.ts`/`MenuScene.ts`,
   surfacing a further round of findings (items 31-54).

## Summary by type

| Type | Count | Description |
| --- | --- | --- |
| `bug` | 18 | Confirmed defects in gameplay logic, validation, or rendering. |
| `enhancement` | 14 | Missing features / UX gaps worth adding. |
| `tech-debt` | 10 | Engineering health items (tooling, structure, build). |
| `gtm` | 12 | Go-to-market backlog items (positioning, content, presentation, feedback loop). |

## Index

| # | Title | Type | Priority | Area |
| --- | --- | --- | --- | --- |
| [01](./issues/01-green-grass-placeholder-subtitle.md) | Green Grass level ships with a placeholder subtitle ("Untitled signal") | bug | p2 | levels |
| [02](./issues/02-level-select-overflow-4-plus-levels.md) | Level select screen overlaps footer UI and clips off-canvas once 4+ levels exist | bug | p1 | ui |
| [03](./issues/03-requires-first-person-hud-dead-flag.md) | Objective flag `requiresFirstPerson` has no observable effect despite docs claiming it changes the HUD | bug | p3 | levels |
| [04](./issues/04-first-person-only-food-dead-data-unvalidated.md) | Validator catches one "dead data" case for first-person content but not its sibling case | bug | p2 | levels |
| [05](./issues/05-enemy-edible-after-spark-day-one.md) | Enemies with `edibleAfterFood: "spark"` are safe to eat before collecting any food | bug | p3 | gameplay |
| [06](./issues/06-first-person-overlapping-obstacle-halos.md) | First-person view renders adjacent obstacles as an indistinct overlapping blob | bug | p3 | ui |
| [07](./issues/07-first-person-toggle-works-while-paused.md) | First-person view can still be toggled with `V` while the game is paused | bug | p3 | gameplay |
| [08](./issues/08-hud-length-shows-projected-not-actual.md) | HUD "LENGTH" stat shows a projected value instead of the snake's actual current length | bug | p3 | ui |
| [09](./issues/09-enemies-can-stack-same-cell.md) | Multiple enemies can occupy the same grid cell because patrol movement never checks other enemies | bug | p3 | gameplay |
| [10](./issues/10-no-touch-mobile-controls.md) | No touch/mobile controls despite shipping a mobile-friendly viewport meta tag | enhancement | p2 | accessibility |
| [11](./issues/11-no-audio-at-all.md) | The game has no audio: no music, no sound effects | enhancement | p2 | audio |
| [12](./issues/12-no-colorblind-friendly-palette.md) | No colorblind-friendly palette or shape-based distinction for food/enemy/crystal colors | enhancement | p2 | accessibility |
| [13](./issues/13-no-difficulty-speed-options.md) | No difficulty or speed adjustment options for players who need a slower pace | enhancement | p3 | accessibility |
| [14](./issues/14-no-onboarding-tutorial.md) | No onboarding or tutorial for first-time players | enhancement | p2 | ui |
| [15](./issues/15-pause-menu-no-actions.md) | Pause screen offers no actions beyond resuming | enhancement | p3 | ui |
| [16](./issues/16-no-confirmation-discarding-run.md) | Esc instantly discards an in-progress run with no confirmation | enhancement | p3 | ui |
| [17](./issues/17-enemy-patrol-paths-invisible.md) | Enemy patrol paths are invisible until a player physically encounters them | enhancement | p3 | gameplay |
| [18](./issues/18-single-large-js-bundle.md) | Production build emits a single ~1.24 MB JS chunk with no code-splitting | tech-debt | p3 | — |
| [19](./issues/19-no-ci-workflow.md) | No CI workflow runs tests or the build on pull requests | tech-debt | p2 | — |
| [20](./issues/20-no-e2e-scene-test-coverage.md) | No automated test coverage for GameScene or MenuScene, only for pure logic | tech-debt | p2 | — |
| [21](./issues/21-no-linter-formatter-configured.md) | No linter or formatter (ESLint/Prettier) configured for the codebase | tech-debt | p3 | — |
| [22](./issues/22-gamescene-mixes-concerns.md) | GameScene.ts mixes rendering, input handling, and simulation logic in one 450-line file | tech-debt | p3 | — |
| [23](./issues/23-hardcoded-layout-no-overflow-handling.md) | UI layout uses hard-coded pixel offsets with no responsive or overflow handling | tech-debt | p2 | — |
| [24](./issues/24-gtm-define-positioning.md) | Define target audience and a one-line positioning statement | gtm | p2 | — |
| [25](./issues/25-gtm-landing-page.md) | Build a simple landing/store page with screenshots and a feature summary | gtm | p2 | — |
| [26](./issues/26-gtm-trailer-capture.md) | Produce a short gameplay capture (trailer or looping GIF) for sharing | gtm | p3 | — |
| [27](./issues/27-gtm-social-preview-metadata.md) | Add social preview metadata (Open Graph tags) to index.html | gtm | p3 | ui |
| [28](./issues/28-gtm-content-roadmap-more-levels.md) | Plan a content roadmap: author 5-10 additional levels beyond the current 3 | gtm | p2 | levels |
| [29](./issues/29-gtm-basic-analytics.md) | Set up lightweight, privacy-respecting analytics (levels played, completion rate, session length) | gtm | p3 | — |
| [30](./issues/30-gtm-feedback-channel-issue-template.md) | Set up a feedback channel and a GitHub issue template for player-reported bugs | gtm | p3 | — |
| [31](./issues/31-editor-template-still-ships-placeholder-subtitle.md) | Level editor's "new level" template still hard-codes the placeholder subtitle behind bug #4 | bug | p3 | levels |
| [32](./issues/32-editor-ui-missing-delete-level-button.md) | Level editor's delete-level API is defined but unreachable from the UI | bug | p2 | levels |
| [33](./issues/33-menu-navigation-breaks-with-zero-levels.md) | Level-select navigation divides by level count with no guard against zero levels | bug | p2 | ui |
| [34](./issues/34-level-card-text-no-wordwrap.md) | Level card title/subtitle text has no word-wrap and can overflow the card | bug | p3 | ui |
| [35](./issues/35-schema-missing-enemy-overlap-validation.md) | Level schema validates obstacle/snake overlap but not enemy overlap | bug | p2 | levels |
| [36](./issues/36-production-level-load-failures-silent.md) | Level load failures are silently swallowed in production builds | bug | p2 | levels |
| [37](./issues/37-breakable-crystal-dead-data-third-case.md) | A third "first-person dead data" case (breakable crystals) is unvalidated | bug | p2 | levels |
| [38](./issues/38-food-spawn-ignores-cleared-crystal-cells.md) | Food spawn logic ignores cells freed by broken crystals | bug | p3 | gameplay |
| [39](./issues/39-direction-queue-checks-committed-not-queued-direction.md) | Direction-queue guard checks the committed direction instead of the queued one, allowing reversal | bug | p2 | gameplay |
| [40](./issues/40-no-level-thumbnails.md) | No level thumbnail/preview art on level-select cards | enhancement | p3 | ui |
| [41](./issues/41-no-key-remapping.md) | No key remapping or alternate control scheme | enhancement | p3 | accessibility |
| [42](./issues/42-no-first-person-indicator-on-cards.md) | Level-select cards don't indicate whether a level uses first-person view | enhancement | p3 | ui |
| [43](./issues/43-editor-no-duplicate-level-action.md) | Level editor has no "duplicate level" action | enhancement | p3 | levels |
| [44](./issues/44-editor-no-realtime-resize-warning.md) | Level editor doesn't warn in real time when a grid resize strands existing entities | enhancement | p3 | levels |
| [45](./issues/45-no-score-sharing-leaderboard.md) | No score-sharing or leaderboard — best scores are purely local | enhancement | p3 | gameplay |
| [46](./issues/46-no-license-file.md) | No LICENSE file in the repository | tech-debt | p2 | — |
| [47](./issues/47-no-engines-field.md) | package.json has no `engines` field pinning a supported Node version | tech-debt | p3 | — |
| [48](./issues/48-no-contributing-guide.md) | No CONTRIBUTING.md or PR template despite an established PR-based workflow | tech-debt | p3 | — |
| [49](./issues/49-serializer-roundtrip-claim-untested.md) | README's "empty diff on unchanged save" claim has no automated test | tech-debt | p3 | — |
| [50](./issues/50-no-changelog-versioning.md) | No CHANGELOG or versioning practice | gtm | p3 | — |
| [51](./issues/51-no-localization-plan.md) | No localization/i18n plan — all text is hard-coded English | gtm | p3 | — |
| [52](./issues/52-no-pwa-packaging-plan.md) | No PWA / installable packaging plan | gtm | p3 | — |
| [53](./issues/53-level-editor-as-community-pipeline.md) | The level editor as a community-content pipeline is undersold | gtm | p3 | — |
| [54](./issues/54-no-competitive-differentiation-writeup.md) | No competitive/differentiation write-up vs. other browser snake-likes | gtm | p3 | — |

## Labels used

- **Type:** `bug`, `enhancement`, `tech-debt`, `gtm`
- **Priority:** `priority: p1`, `priority: p2`, `priority: p3`
- **Area:** `area: gameplay`, `area: ui`, `area: levels`, `area: audio`, `area: accessibility`
