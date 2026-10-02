# Real-time fixed-step battle instead of a tick-by-tick board game

The first build moved one piece per turn on the grid, every 250 ms. Playing it was boring: one pawn and one knight slowly taking turns on an empty board. A throwaway prototype showed the How Many Dudes feel needs hundreds of units acting at once, so the battle is now real time with a fixed 1/60 s step: white pawns move freely (straight lines only) while black pieces stay on squares, move by chess rules, and hit whole squares after a red warning. Determinism is kept by stepping a pure function with a seeded RNG and recorded skill inputs.

**Trade-offs:** we throw away most of the tick-based battle code from tickets 02–03, and white pawns no longer follow the grid, which makes the chess link weaker for white.
