# Happy Cotton: land, keeping back, Fertiliser, Disasters and Bollworms

**Status:** spec. Design decisions agreed with the owner on 2026-10-08. The open questions from the draft are settled below, and the ones settled without the owner are listed for confirmation in "Further Notes". Built after the store (ticket 17), because land, Fertiliser and Pesticide are sold there, and after Bills and the pay slip (ticket 19), because the Hand-in comes just before them.

## Problem Statement

Hay Day players expect two things from a farm game: the farm grows, and now and then something goes wrong. Happy Cotton has neither yet. The field is fixed at twelve Plots, and the only thing that goes wrong is the Worker himself: he misses a Quota or lets a crop Wither.

The owner wants both to serve the satire. The Farm should grow, but at the Worker's expense: he pays for the state's land out of his own Labour Points, and every Plot he adds makes his own laps longer. He needs a reason to do it, and the game gives him one: more land is more cotton, and more cotton is more he can quietly keep back for himself and his Family. Keeping a little back is the one act that's his own, and the state calls it theft. Getting caught must be the result of a choice the player can weigh, not bad luck. When nature strikes, the state should never lower the Quota. It blames him instead. None of this may make a Quota impossible on its own, and any factual claim the game makes about the cotton belt must trace to a source.

## Solution

The App's store sells **land**, one Plot at a time, each dearer than the last. When the Worker buys a Plot in a new column or row, the fence moves out to take in the whole strip, and the track around it grows longer. Every lap from then on takes longer and tires him more. Each new Plot raises the Quota, but by less than it yields. The gap is what he can keep back: land is the one purchase that leaves him a margin, and only an illicit one.

At the end of each Shift, before the Quota check, The App asks him to **hand in** his cotton. A slider lets him hand in all of it or **keep some back**. Only what he hands in counts towards the Quota and earns Labour Points. Kept cotton is sold on the side and becomes **hidden savings**, kept in a tin under his mattress where The App never looks. He can spend them on anything Labour Points buy, and they pay a Bill his Labour Points can't cover before it turns into Debt. But the state sees what he buys in its store, so spending hidden savings there raises the audit risk a little.

Sometimes at the end of a Shift The App announces a **Harmony Audit**. The more he has kept back over the last few Shifts, compared with what his Plots should yield, the likelier one is. A tell comes first: the Overseer starts watching the scale. An audit that finds a cut too big to hide catches him. The first time, his hidden savings are taken, he serves the longest Study Session yet, and he is put **on watch**: for a few Shifts audits come more often and any cut at all is found. The second time leads to the **Caught** ending (story and endings spec).

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

### Keeping back

19. As a player, I want each new Plot to yield more cotton than it adds to the Quota, so that more land is the one way to make room to keep something back.
20. As a player, I want The App to ask me to hand in my cotton at the end of every Shift, before the Quota check, so that the state's take is a moment I face every Shift.
21. As a player, I want a slider that starts at handing in everything, so that keeping back is always something I choose.
22. As a player, I want the Hand-in to show how what I hand in compares with the Quota as I move the slider, so that I know whether keeping back will make me miss it.
23. As a player, I want only the cotton I hand in to count towards the Quota, so that keeping back is a real risk.
24. As a player, I want Labour Points paid at the Hand-in for the cotton handed in, not at each pick, so that keeping cotton back costs me wages.
25. As a player, I want a crop counter in The App's top bar, beside Labour Points, showing how many crops I've picked this Shift, so that I know how much cotton is in hand.
26. As a player, I want the counter to go up by one with every pick, with a "+1" rising from the Plot, so that each pick still feels rewarded now that Labour Points wait for the Hand-in.
27. As a player, I want a pick that drops its cotton not to add to the counter, so that the count is only cotton I can hand in.
28. As a player, I want the Quota bar to fill with the counter during the Shift, so that I can see how close the cotton in hand is to the Quota.
29. As a player, I want the counter to go back to zero when the next Shift starts, so that each Shift's count stands on its own.
30. As a player, I want the Hand-in to start from the counter's number, so that the slider's "everything" is exactly what I picked.
31. As a player, I want the Farm to wait while the Hand-in is open, so that I'm never rushed into the choice.
32. As a player who closes the game at the Hand-in, I want it still waiting when I come back, so that closing the game never decides for me.
33. As a player, I want kept cotton to turn into hidden savings at a better rate than Labour Points, so that it's worth the risk to his Family.
34. As a player, I want hidden savings kept apart from Labour Points, in a hand-drawn tin under his mattress and never in The App, so that the state's voice never knows about them.
35. As a player, I want to choose whether to pay for something in the store with Labour Points or hidden savings, so that I decide what the savings are for.
36. As a player, I want spending hidden savings in the state's store to raise the audit risk a little, so that I have to weigh what I buy with them.
37. As a player, I want the store to say nothing about that risk, so that I learn it the way the Worker would.
38. As a player, I want hidden savings to pay a Bill my Labour Points can't cover before it becomes Debt, so that his Children's school fees get paid when the wage doesn't.
39. As a player, I want paying Bills from hidden savings not to raise the audit risk, so that keeping the Children in school is never what gives him away.
40. As a player, I want Debt to keep blocking the store even when I have hidden savings, so that Debt stays never forgiven.
41. As a player, I want Negligence to dock only Labour Points, never hidden savings, so that the state only takes what it knows about.

