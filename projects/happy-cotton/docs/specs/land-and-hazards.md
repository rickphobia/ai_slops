# Happy Cotton: land, Fertiliser, Disasters and Bollworms

**Status:** spec. Design decisions agreed with the owner on 2026-10-08. The open questions from the draft are settled below, and the ones settled without the owner are listed for confirmation in "Further Notes". Built after the store (ticket 17), because land, Fertiliser and Pesticide are sold there.

## Problem Statement

Hay Day players expect two things from a farm game: the farm grows, and now and then something goes wrong. Happy Cotton has neither yet. The field is fixed at twelve Plots, and the only thing that goes wrong is the Worker himself: he misses a Quota or lets a crop Wither.

The owner wants both to serve the satire. The Farm should grow, but at the Worker's expense: he pays for the state's land out of his own Labour Points, and every Plot he adds makes his own laps longer. When nature strikes, the state should never lower the Quota. It blames him instead. None of this may make a Quota impossible on its own, and any factual claim the game makes about the cotton belt must trace to a source.

## Solution

The App's store sells **land**, one Plot at a time, each dearer than the last. When the Worker buys a Plot in a new column or row, the fence moves out to take in the whole strip, and the track around it grows longer. Every lap from then on takes longer and tires him more, and each new Plot raises the Quota, like an Upgrade.

The store also sells two **supplies**, kept in a small stock and used from a supplies bar in the field. **Fertiliser** is spread on a Seedling to make that crop grow faster. Its price rises every Shift. **Pesticide** protects a Plot from Bollworms until its crop leaves the Plot.

Now and then during a Shift, The App warns of a **Disaster** a little before it strikes. In a **Sandstorm** the sky turns orange, dust blows across the field and crops grow slower while it lasts. In a **Heatwave** every lap tires the Worker faster. The App cheers "Nature cannot stop us!" and the Quota stays where it was.

**Bollworms**, a real cotton pest, appear on growing Plots now and then. Tapping a Plot picks them off, which takes time and adds Exhaustion. Bollworms left too long eat the crop, and The App logs it as Negligence.

Disasters and Bollworms happen only while the game is open.

## User Stories

### Land

1. As a player, I want to buy more land in the store, so that the Farm grows the way a farm game's should.
2. As a player, I want to buy one Plot at a time, so that each purchase is something I can afford and plan for.
3. As a player, I want each Plot to cost more than the last, so that there's always a bigger thing to save for.
4. As a player, I want the store to tell me, in The App's voice, how much the next Plot raises the Quota, so that the trade is out in the open.
5. As a player, I want a new Plot's Quota rise to start with the next Shift, like an Upgrade's, so that the Quota bar doesn't jump mid-Shift.
6. As a player, I want the fence to move out and take in a whole new column or row when I buy its first Plot, so that I see the Farm swallow land.
7. As a player, I want the cells of that strip I haven't bought yet shown as hard, unworked ground inside the fence, so that I can see what the next Plots will be.
8. As a player, I want the track to grow with the fence, so that buying land visibly makes the Worker's laps longer.
9. As a player, I want a lap to take longer on a longer track, at the same pace, so that the cost of land is felt in his body.
10. As a player, I want a longer lap to add more Exhaustion, the same amount for every second of running, so that land makes him more tired, not just slower.
11. As a player, I want the Worker to run the same number of laps before he stops to breathe, so that he runs further before every breath on a bigger Farm.
12. As a player, I want a new lap length to start with his next lap, so that the lap in progress never jumps.
13. As a player, I want the new land added on the right and at the back, so that the gate, the Generator and my usual view stay where they were.
14. As a player, I want a largest Farm, and the land item marked as fully bought when I reach it, so that I know there's no more to buy.
15. As a player, I want the camera's pan limits to follow the track as it grows, so that I can always reach every Plot and every part of the track.
16. As a player, I want to zoom out far enough to see the whole Farm however big it grows, so that I can take in the field at a glance.
17. As a player, I want new Plots to work like the first twelve (plant, grow, pick, Wither), so that there's nothing new to learn.
18. As a player, I want The App to celebrate a new Plot as the state's gain, so that the Worker's money plainly buys someone else's farm.

### Supplies

