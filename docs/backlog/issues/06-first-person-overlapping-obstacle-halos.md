# 06. First-person view renders adjacent obstacles as an indistinct overlapping blob

**Type:** bug  
**Priority:** p3  
**Area:** ui  
**Labels:** bug, priority: p3, area: ui

## Summary

In `drawFirstPerson()`, every rendered obstacle/food/enemy gets its own large translucent "glow" circle behind it. When two or more obstacles are adjacent (a very common authoring pattern for walls), their glow circles overlap and merge into a single blurred shape, making it hard to tell how many distinct obstacles are ahead or where their edges are.

## Repro steps

1. Load Mirror Metro and switch to first-person view (`V`) while facing the multi-segment "spine" wall or crystal cluster.
2. Observe the wall/crystal cluster render as one blurred mass instead of 3 distinct shapes (see attached screenshot).

## Expected

Adjacent obstacles should remain visually distinguishable in first-person view (e.g. via a defined edge, spacing, or reduced/removed background glow when clustered).

## Actual

The translucent glow circles (`fillStyle(item.color, 0.25).fillCircle(x, y, size * 1.55)`) overlap and blend, especially at close range, producing a single indistinct pink/purple blob for a run of wall segments.

## Screenshot

![First-person view renders adjacent obstacles as an indistinct overlapping blob](../screenshots/05-first-person-view.png)

## Suggested fix

Either drop the per-object background glow for `barrier`/`crystal` types (keep it for `food`/`enemy` where it reads fine), or draw a single merged silhouette per contiguous obstacle run instead of one glow per cell.
