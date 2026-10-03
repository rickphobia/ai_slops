# 01: Walking skeleton

**What to build:** A new Godot project that a stranger can clone, open, run and test from the README. Pressing play drops you into a grey-box room as the **Piggy**: low camera, WASD to move, mouse to look (the mouse is captured on click). Behind it sits the minimum of every layer the spec describes: the tuning table loaded and checked at startup, the project logger, an empty **Night** in the rules core with one passing test, and CI that lints, type-checks, tests and builds the web export. See `docs/spec.md` and decision 0001.

**Blocked by:** None (can start immediately)

**Status:** done

**Touches:** project setup, CI workflow, README, tuning, logger, Night, Piggy controller, main

- [x] Godot pinned to one exact stable 4.x version (latest at the time), with the exact version written in the README and decision 0001
- [x] Project uses the Compatibility renderer and has a single-threaded web export preset
- [x] "Untyped declaration" and related typing warnings raised to errors; headless import fails on any of them
- [x] `gdtoolkit` pinned in a requirements file inside the project folder; `gdformat --check` and `gdlint` pass
- [x] GUT pinned as an addon inside the project and confirmed working with the pinned Godot version; one command runs all tests headless
- [x] Tuning table (a Godot resource) with the Piggy's walk speed and mouse sensitivity, loaded and checked at startup; a missing or out-of-range value stops the game with a message naming the field (tested)
- [x] Project logger with debug/info/warning/error levels; every line carries the step and space name
- [x] Night exists as a rules class with no scene-tree dependency, and one GUT test drives it (e.g. a new Night starts in the bedroom space)
- [x] Grey-box room with the Piggy controller: WASD, mouse look with pointer capture on click, camera at pig height
- [ ] `.github/workflows/my-piggy.yml`, scoped to `projects/my-piggy/**`, runs format check, lint, headless import (type check), tests and a web export. Godot and its export templates are downloaded for the pinned version and checked against a pinned checksum. CI is green.
- [x] README filled in from `templates/project/README.md`: install, run, test, export
- [x] `.env.example` present (may be empty with a comment until the deploy ticket)
- [x] Row added to the project index in the root `README.md`
