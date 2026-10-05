# 02: Operator login

**What to build:** The Operator logs in with one password and stays logged in on their phone; everyone else is sent to the login page. The owner sets the password on the server as a hash made by a CLI command, and repeated wrong passwords lock login for a while. Spec user stories 1–7.

**Blocked by:** 01 (Walking skeleton)

**Status:** ready

**Touches:** auth, adapters/sqlite, web, entrypoint

**Effort:** `medium`

- [ ] `hash-password` subcommand prints a scrypt hash; the Operator password hash and session secret come from config, never from the repo
- [ ] Login and logout pages; signed, HttpOnly, SameSite=Strict session cookie with a configurable lifetime
- [ ] Every form carries a CSRF token, and a POST without a valid one is rejected
- [ ] Every page except login and `/healthz` redirects a logged-out visitor to login
- [ ] After the configured number of failed attempts, login is refused for the configured minutes, even with the right password; failures are stored in SQLite so a restart doesn't reset them
- [ ] SQLite adapter with schema migrations applied at startup (first table: login failures)
- [ ] Failed and successful logins are logged at the right level, never with the password
- [ ] Tests through the test client cover redirect, login, logout, bad CSRF, lockout and lockout expiry (fake clock)
- [ ] README and `.env.example` updated
