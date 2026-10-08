# Happy Cotton: the store, Bills and the Children

**Status:** spec. Design questions settled with the owner on 2026-10-08. Built after the first playable (after ticket 12). It needs ticket 08 (Exhaustion and the rest hour), ticket 09 (save) and ticket 14 (Generator laps).

## Problem Statement

In the first playable the Worker earns Labour Points and can spend them on just one thing, a rest hour. That makes Labour Points feel like a score, when they should feel like a wage that never covers what it has to. Hay Day players know the store loop well: earn, buy something that makes you faster, earn more. The game doesn't use that loop against itself yet. Nothing the Worker earns flows back to the state, and the Family he is working for never appears.

The owner wants the player to learn the economics of the Farm by playing it. Getting more productive only ever helps the state. The state takes back most of what it pays. And the cost of falling short lands on the Worker's Children, far away. None of this should break the content rules: the Children are never shown being punished, and every factual claim traces to a source.

## Solution

The App gets a **store**. The Worker spends Labour Points there on **Upgrades** (a better Generator, better tools) and on **Privileges** (the rest hour, and now a short call home). The store says cheerfully that every Upgrade raises the Quota, and it does, by about what the Upgrade adds. Working smarter never gets the Worker ahead.

At the end of every Shift the state charges its **Bills**, and The App shows them as a bright pay slip. Electricity is priced per lap the Worker ran on the Generator: he pays for the power his own body made. Dormitory rent is a flat charge. Every third Shift come his Children's **school fees**. When his Labour Points can't cover a Bill, the shortfall becomes **Debt**. Debt is shown in red and is never forgiven. Everything he earns pays it down first, and while it lasts he can't buy Privileges.

The Worker has two **Children** at a state boarding school far away. They are present only through **letters**, which arrive every few Shifts, and a short **call home** he can buy as a Privilege. Their letters slowly change tone. If a school-fees Bill goes unpaid, the letters stop and only start again once the Debt is cleared. Letters that would have come in the meantime are lost.

## User Stories

### The store

1. As a player, I want a store in The App, so that I have something to spend Labour Points on besides rest.
2. As a player, I want the store to look like a cheerful mobile-game shop, so that the familiar loop feels uncomfortable once I see what it does.
3. As a player, I want the store split into Upgrades and Privileges, so that I can tell "be more productive" from "a small comfort".
4. As a player, I want to see each item's price before I buy it, so that I can decide.
5. As a player, I want to see what each Upgrade does in plain numbers, so that I know what I'm buying.
6. As a player, I want the store to tell me, in The App's cheerful voice, how much each Upgrade raises the Quota, so that the trade is out in the open and I choose it anyway.
7. As a player, I want items I can't afford shown but not buyable, with the reason, so that I know what I'm working towards.
8. As a player, I want to be told plainly why a purchase was refused (not enough Labour Points, in Debt, Privileges taken away, in a Study Session, fully upgraded), so that I'm never confused.
9. As a player, I want the store to open from The App without leaving the field, so that shopping feels like part of the loop.
10. As a player on a phone, I want the store readable and tappable on a small landscape screen, so that I can use it anywhere.
11. As a player, I want The App to celebrate a purchase, so that spending feels rewarding the way farm games make it feel.

### Upgrades

12. As a player, I want to buy a better Generator, so that each lap grows more cotton.
13. As a player, I want to buy better tools, so that the Worker picks faster and drops less cotton when he's exhausted.
14. As a player, I want each Upgrade to come in a few tiers, each dearer than the last, so that there's always a next step to want.
15. As a player, I want a bought Upgrade to work straight away, so that I feel the gain at once.
16. As a player, I want the Quota rise from an Upgrade to start with the next Shift, so that the Quota bar doesn't jump mid-Shift.
17. As a player, I want the Quota rise to roughly match what the Upgrade adds, so that I learn that being more productive only raises what's demanded.
18. As a player, I want Upgrades to stay bought after a missed Quota or a Study Session, so that the state keeps what it gained from me.
19. As a player, I want to see the Generator and the tools change in the field when I upgrade them, so that the purchase is visible in the world.
20. As a player, I want a fully upgraded item marked as such, so that I know there's nothing more to buy there.

### Privileges

