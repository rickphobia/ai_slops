# 18: Tools Upgrades

**What to build:** The store sells better tools, tier by tier. Each tier makes a pick faster and lowers how much cotton the Worker drops when Exhaustion is high. Like the Generator, each tier raises the Quota from the next Shift by about what it adds (economy spec: stories 13–15, 17, 19–20; "Implementation Decisions": Store).

**Blocked by:** 17 (The store, with Generator Upgrades)

**Status:** done

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay, adapters/field, adapters/save

**Effort:** low

- [x] Buying a tools tier shortens a pick and lowers the share of cotton dropped above the Exhaustion mistake threshold, straight away
- [x] Its Quota rise follows the same rule as the Generator's
- [x] The store lists tools with price, effect and Quota rise, and marks the top tier
- [x] The tools look different in the field at each tier
- [x] The tuning table holds the tools tier list with the same validation as the Generator's, and effects may only improve from tier to tier
- [x] Tools tiers are saved; a save without them restores with none
- [x] GUT tests through Farm (randomness injected for drops) and tuning validation tests
