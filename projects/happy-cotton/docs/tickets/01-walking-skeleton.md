# 01: Walking skeleton

**What to build:** A new developer can clone the repo, run the commands in the README, and get Happy Cotton running in the Godot editor and as a web export in the browser: a placeholder scene that loads, with a game log and a validated tuning table behind it. Format check, lint, type check and tests run with one command, locally and in CI. This is the base every other ticket builds on (spec: "Project setup"; decision 0001).

**Blocked by:** None (can start immediately)

**Status:** done

**Touches:** project setup, config/tuning, logging, entrypoint, CI, README

**Effort:** medium

- [x] Godot 4 project in the standard layout (config, rules, adapters, thin entrypoint, tests mirroring the source), with the exact Godot version pinned and a checksum-verified setup script that installs it and its web export templates
- [x] Compatibility (WebGL 2) renderer on desktop and mobile, single-threaded web export preset, landscape orientation
- [x] GUT test addon and the GDScript format and lint tools pinned; untyped declarations and unsafe-access warnings are errors
- [x] One check script runs format check, lint, type check and tests, stops at the first failure, and does not rely on exit codes Godot gets wrong
- [x] Tuning table module that validates itself at startup and stops with a clear message naming a bad value; at least one passing test for that validation
- [x] Game log adapter writing structured lines with a level; the entrypoint logs the build version on start
- [x] Placeholder main scene that runs in the editor and in the web export
- [x] `.github/workflows/happy-cotton.yml` (`name: happy-cotton`, `paths:` scoped to the project) runs the check script and the web export, and is green
- [x] `.claude/settings.json` copied from the root
- [x] `.env.example` (the game reads no environment variables; it will list the deploy settings from ticket 02)
- [x] README filled in from the template: requirements, setup, run, test, export, folder layout; status `in progress`
- [x] Project added to the index in the root README
