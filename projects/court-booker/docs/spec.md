# court-booker spec

Written on 2026-10-05 from the `/grill-with-docs` session. Words in **bold** are defined in `GLOSSARY.md`. Decisions 0001–0003 in `docs/decisions/` record the stack, the real-browser approach and the encryption choice.

## Problem Statement

Friend A books the badminton **Court** at 1120 Park Avenue (Petaling Jaya) for friend B, using friend B's details. The venue takes bookings on Picktime, and a date opens only when it enters the **Booking Window** (currently 2 days ahead) at midnight Malaysia time. The Court is busy, so the evening **Slots** have to be booked soon after midnight. That means someone has to stay up every night and type the same details into the same form. Missing a night means missing play.

## Solution

A small website at `rickphobia.com/ai-projects/court-booker/` with a single password login for friend A (the **Operator**). Friend A:

1. Saves friend B's **Profile** once (first name, email, unit number, mobile). It is stored encrypted.
2. Creates a **Booking Request** for any future date by ticking the Slots wanted (08:00, 10:00 … 20:00).
3. Goes to sleep.

At the date's **Release Time**, court-booker waits a random moment between 00:01 and 00:02. It then opens the real Picktime booking page in a headless browser and books each ticked Slot in turn, the way a person would. In the morning, friend A sees each Slot's result on the site (Booked, Taken or Failed). Picktime also sends its usual confirmation email for every **Booking**.

## User Stories

### Access

1. As the Operator, I want to log in with one password, so that only I can see the Profile and make bookings in its name.
2. As the Operator, I want to stay logged in on my phone for a while, so that I don't type the password every visit.
3. As the Operator, I want to log out, so that a shared device doesn't stay signed in.
4. As the owner, I want login attempts blocked for a while after several wrong passwords, so that nobody can guess the password.
5. As the owner, I want to set the Operator password on the server without it ever appearing in the repo, so that the secret stays out of git.
6. As the owner, I want a command that turns a password into the stored hash, so that I can set or change the password without writing code.
7. As a visitor who is not logged in, I want every page except login to send me to the login page, so that nothing leaks before login.

### Profile

8. As the Operator, I want to enter the Profile (first name, email, unit number, mobile) once, so that I never retype it for each booking.
9. As the Operator, I want clear messages when a Profile field is missing or malformed (for example, an invalid email), so that a booking doesn't fail at midnight because of a typo.
10. As the Operator, I want to edit the Profile at any time, so that a change of phone number reaches future bookings.
11. As the Operator, I want Profile changes to apply to Booking Requests that haven't run yet, so that I don't have to recreate them.
12. As the Operator, I want to be stopped from creating a Booking Request before a Profile exists, so that a request can never run without details.
13. As the owner, I want the Profile encrypted in the database, so that a leaked database file or backup doesn't expose friend B's details.
14. As the owner, I want the Profile never written to logs, so that logs can be shared when debugging. Screenshots do show the filled form, so they are only served to a logged-in Operator and are deleted with their Booking Request.
15. As the owner, I want the app to refuse to start if the encryption key is missing or invalid, so that it never stores the Profile in plain text by accident.

### Booking Requests

16. As the Operator, I want to pick a date and tick one or more Slots, so that I can say exactly which two-hour periods I want.
17. As the Operator, I want every ticked Slot to be booked, so that I can get 4 or 6 hours of play on the same day.
18. As the Operator, I want to see only the Slots the Court has (08:00 to 20:00), so that I can't ask for a time that doesn't exist.
19. As the Operator, I want to be stopped from creating a second Booking Request for a date that already has one, so that the same Slot isn't booked twice.
20. As the Operator, I want to be stopped from choosing a date in the past or a date with no Slots ticked, so that every request can do something.
21. As the Operator, I want each waiting Booking Request to show when it will run (date and time, Malaysia time), so that I know when to check the result.
22. As the Operator, I want a Booking Request for a date that is already open to run within about a minute, so that I can use the same site for last-minute bookings.
23. As the Operator, I want to add or remove Slots on a waiting Booking Request, so that I can change my mind before it runs.
24. As the Operator, I want to cancel a waiting Booking Request, so that nothing is booked for a day I can't play.
25. As the Operator, I want editing and cancelling to be blocked once a Booking Request has started running, so that the result matches what I see.
26. As the Operator, I want to see all my Booking Requests in date order, with upcoming ones first, so that the page reads like a schedule.
27. As the Operator, I want the site to work well on a phone, so that I can set it up from bed.

### Booking at Release Time

