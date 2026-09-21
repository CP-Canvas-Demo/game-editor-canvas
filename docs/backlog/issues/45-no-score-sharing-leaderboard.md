# 45. No score-sharing or leaderboard — best scores are purely local

**Type:** enhancement
**Priority:** p3
**Area:** gameplay
**Labels:** enhancement, priority: p3, area: gameplay

## Summary

`src/game/storage.ts`'s `recordBestScore()`/`loadBestScores()` persist best scores only in the
current browser's `localStorage`, keyed per level id. There is no way to share a score, compare
with anyone else, or see it survive a cleared browser profile or a different device.

## Expected

Some lightweight way to compare scores beyond the local machine — even something as simple as a
"copy my score as text" share action, or eventually a small hosted leaderboard per level.

## Actual

Best scores are invisible to anyone but the single player on the single browser that earned them.

## Suggested next step

Start with a low-effort win: a "share score" button on the level-clear overlay that copies a
short shareable string (level name + score) to the clipboard. A hosted leaderboard is a larger,
separate effort that depends on the analytics/backend work tracked elsewhere in this backlog.

---
_Full record: `docs/backlog/issues/45-no-score-sharing-leaderboard.md`_
