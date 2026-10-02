# Pawn Swarm

An auto-battler on a chess board where the player's white pawns are both the army and the money.

## Language

**Run**:
One game from the first wave to a win or a loss.

**Wave**:
One battle against a set of black pieces. A run has 10.

**Tick**:
One step of the battle simulation.
_Avoid_: frame, turn

**Speed**:
How many ticks run per tick length of real time: 0.5×, 1×, 1.5× or 2×. Changes how fast a battle plays, never how it ends.

**HUD**:
The bar above the board during a battle: wave, pawn count (the army's size), seed, pause and speed buttons.

**Army**:
All white pawns the player owns.

**Plain pawn**:
A white pawn with no ability. The game's money.
_Avoid_: coin, gold, basic pawn

**Pawn type**:
A kind of white pawn with its own stats and ability (Shield, Medic, ...).
_Avoid_: class, unit type

**Capture**:
A piece attacking an enemy on a square it could move to by capturing. It deals the attacker's attack as damage; the attacker stays where it is.
_Avoid_: kill (the target only dies at 0 HP)

**Cooldown**:
Ticks a piece waits between moves.

**Enemy**:
A black piece: knight, bishop, rook, queen or king.

**Drop**:
Plain pawns gained when an enemy dies.

**Shop**:
The screen between waves where the player buys pawn types.

**Offer**:
One pawn type for sale in the shop.
_Avoid_: card, item

**Buy**:
Sacrifice plain pawns to turn one plain pawn into a pawn type.
_Avoid_: purchase, upgrade

**Reroll**:
Pay plain pawns to replace the shop's offers.

**Lock**:
Keep an offer for the next shop visit.

**Rarity**:
How rare and strong a pawn type is: common, rare or epic. Gates which wave it can first appear.

**Promote**:
A pawn turning into a stronger piece on reaching black's back rank.

**Passive**:
A pawn type's always-on ability.

**Skill**:
A pawn type's ability the player fires by hand during a battle, with a cooldown.
_Avoid_: active, ultimate, spell
