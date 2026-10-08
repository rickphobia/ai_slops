# 12: Settings

**What to build:** The player can make The App's text bigger, turn on reduced motion, which tones down the Exhaustion effects and the confetti, and set the volume or mute. All are remembered between visits (spec: stories 51, 73–75, 96).

**Blocked by:** 09 (Save and continue), 15 (The Overseer at the Generator)

**Status:** done

**Touches:** config/player-settings, adapters/settings, adapters/app-overlay, adapters/field, adapters/audio

**Effort:** low

- [x] Player settings (text size, reduced motion) validated on load, stored separately from the game save; a test covers validation and defaults
- [x] A Settings screen reachable from the title screen and from the overlay
- [x] Text size scales The App's text and the Sources page
- [x] Reduced motion removes the Worker's slump animation and the confetti, and keeps the colour drain still rather than animated
- [x] Settings persist between visits
- [x] Master volume and mute, applied to every sound, remembered between visits (story 96)
