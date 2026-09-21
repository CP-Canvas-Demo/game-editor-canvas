# 48. No CONTRIBUTING.md or PR template despite an established PR-based workflow

**Type:** tech-debt
**Priority:** p3
**Labels:** tech-debt, priority: p3

## Summary

The repository's git history already contains two prior feature PRs (adding the snake game and
adding the level editor/JSON level files), and `README.md`'s level editor section explicitly
documents a "commit the result and open a PR like any other change" workflow. Despite this, there
is no `CONTRIBUTING.md` and no `.github/pull_request_template.md` describing how to set up the
project, run tests/build before submitting, or what a good level-editor PR should include.

## Expected

A short `CONTRIBUTING.md` covering local setup (`npm install`, `npm test`, `npm run build`),
expectations for level-editor-authored PRs (e.g. "run the validator before committing"), and
optionally a PR template checklist.

## Actual

Anyone contributing for the first time has to reverse-engineer expectations from `README.md` and
prior PR history alone.

## Suggested fix

Add `CONTRIBUTING.md` with setup/test/build instructions and a short section specifically about
level-editor-authored changes, plus a `.github/pull_request_template.md` with a basic checklist.
