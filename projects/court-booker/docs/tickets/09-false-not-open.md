# 09: Don't mistake a loading date for a closed one

**What to build:** a date that is open on Picktime is never recorded as "date not open on Picktime yet" because its Slots were still loading. A closed date found just after Release Time is tried again for a short while instead of failing the whole night. Spec user story 37 is refined accordingly.

**Why:** request 1 (12 Oct, 20:00) ran at 00:01:29 on 10 Oct and every Slot became Failed "date not open on Picktime yet". Its screenshot shows 12 Oct open in the date strip, but 10 Oct (the page's default date) still selected, a loading spinner, and the default date's "No time slots are available" message behind it. In `pick slot`, `picktime_site.py` waits for `this date's Slots, or .no-slots`. `.no-slots` isn't tied to a date, so the default date's message satisfied the wait before the clicked date loaded. The adapter then found none of this date's Slots and returned `NotOpen`. The fake `booking_page.html` empties the Slot box on every click, so the tests never saw a stale message. Because `NotOpen` is never retried and fails every later Slot, one stale read costs the whole night. It's most likely at midnight, when the page is slowest. The run now starts 1 second after Release Time, which leaves no margin for a date that opens a few seconds late.

**Blocked by:** none

**Status:** todo

**Touches:** adapters/picktime_browser, booking_run, config, README, spec

**Effort:** medium

- [ ] The fake page behaves like the live one where it matters: on load it selects the first open date and shows that date's Slots or its "no time slots" message, and after a date click the old content stays (under a loader) until the new date's Slots arrive
- [ ] A test against the fake page, written first and seen failing, reproduces the bug: the default date has no Slots, the requested date has the Slot, the answer is slow, and the outcome must not be `NotOpen`
- [ ] After clicking the date, the adapter waits until that date is the selected one and its own Slots or empty message have loaded before reading them; the existing NotOpen and Taken tests still pass
- [ ] A Slot attempt that ends `NotOpen` within `COURT_BOOKER_NOT_OPEN_GRACE_SECONDS` (default 60) of the date's Release Time is tried again after a short wait; past the grace period it fails as today ("date not open on Picktime yet", later Slots too). Unit tests with a fake clock and fake site cover both sides of the boundary
- [ ] Each retry of a closed date is logged with the request id, date, Slot and seconds since Release Time
- [ ] Config table, `.env.example`, README "How it works" and spec story 37 describe the grace period
- [ ] Before merge: a `dry-run` against the live page for an open date still returns `ReadyToBook`
