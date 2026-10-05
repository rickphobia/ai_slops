# 09: Save and reopen

**What to build:** Ink is saved to the **Ink file** beside the PDF 2 seconds after my last stroke and whenever the app goes to the background, always by writing a temporary file and swapping it in. Force-closing and reopening shows all my ink. A failed save shows a "Not saved" warning until it succeeds; a damaged Ink file is never overwritten; a PDF whose page count changed shows a warning. This is the first slice of the Document session (Seam 1). See decision 0003 and the spec's Ink file format.

**Blocked by:** 08 (First ink)

**Status:** done

**Touches:** core-inkfile, core-session, app-viewer

**Effort:** medium

**Owner steps:** run the on-tablet check in the Preview app; add the `.*.tmp` skip filter to FolderSync

- [x] Ink file format as in the spec: format version, PDF page count, page list with stable page IDs, strokes; points packed by `core` itself (difference-encoded integers as text), not with Jetpack Ink's encoding
- [x] The Ink file round-trips exactly (tested)
- [x] Document session: opens a Document path with a clock, loads or starts empty, adds strokes, schedules a save 2 s after the last change, and saves on demand when the app goes to the background
- [x] Safe write: hidden temporary file in the same folder, flushed, then renamed over the Ink file in one step; a stray temporary file is ignored on open (tested with a real temporary folder and a fake clock)
- [x] A failed save keeps the old file, keeps changes in memory, retries, and shows "Not saved" until a save succeeds (tested)
- [x] A damaged Ink file opens the Document read-only with a message, and is never overwritten (tested)
- [x] PDF page count different from the one recorded shows a warning (tested)
- [x] Temporary files use a name pattern the sync app can be told to skip; written in the README
- [x] Saves and failures logged (through ticket 07's `AppLog`, so they reach the shareable log file)
- [x] On-tablet check written in the PR: write, force-close within 3 s of the last stroke, reopen: all ink there; the PDF's modified time is unchanged
