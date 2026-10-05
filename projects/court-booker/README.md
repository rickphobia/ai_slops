# court-booker

Books the badminton Court at 1120 Park Avenue on Picktime the moment a date opens, so nobody has to stay up past midnight to do it. Built for one Operator; served at `rickphobia.com/ai-projects/court-booker/`.

## Status

`in progress`: walking skeleton plus Operator login. The app starts, validates its settings, logs JSON, answers `/healthz`, and lets the Operator log in and out, locally and in Docker. Profile, Booking Requests and booking come in the next tickets (`docs/tickets/`).

## Requirements

- [uv](https://docs.astral.sh/uv/) 0.9 or later. It installs the pinned Python (3.12, see `.python-version`) by itself.
- Docker, for the image the server runs.
- No accounts or API keys yet; the only secrets are the two you make in Setup.

## Setup

```bash
cd projects/court-booker
uv sync                  # creates .venv with the locked dependencies
cp .env.example .env     # then fill in the two secrets:
uv run court-booker hash-password   # asks for the Operator password twice, prints its hash
openssl rand -hex 32                # a session secret
```

Put the hash in `COURT_BOOKER_OPERATOR_PASSWORD_HASH` and the secret in `COURT_BOOKER_SESSION_SECRET`. Neither belongs in the repo; on the server they live in the env file outside it. `hash-password` also reads the password from a pipe (first line), for scripts.

## Run

```bash
uv run --env-file .env court-booker serve
curl http://127.0.0.1:8000/ai-projects/court-booker/healthz   # {"status":"ok"}
```

Then open <http://127.0.0.1:8000/ai-projects/court-booker/> and log in. Use the prefixed URL: cookies are scoped to the prefix, so logging in without it (`/login`) won't stick, though the routes answer there. Locally `.env.example` sets `COURT_BOOKER_SECURE_COOKIES=false`, because the browser won't send a Secure cookie over plain http.

## Test

```bash
uv run ruff check && uv run ruff format --check && uv run mypy && uv run pytest
```

CI (`.github/workflows/court-booker.yml`) runs the same commands, `shellcheck` on `scripts/`, and the Docker smoke test below.

## Docker

The image is based on the pinned Playwright Python image, so Chromium comes with it (decision 0001).

```bash
scripts/docker-smoke-test.sh     # build, start with throwaway secrets, check /healthz and /login, remove

docker build -t court-booker .
docker run --rm -p 127.0.0.1:8000:8000 --env-file .env -e COURT_BOOKER_HOST=0.0.0.0 court-booker
```

The `-e COURT_BOOKER_HOST=0.0.0.0` overrides the `127.0.0.1` from `.env`, which would make the container unreachable. The image has a Docker `HEALTHCHECK` on `/healthz`; `docker ps` shows `healthy` once it answers.

## Configuration

Every setting is an environment variable, read and validated once at startup by `src/court_booker/config.py`. A bad value stops the app with an error naming the variable.

| Variable | Required | Default | What it does |
|----------|----------|---------|--------------|
| `COURT_BOOKER_LOG_LEVEL` | no | `INFO` | `DEBUG`, `INFO`, `WARNING` or `ERROR` |
| `COURT_BOOKER_HOST` | no | `127.0.0.1` (`0.0.0.0` in the image) | Address the web server listens on |
| `COURT_BOOKER_PORT` | no | `8000` | Port the web server listens on |
| `COURT_BOOKER_ROOT_PATH` | no | `/ai-projects/court-booker` | Public path prefix the host nginx serves the app under |
| `COURT_BOOKER_OPERATOR_PASSWORD_HASH` | **yes** | | The Operator password as an scrypt hash from `court-booker hash-password` |
| `COURT_BOOKER_SESSION_SECRET` | **yes** | | At least 32 characters; signs session cookies and CSRF tokens. Changing it logs the Operator out |
| `COURT_BOOKER_DATABASE_PATH` | no | `data/court-booker.sqlite3` (`/app/data/court-booker.sqlite3` in the image) | The SQLite file; its folder is created if missing |
| `COURT_BOOKER_SESSION_DAYS` | no | `30` | How long a login lasts |
| `COURT_BOOKER_SECURE_COOKIES` | no | `true` | Send cookies over https only. Set `false` only for local http |
| `COURT_BOOKER_LOGIN_MAX_FAILURES` | no | `5` | Wrong passwords that trigger the lockout |
| `COURT_BOOKER_LOGIN_LOCKOUT_MINUTES` | no | `15` | The lockout window, see "How it works" |

## How it works

- `court-booker serve` (`cli.py`) loads the settings, sets up JSON logging and starts uvicorn with the app from `web/app.py`.
- The FastAPI app uses the path prefix as its `root_path`, so it works behind nginx forwarding `/ai-projects/court-booker/...` unchanged.
- `/healthz` needs no login and returns `{"status": "ok"}`, with no data.
- At startup `serve` opens the SQLite file and applies any schema migrations it hasn't had (`adapters/sqlite/database.py`, tracked with `PRAGMA user_version`). A file from a newer release is refused rather than guessed at.
- **Login** (`auth/`, `web/login_pages.py`): the password is checked against the scrypt hash. Success sets a signed session cookie (HttpOnly, SameSite=Strict, Secure, scoped to the prefix) holding only its issue time; the signature also covers the password hash, so changing the password logs every session out. Logout deletes the cookie.
- **Who sees what:** `/login` and `/healthz` are public; every other page sits on a router guarded by `require_operator` and redirects a logged-out visitor to `/login`. New pages go on such a router (see `web/app.py`).
- **CSRF:** every page gives the browser a random nonce cookie and puts an HMAC of it in each form. An app-wide dependency rejects any POST whose token doesn't match with `403`.
- **Lockout:** each wrong password is stored in the `login_failures` table. Once `COURT_BOOKER_LOGIN_MAX_FAILURES` of them fall within the last `COURT_BOOKER_LOGIN_LOCKOUT_MINUTES`, every login is refused, the right password included, until enough of them are older than that. Refused attempts aren't counted, so nobody can extend the lock forever; a successful login clears the count. It survives a restart because it's in the database.

The full design (scheduler, Picktime browser adapter, encrypted Profile) is in `docs/spec.md`.

## Folder layout

```
src/court_booker/
  config.py          # settings from env vars, validated at startup
  json_logging.py    # JSON-lines log format on stdout
  clock.py           # the current time, faked in tests
  cli.py             # entrypoint: `court-booker serve` and `hash-password`
  auth/              # password hashes, session cookies and CSRF tokens, login lockout
  adapters/sqlite/   # the database file, migrations, stored login failures
  web/app.py         # FastAPI app wiring and /healthz
  web/access.py      # session and CSRF checks, page rendering
  web/*_page(s).py   # pages, with their templates in web/templates/
tests/               # mirrors src/
scripts/
  docker-smoke-test.sh
Dockerfile
docs/                # spec, tickets, decisions
```

## Debugging

- Logs are JSON lines on stdout (`docker logs <container>`, or Dozzle on the server). Each line has `time` (UTC), `level`, `logger`, `message` and any extra fields.
- Set `COURT_BOOKER_LOG_LEVEL=DEBUG` for more detail.
- If the app exits at once with `invalid configuration: ...`, the message names the variable to fix.
- If the container runs but is unreachable, check `COURT_BOOKER_HOST` is `0.0.0.0` inside it.
- Logins are logged: `operator logged in` (info), `login failed: wrong password` and `login refused: locked out ...` (warning), each with the client address. Passwords are never logged.
- Logged in but sent straight back to the login page: over plain http, set `COURT_BOOKER_SECURE_COOKIES=false`; otherwise check you used the prefixed URL.
- Locked out: wait the lockout minutes, or, on the server, clear it with `sqlite3 <database file> 'DELETE FROM login_failures'`.
- A form answers `403 The form expired`: its CSRF token no longer matches the browser's cookie (for example after cookies were cleared). Reload the page and submit again.

## Decisions

See `docs/decisions/` for why things are the way they are.
