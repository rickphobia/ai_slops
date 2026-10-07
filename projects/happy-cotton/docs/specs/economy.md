# Happy Cotton: the store, bills and the children (draft)

**Status:** draft. Every design question is settled with the owner (2026-10-08); it becomes a full spec with `/to-spec`, and is built after the first playable (after ticket 12).

## Decided

- **Upgrades serve the state.** The Worker spends Labour Points in The App's store on upgrades that make him more productive: a better Generator (more growth per lap) and better tools. Every upgrade also raises the Quota, so working harder only ever helps the state. The player never buys people.
- **More workers come from the state.** Co-workers are assigned at Farm Levels and share the Generator. That belongs to a later spec (Co-workers and Farm Levels), not this one.
- **Bills.** Part of what the Worker earns goes straight back to the state: electricity (for the power his own running made), rent, and school fees for his children.
- **The children.** The Worker has children held at a state boarding school far away. The boarding schools are documented (zenz-2019); the school fees are the game's own invention, like the Generator and the whip, and are never presented as fact. The children are never shown being punished.

- **Store and Quota.** The store sells Generator upgrades (more growth per lap), tools (faster picking, fewer dropped cotton) and the existing Privileges. Each upgrade raises the Quota by about what it adds, so working smarter never gets the Worker ahead.
- **When bills are charged.** At the end of each Shift: electricity, priced per lap the Worker ran, and dormitory rent, a flat charge. School fees every third Shift.
- **Debt.** When Labour Points can't cover a Bill, the shortfall becomes Debt: shown in red, never forgiven, and blocking Privileges while it lasts. Unpaid school fees also stop the Children's letters.
- **The Children.** Two children, present only through letters and a short call home (a Privilege). Their letters slowly change tone. Names and ages are decided when the letters are written.
- **Scope.** This spec covers the store, upgrades, Bills, Debt and the Children's letters. Co-workers and Farm Levels get their own spec afterwards.

## Next

Run `/to-spec` to turn this into the full spec (user stories, implementation and testing decisions), then `/to-tickets`. Building starts after the first playable (after ticket 12).
