# 09: Don't mistake a loading date for a closed one

**What to build:** a date that is open on Picktime is never recorded as "date not open on Picktime yet" because its Slots were still loading. A closed date found just after Release Time is tried again for a short while instead of failing the whole night. Spec user story 37 is refined accordingly.

**Why:** request 1 (12 Oct, 20:00) ran at 00:01:29 on 10 Oct and every Slot became Failed "date not open on Picktime yet". Its screenshot shows 12 Oct open in the date strip, but 10 Oct (the page's default date) still selected, a loading spinner, and the default date's "No time slots are available" message behind it. The adapter had read the default date's empty message before the clicked date loaded.

That adapter bug was already fixed in 8856f5e (9 Oct) and deployed at 00:19 on 10 Oct, before this ticket was written from a stale checkout: the adapter now marks the default date's empty message as stale and waits for the chosen date's own Slots or message, and `test_waits_for_the_chosen_dates_slots_not_the_first_dates_empty_message` reproduces the failure against a test page that keeps old content on screen while loading. Request 2 (13 Oct) ran with the fix and booked.

What was left: `NotOpen` is never retried and fails every later Slot, so any closed read costs the night. The run now starts 5 seconds after Release Time, which leaves little margin for a date Picktime opens a few seconds late.

**Blocked by:** none

**Status:** done

**Touches:** adapters/picktime_browser, booking_run, config, README, spec

**Effort:** medium

- [x] The fake page behaves like the live one where it matters: on load it selects the first open date and shows that date's Slots or its "no time slots" message, and after a date click the old content stays until the new date's Slots arrive (8856f5e)
- [x] A test against the fake page reproduces the bug: the default date has no Slots, the requested date has the Slot, and the outcome must not be `NotOpen` (8856f5e)
- [x] After clicking the date, the adapter waits for that date's own Slots or a fresh empty message before reading them; the existing NotOpen and Taken tests still pass (8856f5e)
- [x] A Slot attempt that ends `NotOpen` within `COURT_BOOKER_NOT_OPEN_GRACE_SECONDS` (default 60) of the date's Release Time is tried again after `COURT_BOOKER_RETRY_BACKOFF_SECONDS`; no try starts past the grace period, and after it the date fails as before ("date not open on Picktime yet", later Slots too). Tests with a fake clock and fake site cover both sides of the boundary
- [x] Each retry of a closed date is logged with the request id, date, Slot and seconds since Release Time
- [x] Config table, `.env.example`, README "How it works" and spec story 37 describe the grace period

**Owner steps:** after deploy, a `dry-run` against the live page for an open date should still return `ReadyToBook` (the adapter is unchanged by this PR, so this is a sanity check, not a gate).
