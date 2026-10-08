# 32: Supplies and Fertiliser

**What to build:** The store gets a supplies section. The Worker buys Fertiliser into a small stock, picks it from a supplies bar in the field and taps a Seedling to spread it, and that crop grows faster for the rest of its growth. Its price rises every Shift, and the store cheerfully says tomorrow's (land and hazards spec: stories 56–68; "Implementation Decisions": Supplies, Fertiliser).

**Blocked by:** 31 (Harmony Audits)

**Status:** ready

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay, adapters/field, adapters/save

**Effort:** medium

- [ ] The store sells Fertiliser into a stock capped at a most-held value, paid with Labour Points or hidden savings
- [ ] Its price is the first price plus a rise for each Shift after the first; the store shows today's and tomorrow's
- [ ] The supplies bar shows what he holds; picking a supply makes the next tap use it, then taps work as normal again
- [ ] Fertiliser can only go on a Seedling that isn't fertilised, with plain refusals (none held, wrong Stage, already fertilised)
- [ ] A fertilised crop grows faster by a set factor, online and offline, until it leaves the Plot; it doesn't raise the Quota
- [ ] A fertilised Plot looks different
- [ ] Prices, factor and most held come from the tuning table, with validation
- [ ] Supplies held and fertilised Plots are saved
- [ ] Supplies bought and used (kind, Plot) are logged
- [ ] GUT tests through Farm cover buying, the cap, the price, spreading and growth
