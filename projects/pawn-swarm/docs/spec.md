# Pawn Swarm — demo spec

Rewritten on 2026-10-02 after the swarm prototype (`docs/prototype/swarm-prototype.html`). The first version of this spec described a slow, tick-by-tick board game; playing it showed it wasn't fun. This version describes what the prototype proved out. Decision 0002 records why.

## Problem Statement

I want to test whether a mix of Brotato (short waves, a shop between waves, builds that stack), How Many Dudes (one unit snowballing into a huge swarm) and chess (pieces that move by chess rules) is fun, before investing in a bigger engine like Unreal. I need a playable browser demo I can share as a link.

## Solution

A real-time browser game on a chess board. You start with **one white pawn in the middle of the board**. Each wave, the whole black army (knights, bishops, rooks, queens, and finally the king) lands around you at once and attacks with chess moves. Your pawns fight on their own. Every black piece you kill drops new plain pawns on the spot, so the swarm snowballs during the battle.

**Pawns are the money.** Between waves, a Brotato-style shop lets you spend plain pawns to recruit special pawn types. Each type you own gives you a **skill** you fire by hand during battle, so you always have something to do while the swarm fights.

Survive 10 waves and kill the king to win. Lose every white pawn and the run is over.

The prototype is the reference for feel and numbers. All numbers below are starting values that live in data tables.

## Game rules

### Board and time
- Board: 20 files × 14 ranks, drawn large so pieces are easy to see.
- Real time with a fixed simulation step (60 steps per game second). Speed control 0.5×, 1×, 1.5×, 2× changes how many steps run per real second, never the result. Pause stops the steps.
- White pawns move freely (not snapped to squares), but **only up, down, left or right, never diagonally**. A pawn keeps its current direction until the other axis is clearly longer (30% more), so it doesn't zig-zag.
- Black pieces always stand on square centres and move only with their chess moves.

### White pawns
- Every pawn walks toward the nearest black piece and strikes it when in range, on its own cooldown.
- Pawns push apart so the swarm spreads out instead of stacking.
- Wave start: the army is placed in a tight spiral around the board centre, tanky types in the middle.

### Black pieces
| Piece | HP (wave 1) | Attack | Acts every | Drop | Move |
|---|---|---|---|---|---|
| Knight | 1 | 1 | 1.1s | 1 | L-jump |
| Bishop | 3 | 1 | 1.6s | 2 | diagonal, up to 4 squares |
| Rook | 8 | 2 | 2.0s | 3 | straight, up to 6 squares |
| Queen | 18 | 3 | 1.3s | 5 | rook + bishop, up to 5 squares |
| King | 160 | 4 | 0.8s | — (win) | 1 square, calls 3 knights every 6s |

- HP grows 50% of base per wave after wave 1.
- Each piece picks the legal move that gets closest to its target: the nearest shield pawn within reach if any, otherwise the nearest pawn.
- **Attacks hit squares.** Before a move, the squares it will hit glow red for 0.4s. Sliders (bishop, rook, queen) hit every square they pass through. Knights and the king hit the 3×3 block where they land. Every white pawn standing on a hit square when the move lands takes the piece's attack as damage.
- **Contact hurts.** A white pawn touching a black piece takes 1 damage every 1.5s.

### Black piece types
From wave 3, pieces can spawn as special types with a power, shown by a coloured ring. Each type unlocks from a wave and gets more common after it (18% when it unlocks, +7% per wave, max 45%). A special type drops 1 extra pawn.

| Type | Piece | From wave | Power |
|---|---|---|---|
| Stomper | knight | 3 | Bigger stomp (3×3 plus a cross), +1 damage |
| Priest | bishop | 4 | Heals black pieces within ~3 squares by 2 every 2s |
| Hunter | knight | 5 | Acts twice as often and targets special pawns |
| Tower | rook | 5 | 3× HP, acts 50% slower |
| Sniper | bishop | 6 | Dashes up to 8 squares |
| Cannon | rook | 7 | Every 3s hits pawns in its row and column within 7 squares for 2 |
| Storm | queen | 7 | Every 4s hits every pawn within ~2 squares for 2 |
| Summoner | queen | 8 | Every 6s calls 2 knights next to her |