### Harmony Audits

42. As a player, I want a Harmony Audit now and then at the end of a Shift, so that keeping back always carries a risk.
43. As a player, I want audits to come even when I've kept nothing back, and to find nothing then, so that an audit isn't proof on its own.
44. As a player, I want the chance of an audit to grow with how much I kept back over the last few Shifts, compared with what my Plots should yield, so that greed is what gets the Worker caught.
45. As a player, I want a small cut to be safe from an ordinary audit, and the safe cut to grow with my land, so that more Plots make a small cut harder to spot.
46. As a player, I want a tell before an audit, the Overseer watching the scale during the Shift, so that I can hand in everything this time.
47. As a player, I want the audit to look back over the last few Shifts, so that one honest Shift doesn't wipe the record.
48. As a player, I want a run of Shifts without keeping back to bring the risk down, as the old Shifts drop out of what the audit looks at, so that I can lie low.
49. As a player, I want an audit that finds nothing to be cheered by The App ("Your harmony is exemplary!"), so that the state's voice stays cheerful either way.
50. As a player, I want being caught the first time to take all my hidden savings and start the longest Study Session yet, so that the cost is heavy but survivable.
51. As a player, I want to be put on watch after being caught, with audits more often and any cut at all found, for a few Shifts, so that I have to lie low for a while.
52. As a player, I want to see that I'm on watch and for how many more Shifts, in The App's voice ("You have been selected for Harmony Support!"), so that I can plan around it.
53. As a player, I want being caught a second time to lead to the Caught ending, so that the choice I kept making has an end.
54. As a player, I want being caught shown as the state's paperwork, never as violence, so that the game condemns the system without displaying harm.
55. As a player, I want a missed Quota and being caught in the same Shift to start only the longer Study Session, so that I'm punished once, heavily, not twice.

### Supplies

56. As a player, I want the store to sell Fertiliser and Pesticide, so that I can prepare for slow growth and pests.
57. As a player, I want to hold a small stock of each supply, with the most I can hold shown, so that I can buy ahead without hoarding forever.
58. As a player, I want a supplies bar in the field showing how many of each I hold, so that I know what I can use without opening the store.
59. As a player, I want to pick a supply from the bar and tap a Plot to use it, so that it works like Hay Day's tools.
60. As a player, I want my next tap after using a supply to do the normal thing again, so that I don't spread Fertiliser by accident.
61. As a player, I want to be told plainly why a supply can't be used on a Plot (none held, wrong Stage, already fertilised, already protected, Bollworms on it), so that I'm never confused.

### Fertiliser

