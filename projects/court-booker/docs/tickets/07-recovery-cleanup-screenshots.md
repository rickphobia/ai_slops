# 07: Recovery, cleanup, screenshots

**What to build:** court-booker copes with downtime and keeps its data short-lived. A request that came due while the server was down runs on startup and says "ran late". One whose date has passed is marked missed. One interrupted mid-run is never re-run, and its unfinished Slots say "interrupted, check Picktime". Data and screenshots older than 30 days after their date are deleted. The Operator can open any tried Slot's screenshot. Spec user stories 36, 39–42, 46.

**Blocked by:** 06 (Book at Release Time)

**Status:** ready

**Touches:** scheduler, booking_run, web

**Effort:** low

- [ ] A request picked up more than 5 minutes after its run time is marked "ran late" with the actual run time shown on the list
- [ ] A Waiting request whose date has passed becomes Done with every Slot Failed "missed"
- [ ] At startup, a request found in Booking… is not re-run: Slots without an outcome become Failed "interrupted, check Picktime"
- [ ] Each tick deletes Booking Requests, Slot results and screenshot files older than the retention days after their date
- [ ] A Slot with a screenshot links to it from the list; screenshots are served only to a logged-in Operator, and only files the database points to
- [ ] Tests through the test client with a fake clock cover late, missed, interrupted, cleanup (files gone from disk) and the screenshot access rules
- [ ] README describes what the statuses mean