19. As a player, I want the store to sell Fertiliser and Pesticide, so that I can prepare for slow growth and pests.
20. As a player, I want to hold a small stock of each supply, with the most I can hold shown, so that I can buy ahead without hoarding forever.
21. As a player, I want a supplies bar in the field showing how many of each I hold, so that I know what I can use without opening the store.
22. As a player, I want to pick a supply from the bar and tap a Plot to use it, so that it works like Hay Day's tools.
23. As a player, I want my next tap after using a supply to do the normal thing again, so that I don't spread Fertiliser by accident.
24. As a player, I want to be told plainly why a supply can't be used on a Plot (none held, wrong Stage, already fertilised, already protected, Bollworms on it), so that I'm never confused.

### Fertiliser

25. As a player, I want to spread Fertiliser on a Plot at its Seedling Stage, so that the crop in it grows faster.
26. As a player, I want a fertilised crop to grow faster for the rest of its growth, by a set amount, so that the gain is clear.
27. As a player, I want a fertilised Plot to look different, so that I can see which crops I've fertilised.
28. As a player, I want Fertiliser used up by one crop, so that I have to buy it again.
29. As a player, I want Fertiliser not to raise the Quota, since it's used up rather than kept, so that it feels different from an Upgrade.
30. As a player, I want the price of Fertiliser to rise every Shift and never fall, so that The App's cheerful brand feels ever dearer.
31. As a player, I want the store to tell me tomorrow's Fertiliser price, cheerfully, so that the rise is out in the open.

### Pesticide

32. As a player, I want to spray Pesticide on any Plot without Bollworms, so that the crop in it, or the next one planted there, is safe from them.
33. As a player, I want the protection to last until that crop is picked, eaten or Withered, so that one spray covers one crop.
34. As a player, I want a protected Plot to look different, so that I know which Plots are safe.

### Disasters

35. As a player, I want a Disaster to strike now and then during a Shift, so that the Farm feels at nature's mercy.
36. As a player, I want The App to warn me a little before a Disaster strikes, so that I can prepare.
37. As a player, I want at most one Disaster in a Shift, and none in the first Shift, so that I learn the game before it gets harder.
38. As a player, I want a Sandstorm to turn the sky orange and blow dust across the field, so that I can see it.
39. As a player, I want crops to grow slower while a Sandstorm lasts, so that it costs me cotton.
40. As a player, I want a Heatwave to show as shimmer and a harsher light, so that I can see it.
41. As a player, I want every lap during a Heatwave to add more Exhaustion, so that it costs the Worker's body.
42. As a player, I want The App to cheer "Nature cannot stop us!" and keep the Quota where it was, so that I feel the state blaming him for the weather.
43. As a player, I want to see how long the Disaster has left, so that I can plan around it.
44. As a player, I want a Disaster never to make a Quota impossible on its own, so that the game stays hard but fair.
45. As a player, I want a Disaster to end when I close the game, so that closing the game never costs me more than playing it.
46. As a player who prefers less motion, I want the blowing dust and heat shimmer toned down, so that the effects stay comfortable.

### Bollworms

47. As a player, I want Bollworms to appear on growing Plots now and then, so that the crops need tending, not just watering.
48. As a player, I want Plots with Bollworms to be easy to spot, so that I can react before they eat the crop.
49. As a player, I want tapping a Plot with Bollworms to pick them off, so that I can save the crop.
50. As a player, I want picking off Bollworms to take time and add Exhaustion, so that saving a crop has a cost.
51. As a player, I want a protected Plot never to get Bollworms, so that Pesticide is worth buying.
52. As a player, I want Bollworms left too long to eat the crop, emptying the Plot, so that ignoring them costs the cotton.
53. As a player, I want The App to log an eaten crop as Negligence, punished like a Withered one, so that pests are the Worker's fault too.
54. As a player, I want Bollworms to come and eat only while the game is open, so that closing the game never costs me more than playing it.
55. As a player, I want Bollworms not to come or eat during a Study Session, when the state has taken the Worker off the field, so that I'm never punished for something I couldn't stop.
56. As a player, I want a crop that ripens with Bollworms on it to stay unpickable until I pick them off, so that I always deal with them first.

### Saving

57. As a returning player, I want my land, my supplies, which Plots are fertilised or protected, and Bollworms on Plots all saved, so that nothing about the Farm resets.
58. As a player with a save from before this update, I want my game to carry on with the first twelve Plots, no supplies and no Bollworms, so that the update doesn't wipe my progress.

