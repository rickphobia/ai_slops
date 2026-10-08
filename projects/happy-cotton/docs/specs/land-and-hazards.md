# Happy Cotton: land, keeping back, fertiliser, disasters and worms (draft)

**Status:** draft. Decisions agreed with the owner (2026-10-08). It becomes a full spec with `/to-spec`, then tickets. Built after the store (ticket 17), because land, fertiliser and pesticide are sold there.

## Why

Hay Day players expect the farm to grow and to have things go wrong. Here both serve the satire. The Worker pays out of his own Labour Points to grow the state's Farm, and each plot he buys makes his own laps longer. He does it for one reason: more land is more cotton, and more cotton is more he can quietly keep back for himself and his Family. When nature strikes, the state never lowers the Quota; it blames him instead.

## Decisions

| Feature | Decision | Satire |
|---|---|---|
| **More land** | The store sells one new Plot at a time, each pricier than the last. The fence moves out to take it in, so the track around it grows longer, and so does every lap. Each new Plot raises the Quota, but by less than it yields: the gap is what he can keep back. Land is the one purchase that leaves him a margin, and only an illicit one. | He pays to expand the state's Farm, and his laps grow with it. The only way to get ahead is to steal from the state. |
| **Keeping back** | At the end of each Shift, before the Quota check, The App asks him to hand in his cotton. A slider lets him hand in all of it or keep some back. Only what he hands in counts towards the Quota, so keeping back makes a miss likelier. Kept cotton is sold on the side and becomes **hidden savings**, which he can spend on anything Labour Points buy: the store, Bills, school fees, the call home. | The state takes almost everything he grows. Keeping a little back for his Family is the one act that's his own, and the state calls it theft. |
| **Audits** | Sometimes at the end of a Shift The App announces a "Harmony Audit". The chance and the strictness grow with how much he has kept back lately compared with what his Plots should yield. More Plots make a small cut harder to spot. A tell comes first: the Overseer starts watching the scale. **Caught once:** his hidden savings are taken, the longest Study Session yet, and he is "on watch" (audits come more often for a while). **Caught again:** the Caught ending (see `story-and-endings.md`). | Getting caught is the result of a choice the player can weigh, not bad luck. |
| **Fertiliser** | A one-use item bought in the store and spread on one Plot when planting: that crop grows faster. It is used up, so it isn't an Upgrade and doesn't raise the Quota, but its price rises every Shift. | The App's cheerful brand, ever dearer. |
| **Natural disasters** | Now and then during a Shift, with a warning from The App a little before. **Sandstorm:** the sky turns orange, dust blows across the field and growth slows while it lasts. **Heatwave:** running adds Exhaustion faster. Only while the game is open. | The Quota is never lowered. The App cheers "Nature cannot stop us!" and any shortfall is still his. |
| **Worms** | Bollworms, a real cotton pest, appear on growing Plots now and then. Tapping the Plot picks them off, which takes time and adds Exhaustion; pesticide bought in the store protects a Plot for its next crop. Worms left too long eat the crop, and The App logs it as Negligence. Only while the game is open. | Pests are the Worker's fault too. |

## Open questions for `/to-spec`

- **Keeping back in numbers:** how much a Plot yields beyond its Quota rise, the audit chance curve, how long "on watch" lasts, and whether a met Quota or a long clean run lowers it. Does spending hidden savings in the state's store raise the audit risk? Recommended: yes, a little, since the state can see what he buys.
- **Hidden savings on screen:** kept apart from Labour Points, somewhere The App doesn't show (for example under his mattress in the dormitory), and saved with the game.
- **Sources:** cotton kept back and sold on the side is the game's invention. Check whether audits or penalties for it are documented; if not, mark them as invention like the Generator.

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
- **Economy spec, ticket 19 (Bills, pay slip and Debt):** the hand-in comes just before the pay slip.
- **Story and endings draft:** the Caught ending.
