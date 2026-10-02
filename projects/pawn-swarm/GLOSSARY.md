# Pawn Swarm

An auto-battler on a chess board where the player's white pawns are both the army and the money.

## Language

**Run**:
One game from the first wave to a win or a loss.

**Wave**:
One battle against a set of black pieces. A run has 10.

**Step**:
One 1/60 s update of the battle simulation.
_Avoid_: tick, frame, turn

**Speed**:
How many steps run per second of real time, relative to normal: 0.5×, 1×, 1.5× or 2×. Changes how fast a battle plays, never how it ends.

**HUD**:
The bar above the board during a battle: pawn count (the army's size), wave, black pieces left, seed, pause and speed buttons.

**Army**:
All white pawns the player owns.

**Plain pawn**:
A white pawn with no ability. The game's money.
_Avoid_: coin, gold, basic pawn

**Pawn type**:
A kind of white pawn with its own stats and ability (Shield, Medic, ...).
_Avoid_: class, unit type

**Strike**:
A white pawn hitting a black piece in its range for its attack in damage. The target only dies at 0 HP.
_Avoid_: capture, kill

**Hit**:
A black move landing: every white pawn on its warning squares takes the piece's attack in damage.

**Cooldown**:
Seconds a piece waits between actions, or before a skill can be used again.

**Black piece**:
An enemy: knight, bishop, rook, queen or king.
_Avoid_: enemy unit, mob

**Black type**:
A special version of a black piece with a power, such as a Priest bishop or a Cannon rook.
_Avoid_: elite, variant

**Warning square**:
A red square showing where a black move or a landing piece is about to hit.
_Avoid_: telegraph, danger zone

**Push**:
One of the 3 groups a wave lands in. The next push lands when the last one is down to 25% or after 25 seconds; the king comes in the last push.
_Avoid_: spawn group, sub-wave

**Landing**:
A black piece arriving with a push or a king's call: its square shows a warning, then the piece appears there.

**Pace**:
How fast the game runs at 1× speed: 0.65 game seconds per real second. Like speed, it never changes how a battle ends.

**Contact**:
A white pawn touching a black piece. It hurts the pawn on the piece's own timer.

**Drop**:
Plain pawns that appear where a black piece dies, joining the battle at once.

**Crowding**:
The rule that shrinks drops as the swarm grows.

**Power-up**:
A coloured orb a kill can drop; the first pawn to touch it triggers its effect for the whole swarm.
_Avoid_: pickup, buff orb

**Stun**:
A white pawn knocked out for a moment (by a bomb blast): it can't move or strike, but takes no damage from it.

**Shop**:
The screen between waves where the player buys pawn types.

**Offer**:
One pawn type for sale in the shop.
_Avoid_: card, item

**Recruit**:
Sacrifice plain pawns to turn one plain pawn into a pawn type. At most 5 per type per wave.
_Avoid_: buy, purchase, upgrade

**Reroll**:
Pay plain pawns to replace the shop's offers.

**Lock**:
Keep an offer for the next shop visit.

**Rarity**:
How rare and strong a pawn type is: common, rare or epic. Gates which wave it can first appear.

**Promote**:
A Promoter pawn turning into a white queen on reaching a board edge.

**Passive**:
A pawn type's always-on ability.

**Skill**:
A pawn type's ability the player fires by hand during a battle, with a cooldown.
_Avoid_: active, ultimate, spell
