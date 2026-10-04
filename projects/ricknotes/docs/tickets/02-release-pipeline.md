# 02: Release pipeline and Preview app

**What to build:** Every merge to `main` produces a signed **RickNotes** APK as a GitHub Release that Obtainium on the tablet picks up, and every green pull request produces a signed **Preview app** APK, linked from the PR, that installs beside the real app. This is how every later ticket gets onto the tablet at the dorm. See decision 0004.

**Blocked by:** 01 (Walking skeleton)

**Status:** ready

**Touches:** ci, app-build, README

**Effort:** medium

- [ ] Two variants: RickNotes (`com.rickphobia.ricknotes`) and RickNotes Preview (`com.rickphobia.ricknotes.preview`, label "RickNotes Preview"); both install side by side
- [ ] Release signing reads the keystore location and passwords from environment variables listed in `.env.example`; nothing secret is committed; a build without them fails with a message naming the missing variable
- [ ] `versionCode` is the CI run number and `versionName` includes it
- [ ] On `main`, CI publishes a GitHub Release `ricknotes-v<N>` with the signed RickNotes APK attached
- [ ] On a pull request whose checks pass, CI publishes or replaces a prerelease `ricknotes-pr-<N>` with the signed Preview APK and adds a "▶ Try this version" link to the PR body; the prerelease is deleted when the PR closes
- [ ] Obtainium's option for filtering releases by name checked against its current docs; README explains how to add RickNotes to Obtainium so it only follows `ricknotes-v*`
- [ ] README explains generating the key, backing it up, and adding the GitHub secrets
- [ ] CI is green

**Owner steps:** generate the signing key on the Beelink and back it up; add the GitHub secrets; install Obtainium on the tablet and add RickNotes; allow it to install apps.
