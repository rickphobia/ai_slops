# A capture is an attack; the attacker stays put

With HP, a capture rarely kills, so "move onto the captured square" doesn't fit. We decided a capture deals the attacker's attack as damage and the attacker stays on its square, even when the target dies. Black pieces score a capture as the best possible move, so they attack whenever they can. This keeps the board readable and lets ticket 04 drop pawns on the death square.

**Trade-offs:** a knight can hit a pawn again and again from an L-square that the pawn can't strike back at. With the spec's numbers, one plain pawn wins wave 1 on only about 15% of seeds. Fixing that is a balance change (stats in `src/catalog/`) or a rule change (e.g. the attacker moves in on a kill). It needs a designer's call after playtesting.
