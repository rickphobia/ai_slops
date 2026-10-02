# 05: Shop with common pawn types

**What to build:** Between waves the player gets a Brotato-style shop: 4 random offers, buy, reroll, lock, and an army summary. The first pawn types for sale are Shield, Spear and Twin, each with its own stats and passive. "Next wave" places the army automatically.

**Blocked by:** 04

**Status:** ready

**Touches:** catalog, shop, battle, run, adapters/dom-ui, adapters/canvas-renderer

- [ ] Catalog holds pawn types with rarity, cost, stats, passive text and skill text; rarity gates by wave
- [ ] Offers are seeded, weighted by rarity, gated by wave
- [ ] Buy sacrifices cost in plain pawns and converts one; refused unless the player has cost + 1 plain pawns
- [ ] Reroll costs 1, +1 per reroll in the same visit, resets next visit
- [ ] Lock keeps an offer for the next visit
- [ ] Shop cards show name, rarity colour, cost, HP/attack, passive and skill text
- [ ] Shield (enemies in reach target it first), Spear (also hits two ahead), Twin (hits both diagonals) passives work in battle
- [ ] Auto-placement: shields in front, support behind, others spread across files
- [ ] Special pawn types look different on the board
- [ ] Tests cover every shop rule and each passive
