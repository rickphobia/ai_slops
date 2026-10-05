# 05: Picktime browser + dry-run

**What to build:** court-booker can book one Slot through the real Picktime booking page in headless Chrome, filling the form as a person would (decision 0002). The owner can run `dry-run --date --slot` to fill the live page with the stored Profile, save a screenshot and stop before clicking Book. Spec user stories 30, 35, 37–38, 49.

**Blocked by:** 03 (Profile, encrypted)

**Status:** ready

**Touches:** adapters/picktime-browser, entrypoint

**Effort:** `medium`

- [ ] A `CourtBookingSite` interface: book one Slot for a date and Profile, with a dry-run flag, returning a typed outcome (Booked, Taken, NotOpen, NetworkError, Rejected with Picktime's message), a screenshot path and the duration
- [ ] The Playwright adapter opens the page fresh, picks the Court, the date and the Slot, fills first name, email, Unit Number and Mobile, submits (unless dry-run), reads the result and saves a screenshot of the final state; normal desktop Chrome user agent and viewport, page timeout from config
- [ ] Each step is logged (open page, pick date, pick Slot, fill form, submit, read result), with no Profile values; a failure names the step
- [ ] Tests run the adapter against a small static copy of the booking form served locally (built from the real page's fields and messages, not Picktime's scripts): right values in the right fields, confirmation → Booked, "no longer available" → Taken, no Slots for the date → NotOpen, dry-run never submits, screenshot written; these run in CI
- [ ] `dry-run` subcommand reads the stored Profile and prints the outcome and screenshot path
- [ ] README documents dry-run and warns it touches the live page

**Owner steps:** run `dry-run` against the live Picktime page for an open date and check the screenshot shows the form filled with the right Slot.
