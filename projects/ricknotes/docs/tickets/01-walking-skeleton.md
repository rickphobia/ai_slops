# 01: Walking skeleton

**What to build:** A new Android project that a stranger can clone, set up with one command, build, test and install, following `docs/new-project.md`. Opening the app shows a plain "RickNotes" screen with its version. Behind it sits the minimum of every layer the spec describes: a pure Kotlin `core` module with one passing JVM test, an `app` module that depends on it, the settings loader, and CI that lints and tests on every push. See `docs/spec.md` (Platform and distribution, Module layout) and decisions 0001 and 0002.

**Blocked by:** None (can start immediately)

**Status:** ready

**Touches:** project setup, ci, README, app-build

**Effort:** medium

- [ ] Current stable versions of the Android Gradle Plugin, Kotlin, Compose, Jetpack Ink and other AndroidX libraries looked up (not assumed) and pinned in a version catalog; the versions and where they were checked are written in the README
- [ ] Gradle wrapper and JDK toolchain pinned; the app requires API 36 and targets the newest stable SDK
- [ ] A setup script inside the project installs the pinned Android command-line tools and SDK packages into a documented location; running it on the Beelink and then the build command produces an APK
- [ ] `core` is a Kotlin/JVM module with no Android dependencies; a build check fails if one is added
- [ ] `app` module with a thin Activity showing "RickNotes" and the version name
- [ ] ktlint, detekt and Android lint configured and clean; one command runs them all
- [ ] One JUnit test in `core` passes; one Gradle command runs all unit tests and is named in the README
- [ ] `.github/workflows/ricknotes.yml` (`name: ricknotes`, scoped to `projects/ricknotes/**`) runs lint and unit tests and builds the APK; CI is green and `ci-gate` passes
- [ ] README filled in from `templates/project/README.md`: setup, build, test, install, and how to run on the tablet
- [ ] `.env.example` present with a comment explaining it holds build-time values only
- [ ] `.claude/settings.json` (added with the planning docs) still matches the root guardrails
- [ ] Row added to the project index in the root `README.md`
