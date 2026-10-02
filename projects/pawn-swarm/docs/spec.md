# Pawn Swarm — demo spec

## Problem Statement

I want to test whether a mix of Brotato (short waves, a shop between waves, builds that stack), How Many Dudes (big swarms fighting on their own) and chess (pieces that move by chess rules) is fun, before investing in a bigger engine like Unreal. I need a playable browser demo I can share as a link.

## Solution

A browser game on a 16×16 chess board. The player owns an army of white pawns. Black pieces (knights, bishops, rooks, queens, a king) attack in waves. Battles play out by themselves. Between waves the player visits a shop.

The twist: **pawns are the money.** You start with a single plain pawn, like How Many Dudes starts with one dude. Every enemy you kill drops new plain pawns right where it died, so the swarm grows during the battle. In the shop, you sacrifice plain pawns to turn other plain pawns into special pawn types. Every pawn lost in battle is money lost.

Battles run on their own, but each pawn type has an **active skill** you fire by hand during the battle. Watching is not enough: good timing wins waves.

The run is 10 waves. Clear wave 10 (the king's wave) to win. Lose every white pawn and the run is over.

## Game rules

### Board and battle
- Board: 16 files × 16 ranks. White deploys on the bottom 3 ranks; black enters from the top 3 ranks.
- The battle advances in **ticks** (250 ms at 1× speed). Each piece has a move cooldown measured in ticks.
- Speed control: **0.5×, 1×, 1.5×, 2×**, plus pause.
- Every piece moves only with its chess move:
  - **Pawn**: one square forward (toward black), captures one square diagonally forward. A pawn that is blocked waits.
  - **Knight**: L-jump, ignores blockers.
  - **Bishop**: slides diagonally, up to its range.
  - **Rook**: slides straight, up to its range.
  - **Queen**: rook + bishop.
  - **King**: one square any direction.
- Every piece has its own **HP** and **attack**. A capture deals the attacker's attack as damage; the target is removed when its HP hits 0.
- Black pieces move toward the nearest white pawn, picking the legal move that gets closest (ties broken by the seeded RNG).
- Plain pawns that reach black's back rank turn around and keep fighting.
- A wave ends when every black piece is dead (win the wave) or every white pawn is dead (lose the run).

### Enemies and drops
| Enemy | HP | Attack | Cooldown (ticks) | Pawn drop | First wave |
|---|---|---|---|---|---|
| Knight | 2 | 1 | 3 | 1 | 1 |
| Bishop | 3 | 1 | 4 | 2 | 3 |
| Rook | 6 | 2 | 5 | 3 | 5 |
| Queen | 10 | 3 | 4 | 6 | 7 |
| King | 30 | 4 | 3 | — (win) | 10 |

Wave 1 is a single knight, so one pawn can win it. Waves grow from there. Each wave's enemy list lives in one data table so balancing never touches logic.

Drops appear as plain pawns on the square where the enemy died (or the nearest free square) **during** the battle, and fight straight away.

### Pawn types (shop offers)
Each type has its own HP, attack and move cooldown, a passive ability, and an active skill. Higher rarities only appear from later waves, like Brotato tiers. **Cost** is the number of plain pawns sacrificed; one more plain pawn becomes the new type.

| Type | Rarity | Cost | HP | Atk | CD | Passive (shown in shop) |
|---|---|---|---|---|---|---|
| Plain pawn | — | — | 3 | 1 | 2 | Marches forward, captures diagonally. Also your money. |
| Shield pawn | common | 2 | 8 | 1 | 4 | Enemies in reach attack it first. |
| Spear pawn | common | 2 | 3 | 1 | 2 | Also hits the square two ahead in a straight line. |
| Twin pawn | common | 3 | 3 | 1 | 2 | Captures on both diagonals in the same tick. |
| Medic pawn | rare | 3 | 3 | 0 | 3 | Heals 1 HP to every adjacent pawn every 4 ticks. |
| Banner pawn | rare | 3 | 4 | 1 | 3 | Adjacent pawns get +1 attack. Stays one rank behind the front. |
| Bomb pawn | rare | 3 | 2 | 1 | 2 | When it dies, deals 3 damage to every piece in a 3×3 area, black and white. |
| Recruiter pawn | epic | 5 | 4 | 1 | 3 | Spawns a plain pawn behind itself every 12 ticks. |
| Berserker pawn | epic | 4 | 4 | 2 | 2 | +1 attack for each white pawn that dies within 2 squares (resets each wave). |
| Promoter pawn | epic | 4 | 3 | 1 | 1 | On reaching the back rank, becomes a white queen until the wave ends. |
| En passant pawn | epic | 4 | 3 | 2 | 2 | Can also capture sideways. Dodges the first hit each wave. |

Rarity gates: commons from wave 1, rares from wave 3, epics from wave 6. Exact numbers live in one data table.

### Active skills
During a battle, the HUD shows one skill button for each pawn type you own on the board, with hotkeys 1–9. A skill fires for **every pawn of that type at once**, then goes on cooldown. Skills can be used while paused; they fire on the next tick. Cooldowns are in ticks but shown in seconds.

| Type | Skill | Effect | Cooldown (ticks) |
|---|---|---|---|
| Plain pawn | Charge | Every plain pawn moves one square forward now and gets +1 attack for 4 ticks. | 20 |
| Shield pawn | Hold the line | Shield pawns take no damage for 6 ticks and pull every enemy within 3 squares toward them. | 30 |
| Spear pawn | Volley | Each spear pawn hits every square up to 4 ahead in its file for 1 damage. | 25 |
| Twin pawn | Fork | Each twin pawn hits all 8 squares around it once. | 20 |
| Medic pawn | Triage | Heals every white pawn on the board by 2 HP. | 40 |
| Banner pawn | Rally | All white pawns move twice as often for 8 ticks. | 40 |
| Bomb pawn | Detonate | **Click a bomb pawn** to blow it up now. | 10 |
| Recruiter pawn | Call to arms | Each recruiter spawns 2 plain pawns now. | 45 |
| Berserker pawn | Frenzy | Berserkers lose 1 HP and get +3 attack for 8 ticks. | 25 |
| Promoter pawn | Rush | Promoters move up to 3 squares forward at once, ignoring blockers. | 35 |
| En passant pawn | Sidestep | **Click an empty square** within 2 of an en passant pawn: the nearest one jumps there and its dodge refreshes. | 30 |

Skill uses are recorded as inputs (tick, skill, target), so a run with the same seed and the same inputs replays exactly.

### Shop (between waves)
- Shows **4 random offers**, weighted by rarity and gated by wave.
- Each offer is a card: name, rarity colour, cost, HP/attack, passive, active skill, small icon.
- **Buy**: sacrifices the cost in plain pawns and converts one plain pawn. Needs at least cost + 1 plain pawns, so the shop can never take your last pawn.
- **Reroll**: costs 1 plain pawn, +1 each reroll in the same shop visit (Brotato style).
- **Lock**: keeps an offer for the next shop visit.
- Shows the army: count per type, total pawns.
- **Next wave** button. Pawns are placed automatically: tanky types (Shield) in front, support types (Medic, Banner) behind, others spread across files.

### Starting state
- 1 plain pawn, wave 1, fixed seed per run (shown on screen so a run can be replayed).

## User Stories

1. As a player, I want to open a link and start a run with one click, so that trying the demo has no setup.
2. As a player, I want to see my pawns and the black pieces on a big board, so that the swarm feel comes through.
3. As a player, I want battles to play out on their own, so that the swarm fights without me moving every piece.
4. As a player, I want each black piece to move like its chess piece, so that I can read the battle using chess knowledge.
5. As a player, I want pawns to move forward and capture diagonally, so that pawns feel like pawns.
6. As a player, I want pieces to show their HP, so that I can see who is about to die.
7. As a player, I want killed enemies to drop pawns, so that winning fights makes me richer.
8. As a player, I want my pawn count to be my money, so that losing soldiers costs me.
9. As a player, I want a shop between waves with 4 random offers, so that each run plays differently.
10. As a player, I want each offer to show a name, cost and plain description, so that I know what I'm buying.
11. As a player, I want rarer, stronger pawn types to appear in later waves, so that my build grows over the run.
12. As a player, I want to reroll the offers for a rising price, so that I can hunt for a build at a cost.
13. As a player, I want to lock an offer, so that I can save for it next wave.
14. As a player, I want the shop to never take my last plain pawn, so that I can't soft-lock my run.
15. As a player, I want my army placed automatically with tanks in front, so that setup is quick.
16. As a player, I want special pawns to look different on the board, so that I can follow them in a swarm.
17. As a player, I want a wave counter and pawn counter during battle, so that I know where I stand.
18. As a player, I want to set battle speed to 0.5×, 1×, 1.5× or 2×, so that I can slow down hard moments and speed through easy ones.
19. As a player, I want to pause the battle, so that I can look at the board.
20. As a player, I want a win screen after killing the king in wave 10, so that the run has an end.
21. As a player, I want a game-over screen when all my pawns die, showing the wave reached, so that I know how I did.
22. As a player, I want a "new run" button on both end screens, so that I can play again quickly.
23. As a player, I want the run seed shown, so that I can replay or share a run.
24. As the designer, I want all stats, costs, drops and waves in data tables, so that I can balance without touching logic.
25. As the designer, I want the battle to be deterministic for a given seed, so that bugs and balance issues can be reproduced.
26. As a player, I want to start with a single pawn, so that growing a swarm from nothing feels earned.
27. As a player, I want enemy drops to join the battle immediately, so that the swarm snowballs during a wave.
28. As a player, I want each pawn type to have its own HP and attack, so that types feel different.
29. As a player, I want an active skill button per pawn type during battle, so that I have decisions to make while the swarm fights.
30. As a player, I want hotkeys 1–9 for skills, so that I can react quickly.
31. As a player, I want to see each skill's cooldown, so that I can plan when to use it.
32. As a player, I want to use skills while paused, so that I can make careful decisions at slow moments.
33. As a player, I want some skills to need a click on the board (Detonate, Sidestep), so that aiming matters.
34. As a player, I want the shop card to show a type's active skill, so that I can build around skills.
35. As a developer, I want the game rules to run without a browser, so that they can be unit tested fast.

## Implementation Decisions

- **Stack:** TypeScript (strict), Vite for dev server and build, Vitest for tests, ESLint + Prettier. Rendering with plain Canvas 2D; UI (shop, buttons) in plain DOM. No game engine — see decision 0001.
- **Modules:**
  - `config` — reads tick length, board size and default seed from Vite env vars, validated at startup.
  - `catalog` — data tables: pawn types, enemy types, waves, rarity gates. Pure data, no logic.
  - `board` — grid, positions, chess move generation per piece kind.
  - `battle` — the simulation. Main interface: `createBattle(army, wave, rng) → BattleState` and `step(state, inputs) → BattleState` (one tick, pure; `inputs` are the skill uses queued for that tick). Passives and active skills are handled through per-type hooks so new types are additive.
  - `skills` — skill cooldown tracking and validating a skill use (is it ready, is the target legal). Pure.
  - `shop` — offers, buy, reroll, lock. Pure functions over `RunState`.
  - `run` — the run state machine: `shop → battle → (shop | won | lost)`.
  - `adapters/canvas-renderer` and `adapters/dom-ui` — draw state and send player actions. They read state; they never change rules.
  - entrypoint wires the game loop (`requestAnimationFrame` + tick timer) to the modules.
- **Randomness:** one seeded RNG passed into shop and battle. No `Math.random` in rule code.
- **Logging:** a small level-based logger to the browser console (wave start/end, purchases, rerolls, deaths at debug level). Debug level switched on by a URL flag `?debug=1`.
- **Seam for tests:** `run` + `battle` + `shop` as pure functions. Tests drive them directly, no DOM.

## Testing Decisions

- Test behaviour through the public functions of `board`, `battle`, `shop` and `run`, not internals.
- `board`: legal moves for each piece kind on an empty and a crowded board.
- `battle`: given a seed and a small setup, assert outcomes — pawn captures diagonally, knight jumps blockers, HP damage, drops spawn mid-battle, each passive and each active skill does what its description says, cooldowns block early reuse, wave ends correctly, same seed + same inputs gives same result.
- `shop`: offers respect rarity gates, buy costs the right pawns, last-pawn guard, reroll price climbs and resets, lock carries over.
- `run`: full scripted run reaches `won` and `lost`.
- Renderer and DOM UI: no unit tests in the demo; checked by running the game (screenshot in each UI ticket's PR).
- No prior tests exist in the repo; this project sets the pattern.

## Out of Scope

- Player-controlled placement or moving pieces by hand.
- Items/upgrades other than pawn types (Brotato-style stat items) — candidate for the next spec.
- Black pawns as enemies, boss variations beyond the king.
- Art, sound, animations beyond sliding pieces.
- Saving runs, accounts, leaderboards, mobile touch controls.
- Online hosting setup (local `npm run dev` / static build is enough for the demo).

## Further Notes

- Starting from 1 pawn made the run 10 waves instead of 5, so the swarm has time to grow.
- The 16×16 board and all numbers are first guesses. Balancing is expected after the first playable build.
- If the demo is fun, the plan is a rebuild in Unreal; keeping rules in pure, data-driven modules makes the rules easy to port.