### Waves
- The whole wave lands at once at wave start. Each piece gets its own square: half in a ring around the board centre, half anywhere, never within ~4 squares of the centre. Red squares warn for 1.2s before they land.
- Wave 1 is 3 knights, so one pawn can win it.

| Wave | Knights | Bishops | Rooks | Queens | King |
|---|---|---|---|---|---|
| 1 | 3 | | | | |
| 2 | 8 | | | | |
| 3 | 12 | 3 | | | |
| 4 | 16 | 6 | | | |
| 5 | 20 | 8 | 2 | | |
| 6 | 26 | 12 | 4 | | |
| 7 | 30 | 14 | 6 | 1 | |
| 8 | 36 | 18 | 8 | 2 | |
| 9 | 42 | 20 | 10 | 3 | |
| 10 | 30 | 14 | 8 | 4 | 1 |

- A wave is won when every black piece is dead. Killing the king wins the run.
- **Longer waves (to confirm when tuning):** waves in the prototype last 15–40s. The demo should be longer. Planned approach: each wave arrives in 3 pushes; each push lands all at once, and the next push lands when the current one is mostly dead or after a timer.

### Drops and growth
- A killed black piece drops its pawns on its square; they burst outward and fight straight away.
- **Crowding:** each drop is multiplied by `max(0.15, 1 - pawns / 400)`, with the fraction rolled as a chance. A big swarm grows slower, so it can't compound forever.

### Pawn types
Each type has its own stats, a passive, and a skill. Rarity gates when it can appear in the shop: common from wave 1, rare from wave 3, epic from wave 6.

| Type | Rarity | Base price | HP | Atk | Passive | Skill (cooldown) |
|---|---|---|---|---|---|---|
| Plain pawn | — | — | 3 | 1 | Also your money. | Charge (12s): plain pawns double speed, +1 attack for 3s |
| Shield | common | 3 | 10 | 1 | Black pieces nearby target shields first | Hold the line (20s): shields take no damage for 4s and pull enemies from further away |
| Spear | common | 3 | 3 | 2 | Strikes from twice as far | Volley (15s): each spear hits every enemy within 4 squares in its row and column for 3 |
| Twin | common | 3 | 3 | 1 | Strikes two enemies at once | Fork (12s): each twin hits every enemy around it for 2 |
| Medic | rare | 5 | 4 | 0 | Doesn't fight; heals pawns near it 1 HP every 1.5s | Triage (25s): fully heal every white pawn |
| Banner | rare | 5 | 5 | 1 | Pawns near it get +1 attack | Rally (25s): every pawn moves and strikes 60% faster for 5s |
| Bomb | rare | 4 | 2 | 1 | Explodes on death: 4 damage to black pieces nearby; white pawns nearby are **stunned for 2s, never hurt** | Detonate (8s): blow up every bomb pawn now |
| Recruiter | epic | 8 | 5 | 1 | Spawns a plain pawn every 8s | Call to arms (25s): each recruiter spawns 2 pawns |
| Berserker | epic | 7 | 6 | 2 | +1 attack per white pawn that dies near it (resets each wave) | Frenzy (15s): lose 1 HP, +3 attack for 5s |
| Promoter | epic | 7 | 3 | 1 | Fast; at any board edge becomes a white queen for the wave | Rush (18s): leap up to 5 squares toward the nearest enemy |
| En passant | epic | 6 | 4 | 2 | Dodges the first hit each wave | Sidestep (15s): refresh dodge, dash at the nearest enemy |

### Skills
- During battle, one skill button per pawn type on the board, with hotkeys 1–9 and a visible cooldown in seconds. Space toggles pause.
- A skill fires for every pawn of that type at once. Skills can be used while paused and fire on the next step.
- Skill uses are recorded as inputs (step number, skill), so a seed plus the recorded inputs replays a battle exactly.

