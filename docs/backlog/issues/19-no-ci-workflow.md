# 19. No CI workflow runs tests or the build on pull requests

**Type:** tech-debt  
**Priority:** p2  
**Labels:** tech-debt, priority: p2

## Summary

There is no `.github/workflows/` directory in the repository, so `npm test` and `npm run build` (which also runs `tsc --noEmit`) are never automatically verified on pushes or pull requests — they only run if a contributor remembers to run them locally.

## Expected

Every pull request should automatically run `npm test` and `npm run build` and block merge on failure.

## Actual

Regressions in gameplay logic, level validation, or the TypeScript build can be merged without any automated check catching them first.

## Suggested fix

Add a GitHub Actions workflow that runs `npm ci`, `npm test`, and `npm run build` on every push and pull request.