28. As the Operator, I want each Booking Request to run at a random moment between 00:01 and 00:02 Malaysia time after its date's Release Time, so that the bookings look like a person's and don't arrive at the same instant every night.
29. As the Operator, I want the Slots in a Booking Request tried one at a time, in time order, with a short random pause between them, so that the traffic looks like a person booking twice.
30. As the Operator, I want each Slot booked through the real Picktime page in a real browser, so that Picktime sees normal browser traffic.
31. As the Operator, I want a Slot that Picktime says is no longer available marked Taken and never retried, so that the tool doesn't pester Picktime.
32. As the Operator, I want a Slot that failed because of a network error or timeout retried at most twice, waiting longer each time, so that a brief glitch doesn't cost me the Slot.
33. As the Operator, I want a Slot still failing after the retries marked Failed with a plain-English reason, so that I know whether to book it by hand.
34. As the Operator, I want one Slot's failure not to stop the remaining Slots, so that I still get the others.
35. As the Operator, I want a screenshot saved for every Slot attempt, so that a failure can be understood without trying again.
36. As the Operator, I want to view a Failed Slot's screenshot from the status page, so that I can see what Picktime showed.
37. As the Operator, I want a Booking Request whose date is not yet open on Picktime when it runs marked Failed with "date not open on Picktime yet", so that a change to the venue's Booking Window shows up clearly instead of silently. A date found closed within a short grace period after its Release Time (default 60 seconds) is tried again first, so a date Picktime opens a few seconds late doesn't cost the night.
38. As the Operator, I want Picktime's own error text (for example, a limit on bookings per unit) shown on a Failed Slot, so that I learn about venue rules I didn't know.

### Downtime and recovery

39. As the Operator, I want a Booking Request that was due while the server was down to run as soon as the server is back, if its date hasn't passed, so that a reboot doesn't cost me the night.
40. As the Operator, I want such a Booking Request marked "ran late" with the time it actually ran, so that I understand why a Slot might be Taken.
41. As the Operator, I want a Booking Request that was interrupted mid-run (for example, by a crash) not re-run automatically, with its unfinished Slots marked Failed "interrupted, check Picktime", so that a Slot is never booked twice.
42. As the Operator, I want a Booking Request whose date has already passed while the server was down marked Failed "missed", so that it doesn't sit in Waiting forever.

### Status

43. As the Operator, I want each Slot to show Waiting, Booking…, Booked, Taken or Failed, so that I see the result per Slot at a glance.
44. As the Operator, I want each Booking Request to show Waiting, Booking…, Done or Cancelled, so that I know whether it has run.
45. As the Operator, I want each finished Slot to show when it was tried, so that I can match it to Picktime's email.
46. As the owner, I want Booking Requests, their results and screenshots deleted 30 days after their date, so that friend B's data and screenshots don't pile up.

### Operations

47. As the owner, I want a health check endpoint that reports whether the database and scheduler are working, so that Uptime Kuma can alert me.
48. As the owner, I want structured logs for every scheduler tick, Booking Request run, Slot attempt, retry, outcome and duration (without Profile data), so that I can debug a failed night from the logs alone.
49. As the owner, I want a dry-run command that fills the real Picktime form for a given date and Slot, takes a screenshot and stops before clicking Book, so that I can check the form steps against the live page safely.
50. As the owner, I want the whole app to start from one Docker image and one env file, so that the Beelink can rebuild it from scratch.
51. As the owner, I want `deploy/update-site.sh` to build `main`, swap the running container and roll back on a failed health check, so that deploys match the other projects.
52. As the owner, I want a `deploy/rollback.sh` that brings back the previous image, so that a bad deploy is one command to undo.
53. As the owner, I want the database and screenshots on a mounted volume, so that a redeploy keeps the Booking Requests and the Profile.
54. As the owner, I want every setting in one validated config module with a clear startup error, so that a missing variable fails at boot, not at midnight.
55. As a new contributor, I want the README to explain setup, configuration, running, testing, dry-run and deploy, so that I can work on it without asking anyone.

## Implementation Decisions

### Shape

- One Python process (FastAPI app) runs the web pages and an in-process scheduler loop. It is packaged as one Docker image based on the Playwright Python image, so Chromium and its system libraries are pinned with it (decision 0001).
- The app is served under the path prefix `/ai-projects/court-booker/` (FastAPI `root_path`), behind the host nginx.
- The business logic knows nothing about FastAPI, SQLite, Playwright or the encryption library. It talks to them through small interfaces, with adapters implementing them.

### Modules

