# 04: Read a Document

**What to build:** Tapping a PDF in the list opens it as a **Document** that scrolls continuously from page to page, like Nebo. Pages render in the background, so scrolling a long lecture doesn't stutter. A damaged or password-protected PDF shows a clear message instead of crashing. The PDF is only ever opened for reading.

**Blocked by:** 03 (Pick the Study folder)

**Status:** done

**Touches:** app-viewer

**Effort:** medium

**Owner steps:** run the on-tablet check from the PR in the Preview app.

- [x] Continuous vertical scroll through all pages, with each page at its correct aspect ratio
- [x] Pages rendered by `PdfRenderer` on one background thread per Document, with a memory-limited cache; nothing renders on the main thread
- [x] The PDF is opened read-only; no code path writes to it
- [x] Damaged or password-protected PDFs show a message naming the file and the reason; failures use the project's own error types
- [x] Back returns to the list
- [x] On-tablet check written in the PR: a 100-page lecture scrolls top to bottom without visible stutter
