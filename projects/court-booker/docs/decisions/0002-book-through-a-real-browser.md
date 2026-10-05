# Book through a real browser at a human pace

Picktime's terms forbid bots, and losing the Profile's access to the Court is worse than missing a Slot, so court-booker books the way a person would. Headless Chrome (Playwright) opens the public booking page, fills in the form and clicks Book. It does this at a random moment between 00:01 and 00:02 after Release Time, tries Slots one at a time with pauses, and retries only on network failures. We rejected calling the page's internal JSON endpoints directly, even though that is lighter and faster: the traffic looks nothing like a browser, and it depends on an undocumented API.

**Trade-offs:** the image is about 1 GB larger, a run takes seconds instead of milliseconds, and a Picktime page redesign breaks the form steps. Every run saves a screenshot so a breakage can be diagnosed without booking again.
