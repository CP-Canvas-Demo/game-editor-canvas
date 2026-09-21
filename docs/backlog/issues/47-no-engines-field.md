# 47. package.json has no `engines` field pinning a supported Node version

**Type:** tech-debt
**Priority:** p3
**Labels:** tech-debt, priority: p3

## Summary

`package.json` declares dependencies on `vite@^7.1.7` and `vitest@^3.2.4`, both of which have
minimum supported Node.js versions, but there is no `engines` field declaring which Node versions
this project supports. A contributor on an older Node install has no early signal from `npm
install`/`npm run dev` about why something might fail — they'd only discover it via a confusing
runtime or install-time error.

## Expected

`package.json` should declare an `engines.node` range matching what Vite 7/Vitest 3 actually
require, so `npm install` can warn early on an unsupported Node version.

## Actual

Node version compatibility is undocumented anywhere in the repository.

## Suggested fix

Add an `"engines": { "node": ">=20" }`-style field (matching whatever the actual minimum is for
the pinned Vite/Vitest versions), and consider an `.nvmrc` for contributors using `nvm`.
