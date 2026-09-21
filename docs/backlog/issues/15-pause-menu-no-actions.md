# 15. Pause screen offers no actions beyond resuming

**Type:** enhancement  
**Priority:** p3  
**Area:** ui  
**Labels:** enhancement, priority: p3, area: ui

## Summary

`togglePause()` only ever sets a static "PAUSED\nSpace / P to resume" message; there is no menu of options while paused (restart level, quit to level select, adjust any setting) beyond the global `Esc` shortcut, which is not mentioned on the pause screen itself.

## Expected

Pausing should present a small menu of common actions (Resume, Restart Level, Quit to Level Select) rather than only a static text message.

## Actual

The only way to leave a paused run is to already know that `Esc` works globally; the pause message does not advertise it.

## Suggested next step

Extend the pause message/overlay to list all available actions, including the existing `Esc` shortcut, and consider adding a "restart" shortcut directly from pause.
