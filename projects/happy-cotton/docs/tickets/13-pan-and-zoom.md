# 13: Pan and zoom the field

**What to build:** Like Hay Day, the player can look around the field: drag to pan, and pinch (phone) or scroll the mouse wheel (desktop) to zoom in and out. The camera keeps its angle, never rotates, and can't be moved or zoomed so far that the field leaves the screen. Moving the view never plants or picks by accident: a tap counts only when the finger or mouse lifts without having moved (spec: stories 11, 88, 89).

**Blocked by:** 05 (Grounded field look)

**Status:** ready

**Touches:** adapters/field

**Effort:** medium

- [ ] Dragging with one finger or the left mouse button pans the camera across the ground; the view follows the pointer (the ground under the finger stays under it)
- [ ] Pinch with two fingers, or the mouse wheel, zooms towards the point between the fingers or under the mouse
- [ ] The camera's angle never changes; there is no rotation
- [ ] Pan and zoom are clamped: the field always stays at least partly on screen, zoom stays between a near and far limit; the limits are named values in one place, not scattered numbers
- [ ] A tap on a plot counts on release, and only if the pointer moved less than a small threshold since the press; a drag or pinch never plants or picks
- [ ] Taps on The App overlay's buttons still go to the overlay, not to the field or the camera
- [ ] Tests cover the tap-versus-drag decision and the clamping (the pure parts, without a scene), following the existing adapter tests
- [ ] Works with touch in a phone browser and with mouse and wheel on desktop in the web export (record what was checked in the PR)
