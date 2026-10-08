# Happy Cotton: land, fertiliser, disasters and worms (draft)

**Status:** draft. Decisions agreed with the owner (2026-10-08). It becomes a full spec with `/to-spec`, then tickets. Built after the store (ticket 17), because land, fertiliser and pesticide are sold there.

## Why

Hay Day players expect the farm to grow and to have things go wrong. Here both serve the satire. The Worker pays out of his own Labour Points to grow the state's Farm, and each plot he buys makes his own laps longer. When nature strikes, the state never lowers the Quota; it blames him instead.

## Decisions

| Feature | Decision | Satire |
|---|---|---|
| **More land** | The store sells one new Plot at a time, each pricier than the last. The fence moves out to take it in, so the track around it grows longer, and so does every lap. Each new Plot raises the Quota, like an Upgrade. | He pays to expand the state's Farm. More land means more running per lap, and more to tend and lose to Withering. |
| **Fertiliser** | A one-use item bought in the store and spread on one Plot when planting: that crop grows faster. It is used up, so it isn't an Upgrade and doesn't raise the Quota, but its price rises every Shift. | The App's cheerful brand, ever dearer. |
| **Natural disasters** | Now and then during a Shift, with a warning from The App a little before. **Sandstorm:** the sky turns orange, dust blows across the field and growth slows while it lasts. **Heatwave:** running adds Exhaustion faster. Only while the game is open. | The Quota is never lowered. The App cheers "Nature cannot stop us!" and any shortfall is still his. |
| **Worms** | Bollworms, a real cotton pest, appear on growing Plots now and then. Tapping the Plot picks them off, which takes time and adds Exhaustion; pesticide bought in the store protects a Plot for its next crop. Worms left too long eat the crop, and The App logs it as Negligence. Only while the game is open. | Pests are the Worker's fault too. |

## Open questions for `/to-spec`

- **Laps and land:** `lap_seconds` is fixed today. With a growing track, does a lap take longer (the same pace over a longer track), and does `laps_before_breath` stay the same, so he runs further before each breath? Recommended: yes to both.
- **How far land grows:** the largest Farm (columns and rows), and whether the camera's zoom and pan limits grow with it.
- **How often:** disaster and worm frequency, warning time and lengths, all in the tuning table. They must never make a Quota impossible on their own.
- **Saved state:** bought Plots, a Plot's fertiliser or pesticide, and worms on a Plot are saved. A disaster in progress is not saved; it simply ends when the game closes.
- **Debug mode:** buttons to start a sandstorm, a heatwave or a worm attack now, like Skip time.
- **Reduced motion:** the blowing dust and heat shimmer are toned down.
- **Glossary:** new words, such as Fertiliser, Pesticide, Bollworm, Sandstorm and Heatwave, and whether "disaster" needs its own term.
- **Sources:** bollworms and sandstorms in Xinjiang's cotton belt are real. Check whether either needs a source. Pesticide spraying by the Worker himself, and any health cost, would need one.

## Depends on

- **Economy spec, ticket 17 (store and Generator upgrades):** the store the new items are sold in.
- **Ticket 24 (power tiles):** a longer track means more tiles.
