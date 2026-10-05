# 07: Shareable log

**What to build:** The app keeps a rolling log file that I can send from Settings with "Share log", so I can report a bug from the dorm without the Beelink. The log never holds note content. See the spec's Logging section.

**Blocked by:** 06 (Pen test screen)

**Status:** done

**Touches:** app-logging, app-settings

**Effort:** low

- [x] Logger with debug, info, warning and error levels writing to a rolling file in the app's private storage, capped at a few MB
- [x] Opening and closing a Document (file name only), page render times and errors are logged with what was being done
- [x] No stroke data, page images or clipboard text is ever logged
- [x] "Share log" in Settings sends the file through the Android share menu
- [x] Unit tests for the size cap and rotation
