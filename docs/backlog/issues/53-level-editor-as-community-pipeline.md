# 53. The level editor as a community-content pipeline is undersold

**Type:** gtm
**Priority:** p3
**Labels:** gtm, priority: p3

## Summary

The project already has a genuinely capable level editor (a Copilot canvas extension backed by a
real JSON schema, validator, and byte-stable serializer) that lets anyone author a new level and
land it via a normal PR. This is a real differentiator — most small browser games don't ship with
an authoring tool at all — but it isn't currently positioned or communicated as a way to grow the
game's content through outside contributions.

## Expected

A short write-up (in `README.md` or a dedicated `docs/CONTRIBUTING-LEVELS.md`) framing the level
editor as the intended path for growing the level roster, with a lightweight call-to-action for
anyone interested in authoring a level.

## Actual

The level editor is documented as a tool, but not positioned as a growth/community mechanism.

## Suggested next step

Add a short section (or standalone doc) explicitly inviting level contributions through the
editor, with a walkthrough link to the existing `README.md` level editor instructions.