### Owner and developer

59. As a developer, I want every price, rise, chance, length, rate and size (land, supplies, Disasters, Bollworms) in the tuning table, so that balancing never means hunting through code.
60. As a developer, I want the tuning table to reject values that would let a Disaster make a Quota impossible (a Disaster longer than a quarter of a Shift, a Sandstorm slowing growth below half), so that the fairness promise can't be broken by accident.
61. As a developer, I want Disasters and Bollworms to draw on the Farm's one source of chance, so that tests decide them.
62. As a developer, I want the rules to emit Disaster warnings, starts and ends, Bollworms arriving and a crop eaten as App messages or field events, as data, so that I can test them without rendering anything.
63. As a developer, I want debug buttons to start a Sandstorm, a Heatwave or Bollworms now, so that I can see each without waiting.
64. As a developer, I want structured logs for land and supplies bought, supplies used, Disasters starting and ending, and Bollworms arriving, picked off and eating a crop, so that I can debug a player's report.
65. As the owner, I want any factual claim about Bollworms, Sandstorms or Pesticide in The App or on the Sources page to cite a source, so that ground rule 1 holds.

## Implementation Decisions

### Modules

- **Farm rules (the seam, modified).** Still the one object the game and the tests drive.
  - **Commands:** buy a Plot, buy a supply (Fertiliser or Pesticide), fertilise a Plot, spray a Plot, and pick off Bollworms. Tapping a Plot with Bollworms goes to "pick off Bollworms" before planting or picking. Each returns whether it happened and, if not, why: not enough Labour Points, in Debt, in a Study Session, Worker busy, fully bought, stock full, none held, wrong Stage, already fertilised, already protected, or Bollworms on the Plot.
  - **Views (read-only):** the land: the Farm's columns and rows, and the cell each Plot sits in. The store gains a land item (next Plot's price and Quota rise, or fully bought) and the supplies (price today, price next Shift, held, most held). Each Plot's view gains fertilised, protected and Bollworms (with seconds left before they eat the crop). The Shift view gains the Disaster: none, warned (kind, seconds until it strikes) or striking (kind, seconds left). The Worker view gains the current lap length.
  - **App messages (data, as now):** new keys for Plot bought, supply bought, Disaster warning, Disaster struck ("Nature cannot stop us!"), Disaster passed, Bollworms on a Plot, and crop eaten (as Negligence). Refusal reasons are rendered by The App, like the existing ones.