- **config**: loads and validates every setting from environment variables at startup and fails with a message naming the missing or bad variable. Settings:
  - operator password hash and session signing secret
  - Profile encryption key
  - database file path and screenshot directory
  - Picktime booking page URL and the Court's name on that page
  - venue timezone (`Asia/Kuala_Lumpur`)
  - Slot start times (default 08:00–20:00 every 2 hours) and the Booking Window in days (default 2)
  - run jitter window (default 60–120 seconds after Release Time)
  - pause between Slots, retry count (default 2) and retry backoff
  - Picktime page timeout
  - login lockout (attempts, minutes)
  - retention days (default 30)
  - scheduler tick interval
  - log level
- **profile** (domain): the Profile value and its validation rules (all four fields required, email format, mobile digits). No storage concerns.
- **booking_requests** (domain): rules for creating, editing and cancelling Booking Requests:
  - one per date
  - the date must not be in the past
  - at least one Slot, all Slots from the configured list
  - editable only while Waiting
  - requires a Profile
  The module returns typed errors the web layer turns into messages.
- **schedule** (domain): pure functions with no I/O.
  - **Release Time** for a date: midnight venue time, Booking Window days before the date.
  - The **run time**: Release Time plus a jitter chosen once at creation, from an injected random source. It is stored so the status page can show it. If the date is already open, the run time is now plus a short delay.
  - Whether a request is due, late (more than 5 minutes past its run time when picked up) or missed (date already passed).
