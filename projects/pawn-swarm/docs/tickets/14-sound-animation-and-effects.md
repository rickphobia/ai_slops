# 14: Sound, animation and effects

**What to build:** Make every hit, death and skill feel heavy, the way How Many Dudes does. That means sound effects and a music loop, pieces that visibly lunge, slide and die, and gore effects in the grotesque style of ticket 13: blood sprays, gibs, bomb blasts and screen shake. Everything plays from battle events; the rules never know about it.

**Blocked by:** 13

**Status:** done

**Touches:** new adapters/audio, adapters/canvas-renderer (effects layer), adapters/dom-ui (settings), config

Sound is made with the Web Audio API in code: no sound files, nothing to license, and a tiny download. One sound module owns every sound, so recorded files can replace any of them later without touching anything else.

- [x] Sound module plays a named sound for each battle event; the battle only emits events, it never calls audio (tested with a fake audio adapter)
- [x] Sounds: pawn strike, black hit landing, warning square appearing, pawn death, black piece death (bigger for rook, queen, king), drop pop, bomb blast, stun, each skill, power-up pickup, wave start, push landing, win and loss stingers, shop buy and reroll clicks. Stun, bomb blast and power-up pickup have nothing in the rules to play from yet (tickets 08–11), so they are left for those tickets.
- [x] Dark music loop in battle, a quieter one in the shop; it gets more intense when the king lands
- [x] Busy fights stay listenable: at most a few copies of the same sound per 100 ms, with slight random pitch so repeats don't drone (tested)
- [x] Animations: pawns lunge when they strike; black pieces slide along their chess move instead of jumping; pieces recoil and flash when hit; deaths play a short collapse instead of vanishing; drops burst out of the corpse; landing pieces slam down
- [x] Effects: blood spray on hits, gibs and a blood pool that fades on deaths, a bomb shockwave, stun stars, power-up glow, king death slow-motion. The bomb shockwave, stun stars and power-up glow wait for tickets 08–11, same as above.
- [x] Screen shake on big hits and deaths, scaled by size; never shakes the HUD or shop
- [x] Settings button: master volume, music volume, effects volume, mute, screen shake on/off; remembered between visits (browser storage, safe if it is blocked)
- [x] Sound starts only after the first click (browsers block it before that), with no errors in the console
- [x] Holds 60 fps with 300+ pawns in a big fight: particles capped and pooled (frame-time numbers in the PR)
- [x] Short screen recording or GIF of a big fight in the PR
