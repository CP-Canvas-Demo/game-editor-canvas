# 21. No linter or formatter (ESLint/Prettier) configured for the codebase

**Type:** tech-debt  
**Priority:** p3  
**Labels:** tech-debt, priority: p3

## Summary

The only static check configured is `tsc --noEmit` (type-checking). There is no ESLint config, no Prettier config, and no lint script in `package.json`, so style and common bug-pattern issues (unused variables, inconsistent formatting, etc.) are not automatically enforced.

## Expected

The project should have a lint script (and ideally a formatter) that catches common issues and keeps style consistent as more contributors touch the code.

## Actual

There is no automated way to catch lint-level issues before they are merged; consistency currently depends entirely on manual review.

## Suggested fix

Add ESLint (with the TypeScript plugin) and Prettier, wire up an `npm run lint` script, and optionally add it to the CI workflow proposed separately in this backlog.
