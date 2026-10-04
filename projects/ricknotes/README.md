# RickNotes

An Android tablet app for studying PDFs with a pen: it writes ink beside each PDF instead of into it, and collects red-ink mistakes into an error log. Built for one owner and one tablet (Lenovo Xiaoxin Pad Pro 12.7, Android 16). The full picture is in [`docs/spec.md`](docs/spec.md).

## Status

`in progress`: walking skeleton (ticket 01). The app opens to a "RickNotes" screen with its version; no features yet. Next: release pipeline (ticket 02) and the Study folder (ticket 03).

## Requirements

- Linux x86-64 (the Beelink runs Ubuntu 24.04), with `curl`, `unzip` and `sha1sum`
- Java 17 or newer on the `PATH` to start Gradle and the SDK installer (`sudo apt install openjdk-21-jre-headless`). The JDK that compiles the code is pinned by the build and downloaded on first run, so the installed Java's version doesn't matter beyond that.
- About 2 GB of disk for the Android SDK, Gradle and the JDK
- No Android Studio and no accounts

## Setup

```bash
cd projects/ricknotes
scripts/setup-android-sdk.sh   # installs the pinned Android SDK into ~/Android/Sdk, writes local.properties
```

Set `ANDROID_HOME` first to put the SDK somewhere else. The script is safe to run again. Since command-line tools 23.0 the SDK installer is the `android` CLI (it replaced `sdkmanager`); on first use it unpacks itself into `~/.android/cli`. The script runs it with `--no-metrics`.

Nothing in `.env.example` is needed yet: it lists build-time values, and ticket 02 adds the first ones (release signing).

## Build

```bash
./gradlew assembleDebug        # APK in app/build/outputs/apk/debug/app-debug.apk
```

The first build downloads Gradle, the JDK and the libraries, and takes a few minutes.

## Test

```bash
./gradlew lintAll              # ktlint, detekt, Android lint, and the "core has no Android" check
./gradlew test                 # every JVM unit test
./gradlew ktlintFormat         # fix formatting that ktlint reports
```

CI (`.github/workflows/ricknotes.yml`) runs `./gradlew lintAll test assembleDebug` on every push that changes this folder. Lint reports are in `<module>/build/reports/`; CI uploads them when a run fails.

## Install on the tablet

Until ticket 02 publishes signed APKs to GitHub Releases (installed through Obtainium), install a debug build by hand:

- **Over USB or adb:** turn on Developer options and USB debugging on the tablet, then `~/Android/Sdk/platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk`.
- **Without adb:** copy `app-debug.apk` to the tablet (Drive, USB) and open it in Files; allow "Install unknown apps" for Files when asked.

Open "RickNotes" from the launcher: it shows the app name and its version. A debug build is signed with this machine's debug key, so a debug build from another machine won't install over it; uninstall first.

## Configuration

App settings (the Study folder, from ticket 03) live in the app's private storage and are loaded and validated in one place, `core/.../settings/SettingsLoader.kt`. They are not environment variables.

Build-time values come from environment variables listed in `.env.example`:

| Variable | Required | What it does |
|----------|----------|--------------|
| `ANDROID_HOME` | no | Where the Android SDK lives. Default `~/Android/Sdk`; `local.properties` (written by the setup script) also points Gradle at it |

## Pinned versions

Every version is pinned: tools and libraries in `gradle/libs.versions.toml`, Gradle in `gradle/wrapper/gradle-wrapper.properties` (with its checksum), the build JDK in `gradle/gradle-daemon-jvm.properties`, the SDK command-line tools and package revisions in `scripts/setup-android-sdk.sh`. Each was the newest stable release on 2026-10-04, checked at the source:

| What | Version | Checked at |
|------|---------|------------|
| Gradle | 9.8.0 | services.gradle.org/versions/current |
| JDK (build toolchain, Temurin via foojay) | 21 | Gradle `updateDaemonJvm` |
| Android Gradle Plugin | 9.4.1 | Google Maven `com.android.tools.build:gradle` |
| Kotlin | 2.4.20 | Maven Central `org.jetbrains.kotlin:kotlin-gradle-plugin` |
| Compose BOM | 2026.09.00 | Google Maven `androidx.compose:compose-bom` |
| Activity Compose | 1.13.0 | Google Maven `androidx.activity` |
| Core KTX | 1.19.1 | Google Maven `androidx.core` |
| Lifecycle | 2.11.0 | Google Maven `androidx.lifecycle` |
| Jetpack Ink | 1.0.0 (pinned, first used in milestone 2) | Google Maven `androidx.ink` |
| JUnit | 4.13.2 | Maven Central `junit:junit` |
| ktlint / ktlint Gradle plugin | 1.8.0 / 14.2.0 | Maven Central `com.pinterest.ktlint`, Gradle Plugin Portal |
| detekt | 1.23.8 (2.0 is still alpha) | Maven Central and Gradle Plugin Portal |
| foojay toolchain resolver | 1.0.0 | Gradle Plugin Portal (version in `settings.gradle.kts`) |
| SDK platform | API 37 (`android-37.0`, revision 2) | `android sdk list --all` |
| Build tools / platform tools | 37.0.0 / 37.0.1 | `android sdk list --all` |
| SDK command-line tools | 23.0 | dl.google.com/android/repository/repository2-3.xml |

The app requires API 36 (Android 16, the tablet's version) and targets API 37. Android lint's "newer version available" checks are off on purpose: a version bump is a reviewed change to these files, not a build that turns red overnight.

## How it works

Two Gradle modules:

- **`core`**: plain Kotlin on the JVM with no Android code. It will hold all the rules (Ink files, the Document session, the touch interpreter, settings). Today it has the settings model and loader. A build check (`:core:checkNoAndroidDependencies`, part of `check` and `lintAll`) fails if an Android library or an `android`/`androidx` import gets into it, so it always runs its tests on a plain JVM.
- **`app`**: the Android app. `MainActivity` only wires things together: it loads settings through `SettingsLoader` with the SharedPreferences adapter, then shows the Compose home screen.

## Folder layout

```
core/src/main/kotlin/com/rickphobia/ricknotes/core/
  settings/            Settings model, SettingsSource port, SettingsLoader
core/src/test/kotlin/  JUnit tests, mirroring core's packages
app/src/main/kotlin/com/rickphobia/ricknotes/
  MainActivity.kt      entrypoint: wiring only
  adapters/settings/   SharedPreferences-backed SettingsSource
  home/                home screen (Compose)
config/detekt.yml      detekt rules on top of the defaults
gradle/                version catalog, wrapper, pinned daemon JDK
scripts/               setup-android-sdk.sh
docs/                  spec, tickets, decisions
```

## Debugging

- The app logs to Logcat with the tag `RickNotes` (`adb logcat -s RickNotes`). The rolling log file and "Share log" button arrive in ticket 07.
- **`SDK location not found`:** run `scripts/setup-android-sdk.sh`, or set `ANDROID_HOME`.
- **`Cannot find a Java installation ... matching {languageVersion=21}`:** Gradle couldn't download the JDK (offline?). Install a JDK 21 and rerun.
- **`core must stay free of Android`:** something in `core` imports `android`/`androidx` or depends on an Android library. Move that code into an adapter in `app`.
- **ktlint failures:** `./gradlew ktlintFormat` fixes most of them.

## Decisions

See [`docs/decisions/`](docs/decisions/) for why things are the way they are, starting with [0001 (native Kotlin and Compose)](docs/decisions/0001-native-kotlin-compose.md).
