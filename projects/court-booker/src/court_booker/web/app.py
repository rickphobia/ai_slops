"""Builds the FastAPI app from validated Settings."""

from fastapi import FastAPI

from court_booker.config import Settings


def create_app(settings: Settings) -> FastAPI:
    # root_path makes routes match both behind nginx (/ai-projects/court-booker/healthz) and
    # directly (/healthz), and makes generated links carry the prefix.
    app = FastAPI(
        title="court-booker",
        root_path=settings.root_path,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )

    @app.get("/healthz")
    def healthz() -> dict[str, str]:
        return {"status": "ok"}

    return app