62. As a player, I want to spread Fertiliser on a Plot at its Seedling Stage, so that the crop in it grows faster.
63. As a player, I want a fertilised crop to grow faster for the rest of its growth, by a set amount, so that the gain is clear.
64. As a player, I want a fertilised Plot to look different, so that I can see which crops I've fertilised.
65. As a player, I want Fertiliser used up by one crop, so that I have to buy it again.
66. As a player, I want Fertiliser not to raise the Quota, since it's used up rather than kept, so that it feels different from an Upgrade.
67. As a player, I want the price of Fertiliser to rise every Shift and never fall, so that The App's cheerful brand feels ever dearer.
68. As a player, I want the store to tell me tomorrow's Fertiliser price, cheerfully, so that the rise is out in the open.

### Pesticide

69. As a player, I want to spray Pesticide on any Plot without Bollworms, so that the crop in it, or the next one planted there, is safe from them.
70. As a player, I want the protection to last until that crop is picked, eaten or Withered, so that one spray covers one crop.
71. As a player, I want a protected Plot to look different, so that I know which Plots are safe.

### Disasters

72. As a player, I want a Disaster to strike now and then during a Shift, so that the Farm feels at nature's mercy.
73. As a player, I want The App to warn me a little before a Disaster strikes, so that I can prepare.
74. As a player, I want at most one Disaster in a Shift, and none in the first Shift, so that I learn the game before it gets harder.
75. As a player, I want a Sandstorm to turn the sky orange and blow dust across the field, so that I can see it.
76. As a player, I want crops to grow slower while a Sandstorm lasts, so that it costs me cotton.
77. As a player, I want a Heatwave to show as shimmer and a harsher light, so that I can see it.
78. As a player, I want every lap during a Heatwave to add more Exhaustion, so that it costs the Worker's body.
79. As a player, I want The App to cheer "Nature cannot stop us!" and keep the Quota where it was, so that I feel the state blaming him for the weather.
80. As a player, I want to see how long the Disaster has left, so that I can plan around it.
81. As a player, I want a Disaster never to make a Quota impossible on its own, so that the game stays hard but fair.
82. As a player, I want a Disaster to end when I close the game, so that closing the game never costs me more than playing it.
83. As a player who prefers less motion, I want the blowing dust and heat shimmer toned down, so that the effects stay comfortable.

### Bollworms

84. As a player, I want Bollworms to appear on growing Plots now and then, so that the crops need tending, not just watering.
85. As a player, I want Plots with Bollworms to be easy to spot, so that I can react before they eat the crop.
86. As a player, I want tapping a Plot with Bollworms to pick them off, so that I can save the crop.
87. As a player, I want picking off Bollworms to take time and add Exhaustion, so that saving a crop has a cost.
88. As a player, I want a protected Plot never to get Bollworms, so that Pesticide is worth buying.
89. As a player, I want Bollworms left too long to eat the crop, emptying the Plot, so that ignoring them costs the cotton.
90. As a player, I want The App to log an eaten crop as Negligence, punished like a Withered one, so that pests are the Worker's fault too.
91. As a player, I want Bollworms to come and eat only while the game is open, so that closing the game never costs me more than playing it.
92. As a player, I want Bollworms not to come or eat during a Study Session, when the state has taken the Worker off the field, so that I'm never punished for something I couldn't stop.
93. As a player, I want a crop that ripens with Bollworms on it to stay unpickable until I pick them off, so that I always deal with them first.

### Saving

94. As a returning player, I want my land, my supplies, which Plots are fertilised or protected, Bollworms on Plots, my hidden savings, what I kept back lately, a planned audit, being on watch and a Hand-in still open all saved, so that nothing about the Farm resets and reloading never dodges an audit.
95. As a player with a save from before this update, I want my game to carry on with the first twelve Plots, no supplies, no Bollworms, no hidden savings and a clean record, so that the update doesn't wipe my progress.

### Owner and developer