21. As a player, I want the rest hour to move into the store as a Privilege, so that every way to spend Labour Points is in one place.
22. As a player, I want to buy a short call home, so that the Worker can hear his Children.
23. As a player, I want a missed Quota to take away every Privilege for the next Shift, not only the rest hour, so that failure costs the Worker's comfort.
24. As a player, I want Debt to block every Privilege until it's paid, so that I feel what owing the state means.
25. As a player, I want the Worker to leave the Generator during a call home, so that the call has a cost: the crops halt while he talks.
26. As a player, I want The App to remind me that calls are for "family harmony", so that I feel the state listening in.

### Bills

27. As a player, I want the state to charge Bills at the end of every Shift, so that most of what I earn goes straight back.
28. As a player, I want electricity charged per lap the Worker ran, so that he visibly pays for the power his own body made.
29. As a player, I want a flat dormitory rent charged every Shift, so that there's a cost even when I barely worked.
30. As a player, I want the Children's school fees charged every third Shift, so that a large Bill hangs over me and I learn to save for it.
31. As a player, I want to see when the next school fees are due, so that I can plan for them.
32. As a player, I want a cheerful pay slip at the end of each Shift (earned, electricity, rent, school fees, what's left), so that I see exactly where my Labour Points went.
33. As a player, I want the pay slip to word each Bill in the state's voice, so that the deductions sound like gifts.
34. As a player, I want Bills charged whether I met the Quota or not, so that failure doesn't spare me the costs.
35. As a player, I want Bills charged in a fixed order (electricity, then rent, then school fees), so that it's clear which one went unpaid.
36. As a player, I want Bills charged only when a Shift ends, so that closing the game never costs me more than playing it.

### Debt

37. As a player, I want a Bill I can't cover to become Debt instead of failing, so that the state always collects in the end.
38. As a player, I want Debt shown in red where my Labour Points usually are, so that I can't miss it.
39. As a player, I want everything I earn to pay down Debt before I can spend it, so that Debt is never forgiven.
40. As a player, I want The App to tell me when I fall into Debt and when I've cleared it, so that I know where I stand.
41. As a player, I want Negligence to dock Labour Points only down to zero, never into Debt, so that the rule from the first playable still holds.
42. As a player, I want to be unable to buy Upgrades while in Debt, so that I can't spend my way out of it.

### The Children

43. As a player, I want to learn early on that the Worker has two Children at a state boarding school, so that I know who he's working for.
44. As a player, I want letters from the Children every few Shifts, so that they feel present even though they're far away.
45. As a player, I want each letter shown as a handwritten page, never in The App's style, so that the Children's voice stays separate from the state's.
46. As a player, I want to re-read the letters I've received, so that I can notice how they change.
47. As a player, I want the letters to slowly change tone (warm and homesick at first, then more distant and full of school slogans), so that I feel the Children being taken from him without anything being shown.
48. As a player, I want the letters to stop after school fees go unpaid, so that the cost of falling short lands where it hurts most.
49. As a player, I want the letters to start again once the Debt is cleared, so that recovery is possible.
50. As a player, I want letters that would have come while they were stopped to be lost, so that the next letter feels like a gap in their lives.
51. As a player, I want the call home to match how the Children sound in their latest letter, so that calls and letters tell one story.
52. As a player, I want the Children never shown or described being punished, so that the game condemns the system without displaying harm to children.
53. As a player, I want the boarding schools traced to a source and the school fees not presented as fact, so that I know what is documented and what is the game's invention.

### Saving

54. As a returning player, I want my Upgrades, Debt, next school-fees Shift, received letters and whether the letters have stopped all saved, so that nothing about the economy resets.
55. As a player with a save from before this update, I want my game to carry on with no Upgrades, no Debt and no letters yet, so that the update doesn't wipe my progress.

### Owner and developer

56. As a developer, I want every price, rate, tier and interval (Upgrade tiers, electricity per lap, rent, school fees and how often they come, letter interval, call price and length) in the tuning table, so that balancing never means hunting through code.
57. As a developer, I want the tuning table to reject a bad tier list (no tiers, a price that isn't positive, a Quota rise below 1), so that the claim that Upgrades always raise the Quota can't be broken by accident.
58. As a developer, I want the rules to emit the pay slip, purchases and Debt changes as App messages, and letters and calls as their own events, all as data, so that I can test the whole economy without rendering anything.
59. As a developer, I want letter and call text in their own content table with source ids where they make a claim, checked by a content test, so that ground rule 1 covers the Children's voice too.
60. As a developer, I want structured logs for purchases, Bills, Debt changes and letters stopping or starting again, so that I can debug a player's report.
61. As a developer, I want the debug Skip time and a debug-only way to add Labour Points, so that I can reach Debt, school fees and later letters without playing for hours.
62. As a developer, I want the rules to count how many school-fees Bills in a row went unpaid, so that the story and endings spec can build Taken on it without changing the economy.

## Implementation Decisions

### Modules

- **Farm rules (the seam, modified).** Still the one object the game and the tests drive. New commands and views:
  - **Commands:** buy an Upgrade (Generator or tools), and buy a Privilege, which now covers both the rest hour and the call home and replaces the rest-hour-only command. Each returns whether it happened and, if not, why: not enough Labour Points, in Debt, Privileges taken away this Shift, in a Study Session, or fully upgraded.
  - **Views (read-only):** the store (each item's kind, current tier, price, effect, Quota rise, and whether it can be bought right now and why not); Labour Points and Debt (never both above zero); the Shift when school fees are next due; the last pay slip; the letters received so far, in order; whether the letters have stopped; and how many school-fees Bills in a row went unpaid.
  - **App messages (data, as now):** new keys for the pay slip (values: earned this Shift, electricity, rent, school fees or none, balance or Debt), Upgrade bought, Privilege bought, fell into Debt, Debt cleared, and the call-home monitoring line. Refusal reasons are rendered by The App, like the existing ones.
  - **Family events (data, separate from App messages):** "letter arrived" with a letter id, and "call home" with a call id. They are separate because App messages are the state's voice and these are the Children's.
- **Ledger (new, inside the rules, not a seam).** Labour Points and Debt are one signed balance: a negative balance is Debt. Earnings therefore pay Debt down first, with no special case. It charges Bills in a fixed order (electricity, rent, school fees), keeps the "school fees unpaid" flag and the unpaid-in-a-row count, and builds the pay slip. Negligence docking is clamped at zero, so it never creates Debt. Farm owns the Ledger and delegates to it, which keeps Farm under the ~300-line limit. The Ledger is tested only through Farm.
- **Store (new, inside the rules, not a seam).** Knows each Upgrade's tiers and the Privileges, which tier the Worker owns, and the Upgrades' total Quota rise. A Generator tier multiplies growth per second of running. A tools tier shortens a pick and lowers the share of cotton dropped above the Exhaustion mistake threshold. The Quota for a Shift is the first Quota, plus the per-Shift rise, plus the Quota rise of every Upgrade bought before that Shift began.
- **Shift end, in order:** Quota check (and Study Session if missed), then Bills (electricity uses the laps run this Shift), then the Exhaustion floor rise, then the next Shift starts. If the new Shift is a letter Shift and the letters haven't stopped, a letter arrives at its start.
- **Letters.** A letter is due every N Shifts (tuning). The letter shown is chosen by how many letter Shifts have passed, not by how many letters were received, so letters missed while the letters were stopped are skipped for good. The letters stop when a school-fees Bill leaves a shortfall, and start again when Debt reaches zero. When the list runs out, the last letter's tone holds and no new letters come (more are written later).
- **Call home.** A Privilege with its own price and length (tuning). During the call the Worker is off the Generator, so crops halt, as with the rest hour. The call's lines follow the latest letter received. Missed Quotas and Debt block it like every Privilege.
- **Tuning table (config, extended).** New flat values: electricity per lap, rent per Shift, school fees amount, school fees every N Shifts (3 to start), letter every N Shifts, call home price and length. New tier lists for the Generator and the tools: each tier has a price, an effect and a Quota rise. Validation: each list has at least one tier, prices are positive, each Quota rise is a whole number of at least 1, and effects only ever improve from tier to tier. The test tuning table gets small round values for all of these.
- **App text (content, extended).** Text for every new message key, the store's item names and blurbs in the state's voice, and pay slip labels ("Electricity: thank you for powering the Farm!" in tone, not literally). Doublespeak and claims cite sources as now.
- **Family text (new content).** A table of letters and call scripts: id, which Child, text, and source ids where a line makes a factual claim. The Children's names and ages are decided when the letters are written (ticket work). This is not App text: the content test checks it the same way but keeps it separate.
- **Sources register.** zenz-2019 is already there for the boarding schools. Ticket work checks it for what the letters' change in tone draws on (for example, children taught in Mandarin). Any line the source doesn't support is written as the Children's own experience, not as a claim. The school fees are the game's own invention, like the Generator and the whip: the game never presents them as fact and the Sources page doesn't cite them.
- **Adapters:** the App overlay gets the store panel, the pay slip card, Debt in red, the next-school-fees indicator and the Privilege buttons, which move into the store. A new letters view shows a letter as a handwritten page and keeps a box of received letters to re-read. Its look is deliberately not The App's. The call home is a short card of lines, not The App's voice. The field shows Generator and tool tiers with simple model or material changes.
- **Save.** The save format version goes up. The new state is the balance, Upgrade tiers, next school-fees Shift, letter Shift count, letters received, the letters-stopped flag and the unpaid-in-a-row count. A save from the previous version is migrated: no Upgrades, no Debt, no letters, and school fees due on the third Shift after the restored one. It is not treated as damaged.
- **Debug mode:** adds "+100 Labour Points" next to Skip time, through a rules command that only exists in debug builds of the wiring, so players never see it.
- **Logs:** purchases (item, tier, price), each Bill and whether it was covered, Debt incurred and cleared, letters stopping and starting. Never the letter text.

### Content rules for this spec

- The Children are never shown, described or implied being punished, in letters, calls or anywhere else.
- The letters are the Children's voice and the call is the Worker's family. The App never speaks for them and never writes their letters. It may only comment around them, for example the monitoring line on a call.
- The store is honest about the Quota rise. The satire is that the player sees the trade and has to take it anyway, not that they were tricked.

## Testing Decisions

- A good test drives the Farm rules only through their public interface (commands, advance, resume, save and restore) and checks what a player would see: store prices and availability, Labour Points and Debt, the pay slip's values, the Quota in the next Shift, letters received and whether they've stopped, and the App message and Family event keys. Tests never reach into the Ledger or the Store directly, and they drive time only with advance and resume.
- **Farm rules (the main body of tests).** They use the test tuning table extended with small round prices, tier lists and intervals. They cover:
  - buying each Upgrade tier, the refusal reasons, and fully upgraded items;
  - the Generator Upgrade raising growth per second of running, and the tools Upgrade shortening picks and reducing drops;
  - each Upgrade's Quota rise starting with the next Shift, not the current one;
  - the rest hour and call home as Privileges, both blocked after a missed Quota and while in Debt, and the call halting growth;
  - electricity matching laps run, rent every Shift, and school fees every third Shift;
  - Bills charged whether the Quota was met or missed, and in the fixed order;
  - a shortfall becoming Debt, earnings paying Debt first, Debt-cleared and fell-into-Debt messages, and Negligence never creating Debt;
  - letters arriving every N Shifts, stopping after unpaid school fees, starting again when Debt clears, and letters missed in the meantime being skipped;
  - the unpaid-in-a-row count;
  - no Bills charged offline;
  - save round trips, and migration of a previous-version save.
- **Tuning table:** validation tests for the new values and tier lists (missing, out of range, empty list, a Quota rise of 0, an effect that gets worse at a higher tier).
- **Content:** every new App message key has text that fills all its slots. Every letter and call id the rules can emit has Family text. Every source id cited in App text or Family text exists in the register.
- **Adapters:** light tests only where they hold logic, for example the pay slip's formatting of a negative balance as Debt and the store panel's mapping of refusal reasons to text. Scenes are checked by playing the web build.
- **Prior art:** the existing rules tests (one test file per rules feature, all through Farm), the fast tuning table for tests, the content test for App text and the sources register, and the tuning validation tests.

## Out of Scope

- Co-workers and Farm Levels (the next spec), including more workers on the Generator, Reports and Quiet Acts.
- The endings, Taken included. This spec only counts unpaid school fees so the story and endings spec can use the count.
- Letters stopping after a missed Quota, and letters or calls from Family other than the Children.
- Gratitude and the rest of the monetisation parody, achievements, streaks and the leaderboard.
- The supply chain and brand orders.
- Selling, refunding or losing Upgrades.
- Any interest on Debt. It is already never forgiven, and compounding would push it into a different game.
- Sound for the store, letters and calls.

## Further Notes

### Decisions this spec made beyond the owner's draft (owner to confirm)

- One signed balance, so earnings pay Debt down first.
- The fixed Bill order, which makes school fees the Bill most likely to go unpaid.
- Negligence never creates Debt.
- An Upgrade's Quota rise starts with the next Shift.
- Letters missed while stopped are lost, not delivered late.
- The letters start again when Debt reaches zero, not when the school fees alone are paid.
- The call home takes the Worker off the Generator.
- A previous-version save is migrated, not reset.
- The store shows the Quota rise openly.

### Order of work

Economy (this spec), then Co-workers and Farm Levels, then story and endings. Taken needs the Bills here. Promotion and Revolt need Co-workers, Reports and Quiet Acts.
