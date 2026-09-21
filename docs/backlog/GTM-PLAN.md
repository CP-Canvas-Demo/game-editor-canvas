# Neon Trail — Go-to-Market Plan

## Positioning

Neon Trail is a synthwave arcade game: guide a growing trail of colorful segments
through neon-lit arenas, eating food to grow, matching food colors to safely pass roaming
enemies, and — on levels that support it — dropping into a first-person "scan view" mid-run to
find and clear breakable crystals. It combines a familiar, easy-to-learn core loop (classic
grid-based trail/growth gameplay) with a visual hook (the synthwave arena and the first-person
twist) that differentiates it from a plain retro clone.

**Target audience:** players who enjoy short, skill-based arcade sessions (the classic
"just one more run" genre) and are drawn to strong visual/audio presentation. Secondary audience:
web-game aggregator browsers (itch.io, browser game portals) looking for a quick, no-install
play session.

**One-line pitch:** *A neon arcade trail-runner where matching colors keeps you alive, and
switching perspective mid-run reveals the way through.*

## Current state

- 3 playable levels (`Afterglow Alley`, `Mirror Metro`, `Green Grass`), authored as versioned JSON
  and editable via the in-app Canvas level editor.
- Two progression modes: campaign (levels chain together, score carries over) and single level.
- Best scores persisted per level in `localStorage`.
- Keyboard-only controls; no audio; no mobile/touch support yet (see the bug/enhancement backlog
  in `docs/backlog/issues/` for the concrete gaps found during this QA pass — several of them,
  such as the level-select layout and the lack of mobile controls, directly affect how ready the
  game is to show to an outside audience).

## Launch readiness checklist

| Area | Status | Notes |
| --- | --- | --- |
| Core gameplay loop | Ready | Movement, food, enemies, objectives all function correctly across all 3 levels. |
| Content volume | Needs work | Only 3 levels; see `28-gtm-content-roadmap-more-levels.md`. |
| Level select UI at scale | Blocked | Breaks once a 4th level is added; see `02-level-select-overflow-4-plus-levels.md` — fix before adding more levels. |
| Audio | Missing | See `11-no-audio-at-all.md`. |
| Mobile/touch support | Missing | See `10-no-touch-mobile-controls.md`. |
| Accessibility (color, pace) | Missing | See `12-no-colorblind-friendly-palette.md`, `13-no-difficulty-speed-options.md`. |
| Onboarding | Missing | See `14-no-onboarding-tutorial.md`. |
| Shareability (social preview, trailer) | Missing | See `26-gtm-trailer-capture.md`, `27-gtm-social-preview-metadata.md`. |
| CI / quality gates | Missing | See `19-no-ci-workflow.md`. |

## Suggested sequencing

1. **Fix the level-select overflow bug** (`02-...md`) before authoring any new levels — otherwise
   new content immediately breaks the menu.
2. **Close the highest-priority gaps**: level-select scaling, first-person-only dead-data
   validation, CI, and the hard-coded layout tech debt, since these affect every later step.
3. **Content pass**: author 5-10 additional levels (`28-...md`) once the level select can handle
   them.
4. **Presentation pass**: add audio (`11-...md`), colorblind-friendly shapes (`12-...md`), an
   onboarding screen (`14-...md`), and mobile controls (`10-...md`).
5. **Go-to-market assets**: positioning statement, landing page, trailer/GIF, social preview
   metadata (`24-...md` through `27-...md`).
6. **Feedback loop**: basic analytics and an issue template for player reports (`29-...md`,
   `30-...md`) so post-launch iteration is driven by real data.

## Success metrics (once shipped)

- Level-1 (Afterglow Alley) completion rate.
- Average session length and levels-per-session.
- Campaign-mode completion rate (all 3+ levels cleared in one run).
- Return-visit rate (players who come back for a second session).

These require the basic analytics work tracked in `29-gtm-basic-analytics.md` to measure.