96. As a developer, I want every price, rise, chance, length, rate and size (land, keeping back, audits, supplies, Disasters, Bollworms) in the tuning table, so that balancing never means hunting through code.
97. As a developer, I want the tuning table to reject values that would let a Disaster make a Quota impossible (a Disaster longer than a quarter of a Shift, a Sandstorm slowing growth below half), so that the fairness promise can't be broken by accident.
98. As a developer, I want the tuning table to reject a Plot that adds as much to the Quota as it yields, and a caught Study Session no longer than the Negligence one, so that land always leaves a margin and being caught is always the heaviest punishment.
99. As a developer, I want audits, Disasters and Bollworms to draw on the Farm's one source of chance, so that tests decide them.
100. As a developer, I want the rules to count how many times the Worker has been caught, so that the story and endings spec can build the Caught ending on it without changing these rules.
101. As a developer, I want the rules to emit Disaster warnings, starts and ends, Bollworms arriving and a crop eaten as App messages or field events, as data, so that I can test them without rendering anything.
102. As a developer, I want debug buttons to start a Sandstorm, a Heatwave or Bollworms now, and to plan an audit for this Shift, so that I can see each without waiting.
103. As a developer, I want structured logs for each Hand-in (handed in, kept), audits planned and their result, being caught, hidden savings spent and taken, land and supplies bought, supplies used, Disasters starting and ending, and Bollworms arriving, picked off and eating a crop, so that I can debug a player's report.
104. As the owner, I want any factual claim about Bollworms, Sandstorms or Pesticide in The App or on the Sources page to cite a source, so that ground rule 1 holds.
105. As the owner, I want cotton kept back and sold on the side, and Harmony Audits and their penalties, treated as the game's invention unless a source documents them, so that the game never presents them as fact.

## Implementation Decisions

### Modules