- **Land (new, inside the rules, not a seam).** It knows the Farm's columns and rows and the cell of every Plot. Plots keep their number for good: a new Plot gets the next number, so the first twelve keep the numbers they have today. The field grows by whole columns and rows, in a fixed order: a column on the right, then a row at the back, and so on, until the largest Farm. Within a strip, Plots are bought from the front or the left. Buying a strip's first Plot widens the Farm to take in the whole strip; the rest of its cells are unworked ground until bought. The start and the largest Farm (4 × 3 and, to start, 6 × 5) are in the tuning table. Farm owns Land and delegates to it; it is tested only through Farm. Farm's starting land now comes from the tuning table, not from the field adapter.
- **Lap length.** A lap of the first Farm takes `lap_seconds`. Each new column or row adds a set number of seconds (tuning), chosen so the shipped pace stays the same over the longer track (each new column or row adds two plot spacings to the track). A new length starts with the Worker's next lap. Exhaustion from running is charged per second, at the first Farm's rate (`exhaustion_per_lap` over `lap_seconds`), so a longer lap adds more. Laps before a breath don't change. Growth per second of running doesn't change either, so a bigger Farm gains nothing per lap; it only has more Plots to fill.
- **Quota.** The Quota for a Shift adds the Quota rise of every Plot bought before that Shift began, alongside the Upgrades' (economy spec).
- **Supplies (inside the Store, from the economy spec).** A stock of each, capped by a "most held" value (tuning). Fertiliser's price is its first price plus a rise for every Shift after the first, so it's derived from the Shift number and not saved. Pesticide has a fixed price. Debt blocks buying supplies and land, as it blocks Upgrades.
- **Fertiliser.** It can only be spread on a Plot at its Seedling Stage that isn't fertilised. For the rest of that crop's growth, each second counts as more growth by a set factor (tuning), combined with the Generator Upgrade's factor. Offline growth (the night shift) gets the same factor. It ends when the crop leaves the Plot.
- **Pesticide.** It can be sprayed on any Plot without Bollworms that isn't protected already, empty or growing. The Plot is protected until the crop in it, or the next one planted, leaves the Plot (picked, eaten or Withered).
- **Disasters (new, inside the rules, not a seam).** At the start of every Shift after the first, the rules roll for a Sandstorm, then (if none) a Heatwave, each with its own chance per Shift, and if one comes, roll when in the Shift it strikes. A warning comes a set number of seconds before. It lasts a set length, counted in online Shift time, and always ends within the Shift. A Sandstorm multiplies growth per second of running by a factor below 1. A Heatwave multiplies Exhaustion from running by a factor above 1. A Disaster planned or in progress is not saved: a restored Shift has none.
- **Bollworms (new, inside the rules, not a seam).** Every set number of seconds of online play outside Study Sessions, each growing Plot that is unprotected and has no Bollworms gets them by chance (tuning). From then a timer runs in online time, paused in Study Sessions. When it runs out the crop is eaten: the Plot is emptied and Negligence is logged, docking Labour Points (never below zero) and starting the Negligence Study Session, exactly as for a Withered Plot. Picking them off takes a set time, during which the Worker is busy as in a slow action, and adds a set Exhaustion. A crop that ripens with Bollworms on it can't be picked until they are picked off.
- **Tuning table (config, extended).** New values: largest columns and rows (start columns and rows too), first Plot price, Plot price rise, Quota rise per Plot, extra lap seconds per new column or row, Fertiliser first price, rise per Shift and growth factor, Pesticide price, most supplies held, Sandstorm and Heatwave chance per Shift, warning seconds, Disaster seconds, Sandstorm growth factor, Heatwave Exhaustion factor, Bollworm check seconds and chance, Bollworm eat seconds, pick-off seconds and Exhaustion. Validation adds: the largest Farm is at least the first; prices, rises and Quota rises are whole numbers of at least 1; a Disaster lasts at most a quarter of a Shift, and warning plus length fit in a Shift; the Sandstorm factor is between 0.5 and 1; the Heatwave factor is between 1 and 2; Bollworms take longer to eat a crop than to pick off. The test tuning table gets small round values, with Disaster and Bollworm chances at 0 so existing tests are untouched.
- **App text (content, extended).** Text for every new message key, the land and supply store blurbs, and the Disaster lines, in the state's voice. Bollworms and Sandstorms are real in Xinjiang's cotton belt, but the game makes no claim about them, so no source is needed. Any App or Sources page line that states a fact about them (or about who sprays Pesticide) must cite one, under ground rule 1.
- **Adapters.**
  - **Field:** builds Plots, unworked ground, fence and track from the land view, and rebuilds them when land is bought. The track's place is no longer a centred rectangle but follows the Farm's bounds, so the gate and Generator stay put. The track's power tiles (ticket 24) follow the longer track. Plots show fertilised, protected and Bollworm looks. The supplies bar sits in the App overlay.
  - **Field camera:** pan limits follow the track's new bounds, and the farthest zoom grows in step with the track's size.
  - **Disaster looks:** orange sky, haze and blowing dust for a Sandstorm; harsher light and heat shimmer for a Heatwave. With reduced motion the dust and shimmer are replaced by a still tint.
  - **App overlay:** the store's land item and supplies, the supplies bar, the Disaster warning and countdown.
- **Save.** The save format version goes up. The new state is the number of Plots bought (the cells follow from the fixed order), supplies held, and per Plot: fertilised, protected, and Bollworm time left. A save from the previous version is migrated: twelve Plots in the first Farm's cells, no supplies, nothing fertilised or protected, no Bollworms. It is not treated as damaged.
- **Debug mode:** adds "Sandstorm now", "Heatwave now" and "Bollworms now" (on every growing, unprotected Plot) next to Skip time, through rules commands that only exist in debug builds of the wiring.
- **Logs:** Plot bought (number, price), supply bought and used (kind, Plot), Disaster planned, struck and passed (kind, length), Bollworms arriving, picked off and eating a crop (Plot).

### Content rules for this spec

- The App never lowers the Quota for a Disaster and never admits the Disaster was anyone's fault but the Worker's.
- The store is honest about the Quota rise from land and the rising Fertiliser price. The satire is that the player sees the trade and takes it anyway.
- No health cost from Pesticide, and no claim about who sprays it. Either would need a source.

