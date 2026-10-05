# 04: Booking Requests: create, edit, cancel

**What to build:** The Operator picks a date, ticks the Slots they want (08:00–20:00), and sees the Booking Request in a date-ordered list with the moment it will run: a random moment between 00:01 and 00:02 Malaysia time after the date's Release Time, or about a minute from now for a date already in the Booking Window. They can edit or cancel it while it is Waiting. Nothing is booked yet. Spec user stories 11–12, 16–27.

**Blocked by:** 03 (Profile, encrypted)

**Status:** ready

**Touches:** booking_requests, schedule, adapters/sqlite, web

**Effort:** `medium`

- [ ] `schedule` has pure functions for Release Time (midnight venue time, Booking Window days before the date) and the run time (Release Time plus a jitter from an injected random source within the configured window, or now plus a short delay when the date is already open); unit tests cover month and year ends, already-open dates and dates far ahead
- [ ] The run time is chosen once at creation and stored; editing Slots keeps it
- [ ] Rules enforced with typed errors and clear messages: a Profile must exist, the date can't be in the past, at least one Slot, only configured Slots, one Booking Request per date
- [ ] New and edit pages: date picker plus one checkbox per Slot; mobile-friendly
- [ ] List page (home): upcoming first, each showing date, Slots, status (Waiting / Cancelled) and run time in venue time
- [ ] Cancel works only while Waiting
- [ ] Tests through the test client with a fake clock and fixed random source cover every rule and the shown run time
- [ ] README and `.env.example` updated for the new settings (Slots, Booking Window, jitter, timezone)
