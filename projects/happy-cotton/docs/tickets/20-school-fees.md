# 20: School fees

**What to build:** The App tells the Worker that his two Children are at a state boarding school, and every third Shift their school fees are charged, after rent. The overlay shows when the next fees are due. A school-fees Bill that leaves a shortfall marks the fees unpaid, which the letters (ticket 21) and later the Taken ending use (economy spec: stories 30–31, 35, 43, 53, 62; "Implementation Decisions": Ledger, Sources register).

**Blocked by:** 19 (Bills, the pay slip and Debt)

**Status:** done

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay, adapters/save

**Effort:** low

- [x] School fees are charged every N Shifts (tuning, 3 to start), after electricity and rent, and appear on the pay slip; other Shifts' pay slips show none
- [x] The overlay shows the Shift when the next fees are due
- [x] A school-fees Bill that leaves a shortfall sets "school fees unpaid", which clears when Debt reaches zero
- [x] The rules count school-fees Bills in a row that left a shortfall, and a covered one resets the count
- [x] An App line introduces the Children at a state boarding school, citing zenz-2019; the fees are never presented as fact and the Sources page doesn't cite them
- [x] The next-fees Shift, the unpaid flag and the count are saved; a save without them restores with fees due on the third Shift after the restored one
- [x] GUT tests through Farm and tuning validation tests
