# 08: Rare pawn types

**What to build:** Medic, Banner and Bomb pawns appear in the shop from wave 3 with their stats, passives and skills. Bomb blasts damage black pieces and stun nearby white pawns for 2s without hurting them.

**Blocked by:** 07

**Status:** ready

**Touches:** catalog, battle, adapters/canvas-renderer

- [ ] Medic passive (heal nearby 1 HP every 1.5s, doesn't fight) and Triage
- [ ] Banner passive (+1 attack nearby) and Rally
- [ ] Bomb passive (explodes on death) and Detonate; white pawns in the blast are stunned 2s and lose no HP (tested)
- [ ] Stunned pawns can't move or strike, and show a "z"
- [ ] Tests cover each passive and skill
