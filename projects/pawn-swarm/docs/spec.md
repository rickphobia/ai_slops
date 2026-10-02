# Pawn Swarm — demo spec

## Problem Statement

I want to test whether a mix of Brotato (short waves, a shop between waves, builds that stack), How Many Dudes (big swarms fighting on their own) and chess (pieces that move by chess rules) is fun, before investing in a bigger engine like Unreal. I need a playable browser demo I can share as a link.

## Solution

A browser game on a 16×16 chess board. The player owns an army of white pawns. Black pieces (knights, bishops, rooks, queens, a king) attack in waves. Battles play out by themselves. Between waves the player visits a shop.

The twist: **pawns are the money.** Killing enemies drops new plain pawns. In the shop, the player sacrifices plain pawns to promote other plain pawns into special pawn types. Every pawn lost in battle is money lost, so every choice is "spend soldiers to get better soldiers".

The run is 5 waves. Clear wave 5 (the king's wave) to win. Lose every white pawn and the run is over.

## Game rules

### Board and battle
- Board: 16 files × 16 ranks. White deploys on the bottom 3 ranks; black enters from the top 3 ranks.
- The battle advances in **ticks** (default 250 ms). Each piece has a move cooldown measured in ticks.
- Every piece moves only with its chess move:
  - **Pawn**: one square forward (toward black), captures one square diagonally forward. A pawn that is blocked waits.
  - **Knight**: L-jump, ignores blockers.
  - **Bishop**: slides diagonally, up to its range.
  - **Rook**: slides straight, up to its range.
  - **Queen**: rook + bishop.
  - **King**: one square any direction.
- Pieces have **HP**. A capture deals the attacker's **attack** in damage instead of removing the target outright; the target is removed when HP hits 0. This lets one rook survive several pawn hits, which swarm combat needs.
- Black pieces move toward the nearest white pawn, picking the legal move that gets closest (ties broken by the seeded RNG).
- A white pawn that reaches black's back rank **promotes** for the rest of the wave (see Promoter pawn); plain pawns that reach it turn around and keep fighting.
- A wave ends when every black piece is dead (win the wave) or every white pawn is dead (lose the run).

### Enemies and drops
| Enemy | HP | Attack | Cooldown | Pawn drop | First wave |
|---|---|---|---|---|---|
| Knight | 3 | 1 | 3 | 2 | 1 |
| Bishop | 3 | 1 | 4 | 2 | 2 |
| Rook | 6 | 2 | 5 | 4 | 3 |
| Queen | 10 | 3 | 4 | 8 | 4 |
| King | 25 | 4 | 3 | — (win) | 5 |

Each wave lists its enemy counts in one data table so balancing never touches logic. Drops arrive as plain pawns at the end of the wave.

### Pawn types (shop offers)
Each type has a **rarity**. Higher rarities only appear from later waves, like Brotato tiers. **Cost** is the number of plain pawns sacrificed; one more plain pawn becomes the new type.

| Type | Rarity | Cost | Description shown in shop |
|---|---|---|---|
| Plain pawn | — | — | 2 HP, 1 attack. Marches forward, captures diagonally. Also your money. |
| Shield pawn | common | 2 | 6 HP. Moves at half speed. Enemies prefer to attack it if it's in reach. |
| Spear pawn | common | 2 | Also hits the square two ahead in a straight line. |
| Twin pawn | common | 3 | Captures on both diagonals in the same tick. |
| Medic pawn | rare | 3 | Doesn't attack. Heals 1 HP to every adjacent pawn every 4 ticks. |
| Banner pawn | rare | 3 | Adjacent pawns get +1 attack. Stays one rank behind the front. |
| Bomb pawn | rare | 3 | When it dies, deals 3 damage to every piece in a 3×3 area — black and white. |
| Recruiter pawn | epic | 5 | Spawns a plain pawn behind itself every 12 ticks. The swarm grows mid-battle. |
| Berserker pawn | epic | 4 | Gains +1 attack for each white pawn that dies within 2 squares (resets each wave). |
| Promoter pawn | epic | 4 | On reaching the back rank, becomes a white queen until the wave ends. |
| En passant pawn | epic | 4 | Can also capture sideways, and dodges the first hit each wave. |

Rarity gates: commons from wave 1, rares from wave 2, epics from wave 4. Exact numbers live in one data table.

### Shop (between waves)
- Shows **4 random offers**, weighted by rarity and gated by wave.
- Each offer is a card: name, rarity colour, cost, description, small icon.
- **Buy**: sacrifices the cost in plain pawns and converts one plain pawn. Needs at least cost + 1 plain pawns, so the shop can never take your last pawn.
- **Reroll**: costs 1 plain pawn, +1 each reroll in the same shop visit (Brotato style).
- **Lock**: keeps an offer for the next shop visit.
- Shows the army: count per type, total pawns.
- **Next wave** button. Pawns are placed automatically: tanky types (Shield) in front, support types (Medic, Banner) behind, others spread across files.

### Starting state
- 12 plain pawns, wave 1, fixed seed per run (shown on screen so a run can be replayed).

## User Stories

1. As a player, I want to open a link and start a run with one click, so that trying the demo has no setup.
2. As a player, I want to see my pawns and the black pieces on a big board, so that the swarm feel comes through.
3. As a player, I want battles to play out on their own, so that I watch my build work rather than micro-manage.
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
18. As a player, I want to speed up the battle (1×, 2×, 4×), so that easy waves don't drag.
19. As a player, I want to pause the battle, so that I can look at the board.
20. As a player, I want a win screen after killing the king in wave 5, so that the run has an end.
21. As a player, I want a game-over screen when all my pawns die, showing the wave reached, so that I know how I did.
22. As a player, I want a "new run" button on both end screens, so that I can play again quickly.
23. As a player, I want the run seed shown, so that I can replay or share a run.
24. As the designer, I want all stats, costs, drops and waves in data tables, so that I can balance without touching logic.
25. As the designer, I want the battle to be deterministic for a given seed, so that bugs and balance issues can be reproduced.
26. As a developer, I want the game rules to run without a browser, so that they can be unit tested fast.

## Implementation Decisions

- **Stack:** TypeScript (strict), Vite for dev server and build, Vitest for tests, ESLint + Prettier. Rendering with plain Canvas 2D; UI (shop, buttons) in plain DOM. No game engine — see decision 0001.
- **Modules:**
  - `config` — reads tick length, board size and default seed from Vite env vars, validated at startup.
  - `catalog` — data tables: pawn types, enemy types, waves, rarity gates. Pure data, no logic.
  - `board` — grid, positions, chess move generation per piece kind.
  - `battle` — the simulation. Main interface: `createBattle(army, wave, rng) → BattleState` and `step(state) → BattleState` (one tick, pure). Ability effects (heal, explode, spawn, promote) are handled here through a per-type hook so new types are additive.
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
- `battle`: given a seed and a small setup, assert outcomes — pawn captures diagonally, knight jumps blockers, HP damage, each pawn ability does what its description says, wave ends correctly, same seed gives same result.
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

- The 16×16 board and all numbers are first guesses. Balancing is expected after the first playable build.
- If the demo is fun, the plan is a rebuild in Unreal; keeping rules in pure, data-driven modules makes the rules easy to port.
