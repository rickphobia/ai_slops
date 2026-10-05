# The Playwright image pins Chromium and its system libraries with the app (decision 0001).
# Its Python (3.12) is the one pyproject.toml asks for. Bump the tag and digest together.
FROM mcr.microsoft.com/playwright/python:v1.63.0-noble@sha256:72bd171a9ffc2b4b59532aaa6210e21014d07093120dc25528870c0b840da1f0

COPY --from=ghcr.io/astral-sh/uv:0.9.13 /uv /usr/local/bin/uv

ENV UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON=python3.12 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencies first, so code changes don't reinstall them.
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --locked --no-dev --no-install-project

COPY src ./src
RUN uv sync --locked --no-dev

ENV PATH=/app/.venv/bin:$PATH \
    COURT_BOOKER_HOST=0.0.0.0 \
    COURT_BOOKER_PORT=8000 \
    COURT_BOOKER_DATABASE_PATH=/app/data/court-booker.sqlite3

# The SQLite file lives here; the server mounts a volume over it so data survives redeploys.
RUN mkdir /app/data && chown pwuser:pwuser /app/data

# pwuser is the image's unprivileged user.
USER pwuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import os, urllib.request; urllib.request.urlopen(f\"http://127.0.0.1:{os.environ['COURT_BOOKER_PORT']}/healthz\", timeout=4)"]

CMD ["court-booker", "serve"]
