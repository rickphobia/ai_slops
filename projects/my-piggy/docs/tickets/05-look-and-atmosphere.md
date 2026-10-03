# 05: Look and atmosphere

**What to build:** The house stops looking like grey boxes and starts feeling wrong. The PS1 look covers wobbling vertices, low-res textures, dithering and fog. The house is dark and lit only by a few lamps and moonlight. A quiet background of creaks, wind and a fridge hum runs underneath. Sounds behind walls and closed doors are muffled. There are no gameplay changes; this is the mood the rest of the game sits in.

**Blocked by:** 03 (The house)

**Status:** ready

**Touches:** look (PS1 shader, lighting, fog), house lighting, ambient sound, the muffled sound channel for sounds behind walls

- [ ] PS1-style shader (vertex wobble, low-res texture sampling, dithering) applied to the house and props, working under the Compatibility renderer in the web export
- [ ] Fog and darkness: lamps and moonlight are the only light sources; rooms are readable but mostly dark
- [ ] Ambient background loops (house creaks, wind, fridge hum near the kitchen) with no music
- [ ] A muffled sound channel exists, and 3D sounds behind a wall or closed door play through it (Mum's audio and body sounds will use it)
- [ ] Every free asset added has its licence recorded in a credits file
- [ ] Web export still holds 60 fps on a mid-range laptop in Chrome and Firefox (state in the PR what was measured and on what)
- [ ] PR says what to look and listen for when trying it
