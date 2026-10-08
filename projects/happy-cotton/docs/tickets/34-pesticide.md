# 34: Pesticide

**What to build:** The store sells Pesticide into the supplies stock. Sprayed from the supplies bar on a Plot without Bollworms, it protects the crop there, or the next one planted, until that crop is picked, eaten or Withered (land and hazards spec: stories 56, 69–71, 88; "Implementation Decisions": Pesticide).

**Blocked by:** 33 (Bollworms)

**Status:** ready

**Touches:** rules, config/tuning, content/app-text, adapters/field, adapters/save

**Effort:** low

- [ ] The store sells Pesticide at a fixed price (tuning) into the capped stock
- [ ] It can be sprayed on any Plot without Bollworms that isn't already protected, with plain refusals
- [ ] A protected Plot never gets Bollworms, until the crop in it (or the next one planted) leaves the Plot
- [ ] A protected Plot looks different
- [ ] Protected Plots are saved
- [ ] No line about Pesticide makes a factual claim without a source
- [ ] GUT tests through Farm cover spraying, protection and when it ends