## Testing Decisions

- A good test drives the Farm rules only through their public interface (commands, advance, resume, save and restore) and checks what a player would see: the land view, store prices and availability, supplies held, a Plot's fertilised, protected and Bollworm state, the Shift's Disaster, lap length, Exhaustion, the Quota in the next Shift, and the App message keys. Tests never reach into Land, Disasters or Bollworms directly. They drive time only with advance and resume, and decide chance through the test tuning table (chances of 0 or 1) and the Farm's roll.
- **Farm rules (the main body of tests).** They cover:
  - buying Plots in the fixed order, prices rising, the strip widening the Farm, fully bought, and the refusals;
  - each Plot's Quota rise starting with the next Shift;
  - a longer lap starting with the next lap, Exhaustion per second of running unchanged, and laps before a breath unchanged;
  - buying supplies, the stock cap, Fertiliser's price by Shift, and the refusals;
  - Fertiliser only on a Seedling, its growth factor online and offline, and its end when the crop leaves;
  - Pesticide protecting one crop and blocking Bollworms;
  - no Disaster in the first Shift, at most one a Shift, warning then strike then pass, the Sandstorm's growth factor, the Heatwave's Exhaustion factor, the Quota unchanged, and no Disaster after a restore;
  - Bollworms arriving on growing, unprotected Plots, picking them off (time, Exhaustion), eating a crop as Negligence, none offline, none in a Study Session, and ripe crops blocked until they're picked off;
  - save round trips, and migration of a previous-version save.
- **Tuning table:** validation tests for every new value and cross-check (a Disaster too long, a Sandstorm factor below 0.5, a largest Farm smaller than the first).
- **Field geometry:** the plot grid placing cells for a Farm of any size, with the first twelve cells where they are today; the track path following the Farm's bounds, its length growing by two spacings per new column or row, and the gate staying put; the field camera's pan limits and farthest zoom following the track.
- **Content:** every new App message key has text that fills all its slots, and every cited source id exists.
- **Adapters:** light tests only where they hold logic. Disaster looks, reduced motion and the supplies bar are checked by playing the web build.
- **Prior art:** the existing rules tests (one file per rules feature, all through Farm, with the fast tuning table and a custom roll, as in the dropped-cotton tests), the plot grid, track path and field camera tests, the content and tuning validation tests, and the save migration tests from the economy tickets.

## Out of Scope

- Co-workers, Farm Levels, Reports and Quiet Acts (the next spec).
- Other crops, buildings, animals and decorations.
- Selling land, or losing it.
- Disasters or Bollworms while the game is closed.
- Other Disasters (floods, frost) and other pests.
- Any health cost of Pesticide.
- Sound for Disasters, Bollworms and supplies. A wind sound for the Sandstorm is a likely later ticket.

## Further Notes

### Decisions this spec made beyond the owner's draft (owner to confirm)

- A lap takes longer on a longer track, at the same pace, and laps before a breath stay the same (the draft's recommendation).
- Exhaustion from running is charged per second, so a longer lap adds more.
- The Farm grows from 4 × 3 to at most 6 × 5, a column on the right then a row at the back, so the gate, the Generator and the start view stay put.
- Buying a strip's first Plot fences the whole strip; the rest is unworked ground until bought.
- Plots keep their number, so old saves migrate without remapping.
- Supplies are bought into a small capped stock and used from a supplies bar. The cap stops the Worker hoarding Fertiliser before its price rises.
- Fertiliser goes on a Seedling only, and also speeds the night shift.
- Pesticide covers one crop, empty or growing.
- No Disaster in the first Shift, at most one a Shift. A planned or running Disaster is lost on close.
- A Disaster lasts at most a quarter of a Shift, and a Sandstorm slows growth to no less than half.
- Bollworms pause in Study Sessions, but not in a rest hour or a call home: those are the Worker's own choice.
- An eaten crop empties the Plot (it isn't Withered) and is punished as Negligence.
- No new sources, because the game makes no claim about Bollworms, Sandstorms or Pesticide.

### Order of work

Ticket 17 (the store) first. Land and its Quota rise come next, since the bigger track touches the most code, then supplies with Fertiliser and Pesticide, then Bollworms, then Disasters. Ticket 24 (power tiles) can land before or after: the tiles follow whatever track the field builds.
