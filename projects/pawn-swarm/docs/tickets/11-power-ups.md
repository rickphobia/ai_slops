# 11: Power-ups

**What to build:** Kills sometimes drop coloured orbs (Heal, Haste, Fury, Freeze, Bounty, Reinforcements) that drift to the nearest pawn and trigger for the whole swarm when touched.

**Blocked by:** 10

**Status:** done

**Touches:** catalog, battle, adapters/canvas-renderer

- [x] Drop chances by piece from the catalog; orbs vanish after 9s and blink before they do
- [x] Orbs drift to the nearest pawn within range and trigger on touch
- [x] Each effect matches the spec (tested); Bounty doubles drops before crowding rounding
- [x] Toast names the power-up and its effect (`docs/screenshots/11-power-up-freeze.png`)
- [x] README status set to `working` and root index updated when the demo is complete
