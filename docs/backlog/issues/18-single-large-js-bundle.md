# 18. Production build emits a single ~1.24 MB JS chunk with no code-splitting

**Type:** tech-debt  
**Priority:** p3  
**Labels:** tech-debt, priority: p3

## Summary

`npm run build` succeeds but Rollup warns that `dist/assets/index-*.js` (1,242.86 kB, 341.12 kB gzip) exceeds the 500 kB chunk-size warning threshold. Phaser itself accounts for most of this, and the whole engine plus both scenes ship as one blocking chunk.

## Notes

`npm run build` and read the console output.

## Expected

The build should not warn about oversized chunks, and initial load should not require downloading the entire game + engine before anything is interactive.

## Actual

A single ~1.24 MB (341 KB gzip) JS chunk is downloaded and parsed before the menu can render.

## Suggested fix

Configure `build.rollupOptions.output.manualChunks` to split Phaser into its own vendor chunk, and consider dynamic `import()` for `GameScene` so the menu can render before the gameplay code is fetched.
