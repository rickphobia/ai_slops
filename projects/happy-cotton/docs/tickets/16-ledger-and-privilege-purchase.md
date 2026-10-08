# 16: Labour Points move into a Ledger, and the rest hour becomes a Privilege purchase

**What to build:** A prefactor so the economy tickets are easy changes. Labour Points move out of the Farm rules into a Ledger inside the rules that holds one signed balance (a negative balance will be Debt in ticket 19). The rest-hour command becomes a general "buy a Privilege" command, with the rest hour as its only Privilege for now. The game plays exactly as before (economy spec: "Implementation Decisions", Ledger).

**Blocked by:** 08 (Exhaustion and the rest hour), 09 (Save and continue), 10 (Offline time), 11 (Withering and Negligence), 12 (Settings), 14 (Run the Generator), 15 (The Overseer at the Generator)

**Status:** done

**Touches:** rules

**Effort:** low

- [x] The Farm rules own a Ledger and delegate earning, spending and docking Labour Points to it; Farm's other public views are unchanged
- [x] Buying the rest hour goes through a "buy a Privilege" command that takes which Privilege; its refusal reasons are unchanged
- [x] Negligence docking stays clamped at zero
- [x] The save format and its contents are unchanged
- [x] Existing tests pass, changed only where they call the rest-hour command; no test is weakened or deleted
- [x] The Ledger is tested only through Farm
