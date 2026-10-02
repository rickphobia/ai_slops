# Sound is made in code with Web Audio, not played from files

Every sound effect and both music loops are built from oscillators and filtered noise in `src/adapters/audio/` (one recipe per sound name). There are no audio files, so nothing to license, a tiny download, and no loading step. `AudioOutput` is the seam: the rest of the game only asks for a sound by name, so a recording can replace any recipe later without touching anything else.

**Trade-offs:** synthesised sounds are thinner than recorded ones and tuning them means editing numbers and listening; the music is a simple generated loop, not composed.
