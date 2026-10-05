# 06: Book at Release Time

**What to build:** A background scheduler picks up each due Booking Request once and books every ticked Slot through Picktime, in time order with a random pause between them. Taken Slots are never retried and network errors are retried at most twice with backoff. In the morning the Operator sees each Slot as Booked, Taken or Failed (with a plain-English reason) on the list. Spec user stories 17, 28–34, 43–45, 47–48.

**Blocked by:** 04 (Booking Requests: create, edit, cancel), 05 (Picktime browser + dry-run)

**Status:** ready

**Touches:** booking_run, scheduler, entrypoint, web

**Effort:** medium

- [ ] Scheduler tick claims due Booking Requests one at a time with an atomic Waiting → Booking… update, so a request is never run twice; one tick at startup, then one every configured interval in the background
- [ ] Booking run tries each Slot in time order with a random pause between them (from the injected random source), decrypting the Profile at run time
- [ ] Outcome rules: Booked; Taken, never retried; NetworkError retried up to the configured count with exponential backoff, then Failed; Rejected → Failed with Picktime's text, not retried; NotOpen → that Slot and the rest Failed "date not open on Picktime yet"; one Slot's failure never stops the others
- [ ] Each Slot's status and attempted-at time are saved as soon as they are known; the request ends Done
- [ ] List page shows each Slot's status (Waiting, Booking…, Booked, Taken, Failed + reason) and the Booking Request's status (Waiting, Booking…, Done, Cancelled); edit and cancel are blocked once it is Booking…
- [ ] `/healthz` also reports the database reachable and the age of the last tick, and fails when the tick is stale
- [ ] Every run and Slot attempt is logged with request id, date, Slot, outcome, retry number and duration, never Profile values
- [ ] Tests through the test client with a fake `CourtBookingSite`, fake clock and fixed random source cover: nothing runs before the run time; the run happens between 00:01 and 00:02 after Release Time; every Slot is tried in order; each outcome rule; double-claim is impossible; statuses shown on the list

**Owner steps:** after deploying, create a real Booking Request for one Slot only when you're happy to make a real booking, and check the result against Picktime's email.
