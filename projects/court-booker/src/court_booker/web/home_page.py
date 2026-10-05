"""The home page. It will list the Booking Requests; for now it shows that login worked."""

from fastapi import APIRouter, Request
from starlette.responses import Response

from court_booker.web.access import access_of

router = APIRouter()


@router.get("/", name="home")
def home_page(request: Request) -> Response:
    return access_of(request).render(request, "home.html", {})
