# 03: Pick the Study folder

**What to build:** On first launch the app explains why it needs "All files access", sends me to grant it, then lets me pick my **Study folder**. The choice is remembered, and the home screen lists the PDFs inside it (a plain list, all subfolders included, until the folder tree in milestone 3). RickNotes and the Preview app each remember their own folder. See decision 0002.

**Blocked by:** 01 (Walking skeleton)

**Status:** ready

**Touches:** app-settings, app-files, core-settings

**Effort:** low

- [ ] Without the permission, a screen explains why it is needed and opens the system setting; returning with it granted continues
- [ ] Folder picker; the chosen path is saved in the app's private settings and validated on startup (missing or unreadable folder sends you back to the picker with a message saying which folder and why)
- [ ] Settings loading and validation live in one place in `core`, unit-tested
- [ ] Home screen lists every PDF under the Study folder with its folder path, sorted; Ink files and other non-PDF files are not shown
- [ ] A "Change folder" entry in Settings
- [ ] On-tablet check written in the PR: grant, pick a copy of the Study folder in the Preview app, see the PDFs
