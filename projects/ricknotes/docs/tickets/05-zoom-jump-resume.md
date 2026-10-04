# 05: Zoom, jump and resume

**What to build:** Inside a Document I can pinch to zoom, and pages become sharp again shortly after I stop. A page indicator shows where I am, I can jump to a page number, and each Document reopens at the page and zoom I left it. This completes milestone 1.

**Blocked by:** 04 (Read a Document)

**Status:** done

**Touches:** app-viewer, app-settings

**Effort:** medium

- [x] Pinch zoom between a sensible minimum and maximum, centred on the fingers
- [x] Visible pages re-render at the new resolution once a zoom settles; blurry pages are never left behind
- [x] Page indicator, and a jump-to-page action
- [x] Last page and zoom saved per Document and restored when it reopens
- [x] **Milestone 1 gate**, written in the PR for the owner: a 100-page lecture scrolls and zooms smoothly with no stutter in the Preview app

**Owner steps:** run the milestone 1 gate on the tablet with the Preview app from the PR.