### Shop (between waves)
- Shows **3 offers**, never the same type twice, weighted by rarity (common 6, rare 3, epic 1.4) and gated by wave. If fewer types are unlocked than slots, it shows fewer offers.
- **Recruit 1** turns one plain pawn into the type and sacrifices more as the price: `ceil(base / 2 × (1 + 0.25 × (wave − 1)))`. You can recruit **at most 5 of each type per wave**. The card shows "Recruited this wave: n/5".
- The shop never takes your last plain pawn.
- **Reroll** costs `1 + rerolls this visit + floor(wave / 3)` and replaces unlocked offers.
- **Lock** keeps an offer for the next visit.
- The shop shows your army, the next wave's pieces, any **new black types** in it with their power, and a collapsible list of black types already met.

### Power-ups
- Killed black pieces sometimes drop a coloured orb: rooks and queens 35%, special types 20%, others 3%.
- Orbs drift to the nearest pawn within ~3 squares and are picked up on touch; they vanish after 9s.
- Heal (all pawns full HP), Haste (pawns 50% faster, 6s), Fury (+2 attack, 6s), Freeze (black pieces stop, 3s), Bounty (double drops, 8s), Reinforcements (+3 pawns).

### Feedback
- Big pawn counter that bumps when pawns are added; plain-pawn count; wave n/10; black pieces left.
- Damage numbers, "+n ♟" drop pop-ups, death bursts, screen shake on big hits, stun "z" over stunned pawns, red warning squares, coloured rings on special black types.
- Toasts for wave start, skills and power-ups.
- End screens: win ("Checkmate") or loss, with wave reached, biggest swarm and pieces taken, plus "New run".

## User Stories

1. As a player, I want to open a link and start a run with one click, so that trying the demo has no setup.
2. As a player, I want to start with one pawn in the middle of the board, so that growing a swarm from nothing feels earned.
3. As a player, I want every kill to drop pawns that join the fight immediately, so that the swarm snowballs during a wave.
4. As a player, I want growth to slow down as my swarm gets big, so that the run stays challenging.
5. As a player, I want my pawns to fight on their own, so that I watch my build work.
6. As a player, I want pawns to move only straight, never diagonally, so that they still feel like chess pieces.
7. As a player, I want black pieces to move with their real chess moves, so that I can read the battle with chess knowledge.
8. As a player, I want red squares to show where black attacks will land, so that I can read danger at a glance.
9. As a player, I want black attacks to hit whole squares, so that moving pawns can't slip through.
10. As a player, I want the whole black army to land at once, so that each wave starts with a big clash.
11. As a player, I want black pieces to come in special types with powers, so that later waves feel different.
12. As a player, I want the shop to tell me which new black types are coming, so that I can prepare.
13. As a player, I want a shop with 3 offers between waves, so that each run plays differently.
14. As a player, I want to recruit one pawn at a time, up to 5 of a type per wave, so that I can't dump everything into one type at once.
15. As a player, I want to reroll for a rising price and lock an offer, so that I can hunt for a build.
16. As a player, I want the shop to never take my last plain pawn, so that I can't soft-lock my run.
17. As a player, I want each pawn type to have its own stats, passive and skill, so that types feel different.
18. As a player, I want a skill button per pawn type with hotkeys 1–9 and cooldowns, so that I have decisions to make during battle.
19. As a player, I want to use skills while paused, so that I can make careful decisions.
20. As a player, I want bomb pawns to stun my own pawns instead of hurting them, so that bombs are worth using.
21. As a player, I want power-up orbs from kills, so that fights have small surprises.
22. As a player, I want speed control (0.5×–2×) and pause, so that I can slow hard moments and speed through easy ones.
23. As a player, I want a big pawn counter, damage numbers and hit effects, so that the snowball feels exciting.
24. As a player, I want win and game-over screens with my biggest swarm, so that a run has an end and a score.
25. As a player, I want the run seed shown, so that I can replay or share a run.
26. As the designer, I want every stat, price, drop rate and wave in data tables, so that I can balance without touching logic.
27. As the designer, I want a battle to be exactly reproducible from a seed and recorded skill inputs, so that bugs and balance issues can be replayed.
28. As a developer, I want the game rules to run without a browser, so that they can be unit tested fast and simulated in bulk for balancing.

