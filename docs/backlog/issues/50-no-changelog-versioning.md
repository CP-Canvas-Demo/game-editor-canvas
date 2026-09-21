# 50. No CHANGELOG or versioning practice

**Type:** gtm
**Priority:** p3
**Labels:** gtm, priority: p3

## Summary

`package.json` pins `"version": "0.0.0"` and there is no `CHANGELOG.md`. As new levels, bugfixes,
and features ship (including everything tracked in this backlog), there's no record of what
changed between releases — useful both for a small internal team and for anyone evaluating the
project's activity/maturity if it's shared more widely.

## Expected

A `CHANGELOG.md` (Keep a Changelog style is fine) updated alongside meaningful merges, plus a
real semantic version in `package.json` bumped as changes ship.

## Actual

There is no way to answer "what changed since last time" other than reading raw git history.

## Suggested next step

Start a `CHANGELOG.md` with an "Unreleased" section, bump `package.json`'s version to `0.1.0`, and
add a lightweight convention (e.g. update the changelog as part of any PR that closes a backlog
item) going forward.
