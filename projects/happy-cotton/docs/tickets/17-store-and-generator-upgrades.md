# 17: The store, with Generator Upgrades and the rest hour

**What to build:** The App gets a cheerful store with two sections, Upgrades and Privileges. The rest-hour button moves into the Privileges section. In Upgrades, the Worker buys better Generators, tier by tier: each makes every second of running grow more cotton, and the store says in The App's voice how much it raises the Quota. That rise applies from the next Shift. Working smarter never gets him ahead (economy spec: stories 1–12, 14–21, 56–57, 61; "Implementation Decisions": Store, Tuning table, Save, Debug mode).

**Blocked by:** 16 (Labour Points move into a Ledger)

**Status:** done

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay, adapters/field, adapters/save, adapters/debug, entrypoint

**Effort:** medium

- [x] The store opens from The App without leaving the field and works with touch and mouse on a phone-sized landscape screen
- [x] Each item shows its price; each Upgrade also shows its effect and its Quota rise
- [x] Buying a Generator tier costs Labour Points and multiplies growth per second of running straight away
- [x] The Quota for each later Shift includes the Quota rise of every Upgrade bought before that Shift began; the current Shift's Quota doesn't change
- [x] Refusals give the reason (not enough Labour Points, Privileges taken away, in a Study Session, fully upgraded), and a fully upgraded item is marked
- [x] The App celebrates a purchase (new message keys with text)
- [x] The rest hour is bought from the store's Privileges section
- [x] The Generator looks different in the field at each tier (simple model or material change)
- [x] The tuning table holds the Generator tier list (price, growth multiplier, Quota rise) and rejects an empty list, a price that isn't positive, a Quota rise below 1 or not whole, and a multiplier that falls from one tier to the next
- [x] Upgrade tiers are saved; a save without them restores with no Upgrades
- [x] Purchases are logged (item, tier, price)
- [x] Debug mode adds a "+100 Labour Points" control; players never see it
- [x] GUT tests through Farm cover each rule above; tuning validation tests cover the tier list
- [x] Works in the web export on a phone-sized screen (record what was checked in the PR)