## Implementation Decisions

- **Stack (unchanged):** TypeScript (strict), Vite, Vitest, ESLint + Prettier, Canvas 2D for the board, plain DOM for HUD, shop and skills. See decision 0001.
- **Simulation:** fixed-step real time (decision 0002). Positions are continuous numbers in board units (1 square = 1 unit). Black pieces stay on square centres. The battle is a pure function: `step(state, inputs) → state` advances one 1/60s step. No `Math.random` and no wall-clock time in rule code; one seeded RNG lives in the state.
- **Modules:**
  - `config`: env settings (default seed). Steps per second and board size are rules, not settings: changing either would change how a seed plays, so they live in `battle` and `catalog`.
  - `catalog`: data only — pawn types, black pieces, black types, waves, power-ups, prices, balance knobs.
  - `board`: square geometry and chess move generation; attack squares for a move.
  - `battle`: the simulation (white movement, black moves with warnings, square hits, contact damage, drops, crowding, passives, skills, power-ups, black type powers). Split by feature inside the folder (e.g. white AI, black AI, effects) so no file passes ~300 lines.
  - `skills`: cooldowns and validating a skill use.
  - `shop`: offers, recruit, reroll, lock, caps. Pure functions over the run state.
  - `run`: run state machine `shop → battle → (shop | won | lost)`.
  - `adapters/canvas-renderer`, `adapters/dom-ui`: draw state and send player actions. They never change rules. Visual effects (damage numbers, bursts, shake) are driven by battle events, not computed inside rules.
  - entrypoint: wires `requestAnimationFrame` to the step loop and speed control.
- **Spatial lookup:** a uniform grid of pawns for "pawns near point" queries, so 300+ pawns stay smooth.
- **Logging:** level-based logger; wave start/end, recruits, rerolls, skill uses at info; per-hit detail at debug (`?debug=1`).
- **Headless balance check:** a script that plays N runs with a simple bot (fires skills when ready, recruits greedily) and prints win rate and peak swarm, like the prototype's test bot. Used to check balance changes, not a CI gate.

## Testing Decisions

- Test behaviour through public functions of `board`, `battle`, `skills`, `shop` and `run`; no DOM in unit tests.
- `board`: each piece's moves and the attack squares of a move.
- `battle`: pawns move only along one axis per step; a pawn on a red square is hit when the move lands and one off it isn't; contact damage; drops spawn mid-battle and shrink with crowding; each passive, skill, black type power and power-up does what its description says; bomb stuns and never damages white pawns; same seed + same inputs → same result.
- `shop`: 3 unique offers, rarity gates, price formula, 5-per-type cap reset each wave, last-pawn guard, reroll price, lock carry-over.
- `run`: scripted runs reach `won` and `lost`.
- Renderer and DOM UI: checked by running the game; each UI ticket's PR includes a screenshot.

## Out of Scope

- Placing or steering pawns by hand.
- Brotato-style stat items beyond pawn types and power-ups.
- Art, sound and music beyond chess glyphs and simple effects.
- Saving runs, accounts, leaderboards, mobile touch tuning.
- Hosting beyond the static build.

## Further Notes

- All numbers are first guesses tuned with the prototype's bot: it wins about 2 runs in 8, dies between waves 5 and 9 otherwise, and peaks at 40–280 pawns.
- White pawns don't avoid red squares yet. If that feels unfair in play, add dodging (automatic or as a skill).
- If the demo is fun, the plan is a rebuild in Unreal; pure, data-driven rule modules make that port easier.
