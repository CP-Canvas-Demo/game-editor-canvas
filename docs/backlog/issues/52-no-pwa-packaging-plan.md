# 52. No PWA / installable packaging plan

**Type:** gtm
**Priority:** p3
**Labels:** gtm, priority: p3

## Summary

The game is a fully client-side Vite-built Phaser app with no server-side dependencies at runtime
(scores/progress already live in `localStorage`) — a strong natural fit for a Progressive Web App
(installable, offline-capable). Currently there is no web app manifest, no service worker, and
`index.html` has no PWA-related meta tags.

## Expected

A plan (and eventually implementation) for PWA packaging: a manifest with icons/theme color, a
basic offline-caching service worker for the built assets, so the game can be "installed" on
desktop/mobile and played offline.

## Actual

The game only works as a regular web page, requires network access on every load, and cannot be
installed as an app.

## Suggested next step

Add a `manifest.webmanifest` and a minimal service worker (Vite has PWA plugins that automate
most of this), then verify installability via browser dev tools.
