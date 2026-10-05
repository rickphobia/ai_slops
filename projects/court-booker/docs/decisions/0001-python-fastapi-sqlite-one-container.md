# Python, FastAPI and SQLite in one Docker container

court-booker is the first project on rickphobia.com that needs a process running all the time: it holds a Profile and books at night with nobody watching. It runs as one Docker container: Python with FastAPI, server-rendered pages (no frontend build), SQLite in one file on a mounted volume, and an in-process scheduler. The host nginx forwards `/ai-projects/court-booker/` to it. There is one Operator and a handful of Booking Requests, so a separate database server, job queue or frontend app would be machinery with nothing to do.

**Trade-offs:** it doesn't match the TypeScript stack pawn-swarm uses. The site goes down when the container restarts, so overdue Booking Requests run on startup to cover that. The host nginx needs a one-time proxy entry that lives outside this repo.