- **Farm rules (the seam, modified).** Still the one object the game and the tests drive.
  - **Commands:** hand in (how much of the cotton in hand), buy a Plot, buy a supply (Fertiliser or Pesticide), fertilise a Plot, spray a Plot, and pick off Bollworms. Tapping a Plot with Bollworms goes to "pick off Bollworms" before planting or picking. Every store purchase (these, and the economy spec's Upgrades and Privileges) now says what pays for it: Labour Points or hidden savings. Each returns whether it happened and, if not, why: not enough Labour Points, not enough hidden savings, Hand-in open, in Debt, in a Study Session, Worker busy, fully bought, stock full, none held, wrong Stage, already fertilised, already protected, or Bollworms on the Plot.
  - **Views (read-only):** the Shift view's crop counter (crops picked this Shift); the Hand-in (open or not, cotton in hand, the Quota); hidden savings; on watch (Shifts left); times caught; the audit tell (the Overseer watching the scale this Shift). The land: the Farm's columns and rows, and the cell each Plot sits in. The store gains a land item (next Plot's price and Quota rise, or fully bought) and the supplies (price today, price next Shift, held, most held). Each Plot's view gains fertilised, protected and Bollworms (with seconds left before they eat the crop). The Shift view gains the Disaster: none, warned (kind, seconds until it strikes) or striking (kind, seconds left). The Worker view gains the current lap length.
  - **App messages (data, as now):** new keys for the Hand-in, audit announced, audit found nothing, caught (savings taken, Study Session, on watch), caught again, on watch ended, Plot bought, supply bought, Disaster warning, Disaster struck ("Nature cannot stop us!"), Disaster passed, Bollworms on a Plot, and crop eaten (as Negligence). Refusal reasons are rendered by The App, like the existing ones.
- **Land (new, inside the rules, not a seam).** It knows the Farm's columns and rows and the cell of every Plot. Plots keep their number for good: a new Plot gets the next number, so the first twelve keep the numbers they have today. The field grows by whole columns and rows, in a fixed order: a column on the right, then a row at the back, and so on, until the largest Farm. Within a strip, Plots are bought from the front or the left. Buying a strip's first Plot widens the Farm to take in the whole strip; the rest of its cells are unworked ground until bought. The start and the largest Farm (4 × 3 and, to start, 6 × 5) are in the tuning table. Farm owns Land and delegates to it; it is tested only through Farm. Farm's starting land now comes from the tuning table, not from the field adapter.
- **Lap length.** A lap of the first Farm takes `lap_seconds`. Each new column or row adds a set number of seconds (tuning), chosen so the shipped pace stays the same over the longer track (each new column or row adds two plot spacings to the track). A new length starts with the Worker's next lap. Exhaustion from running is charged per second, at the first Farm's rate (`exhaustion_per_lap` over `lap_seconds`), so a longer lap adds more. Laps before a breath don't change. Growth per second of running doesn't change either, so a bigger Farm gains nothing per lap; it only has more Plots to fill.
- **Quota.** The Quota for a Shift adds the Quota rise of every Plot bought before that Shift began, alongside the Upgrades' (economy spec).
- **Hand-in and Shift end.** When a Shift's time runs out, the Hand-in opens and the Farm stands still: online time moves nothing (crops, Toil, Study Session, Exhaustion, Disasters, Bollworms) until the Worker hands in, and every other command is refused. Offline time works as usual, so the night shift goes on behind an open Hand-in. Handing in then runs the rest of the Shift end in order: Labour Points for the cotton handed in, Quota check on what was handed in (and Study Session if missed), the audit if one was planned, Bills, the Exhaustion floor rise, then the next Shift starts, with its audit and Disaster rolled. Labour Points are no longer paid at each pick. Instead the crop counter, the number of crops picked this Shift and so the cotton in hand, goes up by one with every pick that doesn't drop its cotton. The Quota bar fills with it during the Shift, the Hand-in starts from it, and it goes back to zero when the next Shift starts. A Hand-in left open is saved.
- **Hidden savings (in the Ledger).** A second balance beside Labour Points, never below zero. Kept cotton adds a set amount per pick (tuning), more than the Labour Points it would have earned. Bills draw on Labour Points first, then hidden savings, and only what both can't cover becomes Debt. Store purchases draw on whichever the Worker chose. Debt still blocks every store purchase, whatever pays. Negligence never touches hidden savings.
- **Audits (new, inside the rules, not a seam).** It remembers, for each of the last few Shifts (tuning, 3 to start), how much was kept back, what the Worker's Plots should have yielded (Plots × a set yield per Plot per Shift), and how much hidden savings he spent in the store.
  - **Kept share:** cotton kept back over those Shifts divided by what they should have yielded. More Plots make the same cut a smaller share.
  - **Audit chance,** rolled at the start of each Shift after the first: a base chance, plus the kept share times a set factor, plus hidden savings spent in the store times a small set factor (the "a little" the owner asked for), at most 1. On watch multiplies it by a set factor.
  - **Tell:** if an audit is planned, the Overseer watches the scale for the last part of the Shift (tuning seconds).
  - **Result,** at the Hand-in: the kept share is worked out again with this Shift included. Above the tolerance (tuning) he is caught; while on watch the tolerance is zero, so any cut is found. Otherwise the audit finds nothing.
  - **Caught:** all hidden savings are taken, the caught Study Session starts (longer than the Negligence one; if the Quota was also missed, only this one runs), he is on watch for a set number of Shifts, and the times-caught count goes up. A second catch emits its own App message key and nothing more here; the story and endings spec turns it into the Caught ending.
  - A planned audit is saved, so reloading never dodges one.
- **Quota and land.** Validation keeps each Plot's yield per Shift above its Quota rise, so land always leaves a margin.
- **Supplies (inside the Store, from the economy spec).** A stock of each, capped by a "most held" value (tuning). Fertiliser's price is its first price plus a rise for every Shift after the first, so it's derived from the Shift number and not saved. Pesticide has a fixed price. Debt blocks buying supplies and land, as it blocks Upgrades.
- **Fertiliser.** It can only be spread on a Plot at its Seedling Stage that isn't fertilised. For the rest of that crop's growth, each second counts as more growth by a set factor (tuning), combined with the Generator Upgrade's factor. Offline growth (the night shift) gets the same factor. It ends when the crop leaves the Plot.
- **Pesticide.** It can be sprayed on any Plot without Bollworms that isn't protected already, empty or growing. The Plot is protected until the crop in it, or the next one planted, leaves the Plot (picked, eaten or Withered).
- **Disasters (new, inside the rules, not a seam).** At the start of every Shift after the first, the rules roll for a Sandstorm, then (if none) a Heatwave, each with its own chance per Shift, and if one comes, roll when in the Shift it strikes. A warning comes a set number of seconds before. It lasts a set length, counted in online Shift time, and always ends within the Shift. A Sandstorm multiplies growth per second of running by a factor below 1. A Heatwave multiplies Exhaustion from running by a factor above 1. A Disaster planned or in progress is not saved: a restored Shift has none.
- **Bollworms (new, inside the rules, not a seam).** Every set number of seconds of online play outside Study Sessions, each growing Plot that is unprotected and has no Bollworms gets them by chance (tuning). From then a timer runs in online time, paused in Study Sessions. When it runs out the crop is eaten: the Plot is emptied and Negligence is logged, docking Labour Points (never below zero) and starting the Negligence Study Session, exactly as for a Withered Plot. Picking them off takes a set time, during which the Worker is busy as in a slow action, and adds a set Exhaustion. A crop that ripens with Bollworms on it can't be picked until they are picked off.
- **Tuning table (config, extended).** New values: yield per Plot per Shift, hidden savings per kept pick, audit memory in Shifts, audit base chance, chance per kept share, chance per hidden savings spent in the store, tolerance, tell seconds, on-watch Shifts and factor, caught Study Session seconds, largest columns and rows (start columns and rows too), first Plot price, Plot price rise, Quota rise per Plot, extra lap seconds per new column or row, Fertiliser first price, rise per Shift and growth factor, Pesticide price, most supplies held, Sandstorm and Heatwave chance per Shift, warning seconds, Disaster seconds, Sandstorm growth factor, Heatwave Exhaustion factor, Bollworm check seconds and chance, Bollworm eat seconds, pick-off seconds and Exhaustion. Validation adds: each Plot yields more per Shift than it adds to the Quota; hidden savings per kept pick are more than Labour Points per pick; chances are between 0 and 1; the caught Study Session is longer than the Negligence one; the largest Farm is at least the first; prices, rises and Quota rises are whole numbers of at least 1; a Disaster lasts at most a quarter of a Shift, and warning plus length fit in a Shift; the Sandstorm factor is between 0.5 and 1; the Heatwave factor is between 1 and 2; Bollworms take longer to eat a crop than to pick off. The test tuning table gets small round values, with audit, Disaster and Bollworm chances at 0 so tests that don't need them are untouched. Existing tests that count Labour Points after a pick change to hand in first, because Labour Points are now paid at the Hand-in.
- **App text (content, extended).** Text for every new message key, the Hand-in card, the land and supply store blurbs, the audit and on-watch lines, and the Disaster lines, in the state's voice. The App never mentions hidden savings, except when they are taken ("unregistered income recovered" in tone). Bollworms and Sandstorms are real in Xinjiang's cotton belt, but the game makes no claim about them, so no source is needed. Any App or Sources page line that states a fact about them (or about who sprays Pesticide) must cite one, under ground rule 1. Cotton kept back and sold on the side is the game's invention. Ticket work checks whether audits of pickers, or penalties for keeping cotton back, are documented; if not, they are marked as the game's invention like the Generator, never presented as fact, and the Sources page doesn't cite them.
- **Adapters.**
  - **Field:** builds Plots, unworked ground, fence and track from the land view, and rebuilds them when land is bought. The track's place is no longer a centred rectangle but follows the Farm's bounds, so the gate and Generator stay put. The track's power tiles (ticket 24) follow the longer track. Plots show fertilised, protected and Bollworm looks. The supplies bar sits in the App overlay.
  - **Field camera:** pan limits follow the track's new bounds, and the farthest zoom grows in step with the track's size.
  - **Disaster looks:** orange sky, haze and blowing dust for a Sandstorm; harsher light and heat shimmer for a Heatwave. With reduced motion the dust and shimmer are replaced by a still tint.
  - **App overlay:** the Hand-in card with its slider and Quota line, the crop counter beside Labour Points with a "+1" rising from the Plot on each pick, the audit and caught cards, the on-watch notice, a "pay with" choice on store items when he has hidden savings, the store's land item and supplies, the supplies bar, the Disaster warning and countdown.
  - **Hidden savings tin:** a small hand-drawn tin outside The App's look, like the Children's letters, showing the hidden savings. It is the only place they appear.
  - **Field:** a weighing scale by the gate, where the Overseer stands to watch during an audit's tell.
- **Save.** The save format version goes up. The new state is the number of Plots bought (the cells follow from the fixed order), cotton in hand, whether the Hand-in is open, hidden savings, the remembered Shifts (kept, should-have-yielded, savings spent in the store), a planned audit, on-watch Shifts left, times caught, supplies held, and per Plot: fertilised, protected, and Bollworm time left. A save from the previous version is migrated: twelve Plots in the first Farm's cells, the Shift's picks so far as cotton in hand, no hidden savings, a clean record, not on watch, no supplies, nothing fertilised or protected, no Bollworms. It is not treated as damaged.
- **Debug mode:** adds "Audit this Shift", "Sandstorm now", "Heatwave now" and "Bollworms now" (on every growing, unprotected Plot) next to Skip time, through rules commands that only exist in debug builds of the wiring.
- **Logs:** each Hand-in (handed in, kept), audit planned (chance) and its result (kept share, tolerance), caught (savings taken, times caught), hidden savings spent (item, amount), Plot bought (number, price), supply bought and used (kind, Plot), Disaster planned, struck and passed (kind, length), Bollworms arriving, picked off and eating a crop (Plot).

### Content rules for this spec

- The App never lowers the Quota for a Disaster and never admits the Disaster was anyone's fault but the Worker's.
- The App names keeping back only when it catches him, and only as theft. Being caught is shown as the state's paperwork and a Study Session, never as violence.
- The store is honest about the Quota rise from land and the rising Fertiliser price. The satire is that the player sees the trade and takes it anyway. It is silent about the audit risk of paying with hidden savings: that is something the Worker learns, not something the state admits.
- No health cost from Pesticide, and no claim about who sprays it. Either would need a source.

## Testing Decisions

- A good test drives the Farm rules only through their public interface (commands, advance, resume, save and restore) and checks what a player would see: the Hand-in, Labour Points and hidden savings, audits planned and their result, on watch, times caught, the land view, store prices and availability, supplies held, a Plot's fertilised, protected and Bollworm state, the Shift's Disaster, lap length, Exhaustion, the Quota in the next Shift, and the App message keys. Tests never reach into Land, Audits, Disasters or Bollworms directly. They drive time only with advance and resume, and decide chance through the test tuning table (chances of 0 or 1) and the Farm's roll.
- **Farm rules (the main body of tests).** They cover:
  - the Hand-in opening at the Shift's end, the Farm standing still until it's answered, offline time still working, and an open Hand-in surviving a save;
  - the crop counter going up by one per pick, not for a dropped pick, and back to zero at the next Shift; no Labour Points until the Hand-in;
  - only cotton handed in counting towards the Quota and earning Labour Points, and kept cotton becoming hidden savings;
  - Bills drawing on Labour Points, then hidden savings, then Debt; Debt blocking store purchases paid either way; Negligence never touching hidden savings;
  - buying from hidden savings, and the refusals;
  - the audit chance rising with the kept share, falling as kept Shifts drop out of memory, rising a little with hidden savings spent in the store, not rising with Bills paid from them, and multiplied while on watch;
  - more Plots making the same cut a smaller share;
  - the tell before a planned audit; an audit finding nothing below the tolerance and catching above it; any cut caught while on watch;
  - being caught (savings taken, the caught Study Session instead of a missed-Quota one, on watch, times caught) and the second-catch message;
  - a planned audit surviving a save and restore;
  - buying Plots in the fixed order, prices rising, the strip widening the Farm, fully bought, and the refusals;
  - each Plot's Quota rise starting with the next Shift, and always smaller than its yield;
  - a longer lap starting with the next lap, Exhaustion per second of running unchanged, and laps before a breath unchanged;
  - buying supplies, the stock cap, Fertiliser's price by Shift, and the refusals;
  - Fertiliser only on a Seedling, its growth factor online and offline, and its end when the crop leaves;
  - Pesticide protecting one crop and blocking Bollworms;
  - no Disaster in the first Shift, at most one a Shift, warning then strike then pass, the Sandstorm's growth factor, the Heatwave's Exhaustion factor, the Quota unchanged, and no Disaster after a restore;
  - Bollworms arriving on growing, unprotected Plots, picking them off (time, Exhaustion), eating a crop as Negligence, none offline, none in a Study Session, and ripe crops blocked until they're picked off;
  - save round trips, and migration of a previous-version save.
- **Tuning table:** validation tests for every new value and cross-check (a Plot that adds as much to the Quota as it yields, a caught Study Session no longer than the Negligence one, a Disaster too long, a Sandstorm factor below 0.5, a largest Farm smaller than the first).
- **Field geometry:** the plot grid placing cells for a Farm of any size, with the first twelve cells where they are today; the track path following the Farm's bounds, its length growing by two spacings per new column or row, and the gate staying put; the field camera's pan limits and farthest zoom following the track.
- **Content:** every new App message key has text that fills all its slots, and every cited source id exists.
- **Adapters:** light tests only where they hold logic. The Hand-in slider's mapping to an amount and the store's "pay with" choice get light tests. Disaster looks, reduced motion, the savings tin, the scale and the supplies bar are checked by playing the web build.
- **Prior art:** the existing rules tests (one file per rules feature, all through Farm, with the fast tuning table and a custom roll, as in the dropped-cotton tests), the plot grid, track path and field camera tests, the content and tuning validation tests, and the save migration tests from the economy tickets.

## Out of Scope

- Co-workers, Farm Levels, Reports and Quiet Acts (the next spec), including Co-workers noticing or covering for cotton kept back.
- The Caught ending itself (story and endings spec). This spec only counts catches and emits the second-catch message.
- Sending hidden savings to the Family directly, or spending them anywhere but the store and Bills.
- Hidden savings paying off existing Debt.
- Other crops, buildings, animals and decorations.
- Selling land, or losing it.
- Disasters or Bollworms while the game is closed.
- Other Disasters (floods, frost) and other pests.
- Any health cost of Pesticide.
- Sound for Disasters, Bollworms and supplies. A wind sound for the Sandstorm is a likely later ticket.

## Further Notes

### Decisions this spec made beyond the owner's draft (owner to confirm)

- Spending hidden savings in the state's store raises the audit chance a little (the owner's answer to the draft's question). Paying Bills from them doesn't.
- Labour Points are paid at the Hand-in for the cotton handed in, not at each pick (confirmed by the owner). This changes the first playable's rule and its tests, and means a Privilege bought mid-Shift is paid from earlier Shifts' wages. A crop counter takes their place as the feedback for each pick (the owner's addition).
- The Farm stands still while the Hand-in is open; offline time doesn't.
- Hidden savings pay a Bill Labour Points can't cover, automatically, before it becomes Debt. They never pay off Debt that already exists.
- An audit looks back three Shifts. A run of honest Shifts lowers the risk as kept Shifts drop out; a met Quota doesn't lower it by itself.
- A small cut below the tolerance is safe from an ordinary audit. On watch, the tolerance is zero.
- Audits are planned at the start of a Shift so the tell can come first, and a planned audit is saved.
- A missed Quota and being caught in the same Shift start only the caught Study Session.
- The App never mentions hidden savings, except when it takes them, and the store never mentions the audit risk.
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

Tickets 17 (the store) and 19 (Bills and the pay slip) first. Land and its Quota rise come next, since the bigger track touches the most code. Then the Hand-in and hidden savings, then Harmony Audits, then supplies with Fertiliser and Pesticide, then Bollworms, then Disasters. Ticket 24 (power tiles) can land before or after: the tiles follow whatever track the field builds.