- **booking_run** (domain): runs one due Booking Request, given a clock, a random source, the Profile and a `CourtBookingSite`:
  - Tries each Slot in time order, with a random pause between Slots.
  - Maps outcomes: Booked; Taken (never retried); network failure (retried up to the configured count, with exponential backoff, then Failed); any other Picktime error (Failed with Picktime's text, not retried); date not open (tried again during the grace period after Release Time, then Failed with that reason, and the remaining Slots too).
  - Records each Slot's outcome as soon as it is known.
- **scheduler** (domain): one tick.
  - Expires old data.
  - Marks missed requests.
  - Marks Slots of any request found in Booking… at startup as Failed "interrupted".
  - Claims due requests one at a time (Waiting → Booking… as an atomic update, so a request is never claimed twice) and hands each to `booking_run`.
  The web app's startup runs one tick right away, then a background loop runs a tick every interval.
- **auth**:
  - Checks the password against a stored scrypt hash (standard library).
  - Issues a signed, HttpOnly, SameSite=Strict session cookie, and adds CSRF tokens to every form.
  - Counts failed logins in the database for lockout.
  - A CLI subcommand prints a hash for a given password.
- **adapters**:
  - `CourtBookingSite` interface: `book(date, slot, profile, *, dry_run) -> SlotAttempt`, where `SlotAttempt` holds an outcome (Booked, Taken, NotOpen, NetworkError, Rejected with message), the screenshot path and the duration.
    - The Playwright implementation opens the booking page fresh for every attempt, selects the Court, the date and the Slot, and fills first name, email, Unit Number and Mobile.
    - It submits, unless `dry_run`.
    - It reads Picktime's confirmation or "slot no longer available" message, and screenshots the final state.
    - It uses a normal desktop Chrome user agent and viewport, and no stealth tricks.
  - Booking Request repository: SQLite through the standard library `sqlite3`, schema migrations applied at startup.
  - Profile store: encrypts and decrypts the Profile with Fernet (`cryptography`). It keeps a single encrypted record, and the key comes from config (decision 0003).
  - Clock and random source: system implementations with fake ones for tests.
- **web**: FastAPI routes rendering Jinja templates (no JavaScript build), mobile-first CSS, plain HTML forms. Pages:
  - login
  - Booking Requests list (the home page)
  - new and edit Booking Request (date picker on new only, plus a checkbox per Slot; to change the date, cancel and create a new one)
  - Profile
  - screenshot view (served only to a logged-in Operator)
  - `/healthz` (unauthenticated; reports database reachable and last scheduler tick age, with no data)
- **entrypoint**: wires config, adapters and the web app; also exposes the CLI subcommands `serve`, `hash-password` and `dry-run --date --slot`.

### Data

- `profile`: one row, holding the Fernet token and an updated-at time.
- `booking_requests`: id, date (unique among requests that are not Cancelled, so a cancelled date can be requested again), status (Waiting, Booking…, Done, Cancelled), run time, created-at, started-at, ran-late flag.
- `slot_attempts`: request id, Slot start time, status (Waiting, Booking…, Booked, Taken, Failed), reason, screenshot path, attempted-at, retry count.
- `login_failures`: timestamp, for lockout.
- Times are stored in UTC and shown in venue time.

### Logging

JSON lines on stdout (read by Docker and Dozzle). Every Booking Request run and Slot attempt logs:
- request id, date, Slot
- outcome, duration and retry number
- for failures, the step that failed (open page, pick date, pick Slot, fill form, submit, read result)

Profile fields are never logged; Picktime's error text is logged as-is.

### Deploy

- `deploy/update-site.sh` follows the pawn-swarm model:
  - Fetches `main` into `~/homelab/dev`.
  - Builds the image tagged with the commit.
  - Starts the new container with the env file and data volume, waits for `/healthz`, then retires the old one; if the health check fails, keeps the old one.
- `deploy/rollback.sh` restarts the previous tag.
- The env file and data volume live outside the repo under `~/homelab`.
- The host nginx needs a one-time `location /ai-projects/court-booker/` proxy to the container on a shared Docker network. This is documented in the README and applied by hand with the owner's approval; it is not changed by the deploy script.

## Testing Decisions

- Good tests check behaviour a user or the scheduler can observe: pages, redirects, form errors, what was asked of Picktime, Slot statuses, and what is stored on disk. They don't check private functions or SQL.
- **Seam 1, the main one:**
  - Tests run the whole app through FastAPI's test client, with a real SQLite file in a temp directory and real encryption.
  - Only three things are fake:
    - a `CourtBookingSite` that returns scripted outcomes per Slot and records calls
    - a clock the test can move forward
    - a fixed random source
  - A test helper runs one scheduler tick at the faked time.
  - These tests cover user stories 1–48 except the browser steps. Examples:
    - lockout after N failures
    - the database file never containing Profile text
    - one request per date
    - run time between 00:01 and 00:02 after Release Time
    - every Slot tried in order, with Taken never retried and network errors retried twice
    - late, missed and interrupted handling
    - 30-day cleanup
    - startup failing on a missing or bad encryption key
- **Seam 2, the browser adapter:**
  - The Playwright adapter is tested against a small static copy of the Picktime booking form served locally. It is built from the real page's fields and messages; Picktime's own scripts are not copied.
  - Tests check that the right Slot is chosen and the right values reach the right fields, that confirmation maps to Booked and "no longer available" maps to Taken, that `dry_run` never submits, and that a screenshot is written.
  - It runs in CI with the pinned Chromium.
- **Pure unit tests** for the `schedule` functions (Release Time, run time, due/late/missed), because date arithmetic edge cases are cheapest to cover there: month ends, already-open dates and dates far ahead.
- **Live checks (manual, never in CI):** `dry-run` against the real Picktime page before the first real booking and after any Picktime change. The first real booking is made only with the owner's go-ahead.
- **Tooling:**
  - `uv` with a committed lock file
  - `ruff` for lint and format
  - `mypy --strict` for types
  - `pytest` with one command in the README
  - CI in `.github/workflows/court-booker.yml` runs all of it, plus a Docker build
- **Prior art:** none in Python in this repo yet. pawn-swarm's Vitest suite is the model for testing the logic without I/O, and its deploy scripts are the model for `deploy/`.

## Out of Scope

- More than one Operator or more than one Profile.
- Other venues, other Picktime pages, or the ping-pong tables.
- Cancelling or rescheduling a confirmed Booking (friend B uses Picktime's email).
- Notifications other than the status page (no email, Telegram or push).
- Reading the Booking Window from Picktime automatically; it is a config value, and a mismatch shows up as "date not open on Picktime yet".
- Recurring Booking Requests (for example, "every Friday 20:00").
- Booking at exactly 00:00:00 or racing other people; the run is deliberately spread across 00:01–00:02.
- Calling Picktime's internal JSON endpoints directly (decision 0002).

## Further Notes

- **Facts from the live page (read-only, 2026-10-05):**
  - The Booking Window is 2 days.
  - There is one badminton resource, "Badminton Hall 1", with 120-minute Slots.
  - Required fields are first name, email, a custom "Unit Number" and a custom "Mobile".
  - There is no login, payment or CAPTCHA today.
  - Picktime's account timezone is `Asia/Shanghai` (UTC+8, same as Malaysia, no DST).
  - Picktime may switch on CAPTCHA per business. If that happens, bookings will fail with a clear reason, and the approach needs revisiting.
- **Unknown until the first real booking:** whether Picktime or the venue limits bookings per unit per day, which would make a second Slot on the same day Failed with Picktime's message.
- **Picktime's terms** forbid bots for "Users" (the businesses). Whether that covers customers is unclear. The human pace and real browser are there to keep risk low (decision 0002); the owner has accepted the remaining risk.
- This is the first backend service on the Beelink, so `docs/new-project.md`'s walking-skeleton ticket also has to cover the Docker image, the deploy scripts and the nginx proxy note.
