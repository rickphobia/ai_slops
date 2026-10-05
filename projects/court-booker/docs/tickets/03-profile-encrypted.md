# 03: Profile, encrypted

**What to build:** The logged-in Operator saves friend B's Profile (first name, email, unit number, mobile) once and edits it any time. It is stored encrypted with a key held by the server (decision 0003), and the app won't start without a valid key. Spec user stories 8–10, 13–15.

**Blocked by:** 02 (Operator login)

**Status:** done

**Touches:** profile, adapters/profile-store, web, config

**Effort:** low

- [x] Profile page shows the saved values and saves edits; each field has a clear error message (missing field, bad email, mobile not digits)
- [x] The Profile is stored as one Fernet-encrypted record; a test checks the database file contains none of the Profile values in plain text
- [x] The app refuses to start, with a clear message, when the encryption key is missing or invalid; a `.env.example` comment says how to generate one
- [x] Profile values never appear in logs (tested by capturing log output during save)
- [x] Tests through the test client cover first save, edit, validation errors and the logged-out redirect
- [x] README and `.env.example` updated
