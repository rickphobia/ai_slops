# Native Android in Kotlin and Jetpack Compose

RickNotes is a native Android app in Kotlin with Jetpack Compose, with Jetpack Ink (`androidx.ink`) for pen strokes. Pen feel decides whether the app is usable at all, and only native Android gets the low-latency stylus drawing that Ink provides. The rest of this repo is web projects, so a reader may expect a web app or PWA here.

**Trade-offs:** harder to vibe-code than a web app, needs the Android SDK to build, and runs only on Android. A web app would also have been unable to open a local folder the way Obsidian does.
