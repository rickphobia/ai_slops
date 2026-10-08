# 19: Bills, the pay slip and Debt

**What to build:** At the end of every Shift the state charges its Bills: electricity, priced per lap the Worker ran on the Generator, then a flat dormitory rent. The App shows a bright pay slip: earned, each Bill, what's left. A Bill the Labour Points can't cover becomes Debt, shown in red and never forgiven: everything earned pays it down first, and while it lasts the Worker can buy neither Privileges nor Upgrades (economy spec: stories 23–24, 27–29, 32–42, 58, 60; "Implementation Decisions": Ledger, Shift end).

**Blocked by:** 18 (Tools Upgrades)

**Status:** ready

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay, adapters/save

**Effort:** medium

- [ ] At Shift end, after the Quota check and before the Exhaustion floor rises, electricity (laps run this Shift × price per lap) then rent are charged, met Quota or missed
- [ ] No Bills are charged while the game is closed
- [ ] The pay slip is an App message with the earned amount, each Bill and the balance or Debt, worded in the state's voice, and the overlay shows it as a card
- [ ] A shortfall becomes Debt; Labour Points and Debt are never both above zero; earnings pay Debt down first
- [ ] The overlay shows Debt in red where Labour Points usually are
- [ ] The App says when the Worker falls into Debt and when he clears it
- [ ] Debt blocks every Privilege and Upgrade, with "in Debt" as the reason
- [ ] A missed Quota takes away every Privilege for the next Shift
- [ ] Negligence never creates Debt
- [ ] Electricity price and rent come from the tuning table, with validation
- [ ] The balance is saved and a negative one restores as Debt
- [ ] Each Bill, whether it was covered, and Debt incurred or cleared are logged
- [ ] GUT tests through Farm cover each rule above
