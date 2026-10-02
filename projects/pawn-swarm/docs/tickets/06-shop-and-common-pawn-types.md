# 06: Shop and common pawn types

**What to build:** Between waves, the Brotato-style shop: 3 different offers weighted by rarity and gated by wave, recruit one pawn at a time (at most 5 of a type per wave), reroll, lock, the last-pawn guard, the army summary, and a preview of the next wave. Shield, Spear and Twin pawns are for sale with their stats and passives, and look different on the board.

**Blocked by:** 05

**Status:** ready

**Touches:** catalog, shop, battle, run, adapters/dom-ui, adapters/canvas-renderer

- [ ] Catalog holds pawn types with rarity, base price, stats, passive and skill text
- [ ] Offers: 3 slots, no duplicates, rarity weights, wave gates, fewer offers when fewer types are unlocked (tested)
- [ ] Recruit price formula; 5-per-type cap resets each wave, also after rerolls (tested)
- [ ] Never takes the last plain pawn; reroll price rule; lock carries over (tested)
- [ ] Shop shows army, next wave's pieces, and the "Recruited this wave n/5" count per card
- [ ] Shield (black pieces nearby target it first), Spear (double range, 2 attack), Twin (strikes two) work in battle (tested)
- [ ] Tanky types placed in the middle of the spiral
- [ ] Each type has its own colour on the board
- [ ] Offer cards show the type's portrait and the army list a small icon, using the art module's portrait function if ticket 13 has landed (glyph fallback otherwise)
- [ ] Screenshot in the PR
