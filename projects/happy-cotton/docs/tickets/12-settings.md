# 12: Settings

**What to build:** The player can make The App's text bigger and turn on reduced motion, which tones down the Exhaustion effects and the confetti. Both are remembered between visits (spec: stories 51, 73–75).

**Blocked by:** 11 (Withering and Negligence)

**Status:** ready

**Touches:** config/player-settings, adapters/settings, adapters/app-overlay, adapters/field

**Effort:** low

- [ ] Player settings (text size, reduced motion) validated on load, stored separately from the game save; a test covers validation and defaults
- [ ] A Settings screen reachable from the title screen and from the overlay
- [ ] Text size scales The App's text and the Sources page
- [ ] Reduced motion removes the Worker's slump animation and the confetti, and keeps the colour drain still rather than animated
- [ ] Settings persist between visits
