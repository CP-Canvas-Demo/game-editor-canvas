# 46. No LICENSE file in the repository

**Type:** tech-debt
**Priority:** p2
**Labels:** tech-debt, priority: p2

## Summary

There is no `LICENSE` (or `LICENSE.md`) file anywhere in the repository. `package.json` marks the
project `"private": true`, but that only controls npm publish behavior — it says nothing about
reuse, redistribution, or modification terms for the source itself.

## Expected

A `LICENSE` file stating clear terms, so anyone who clones, forks, or receives a copy of this
repository (including moving it to a different host or organization) knows what they're allowed
to do with it.

## Actual

Licensing terms are entirely unspecified, which is exactly the kind of gap that surfaces the
moment a repository like this one is moved, shared, or handed to someone else.

## Suggested fix

Add a `LICENSE` file with terms appropriate for the project's intended use, and reference it from
`README.md`.
