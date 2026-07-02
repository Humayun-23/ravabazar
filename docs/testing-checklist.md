# Testing Checklist

## Backend Foundation

Automated:

* `GET /health` returns application liveness.
* `GET /api/v1/health` returns database health when the DB dependency succeeds.
* `GET /api/v1/health` reports degraded database health when the DB dependency fails.

Manual:

* `docker compose -f docker-compose.dev.yml up -d db backend`
* Open `http://localhost:8000/docs`
* Check `http://localhost:8000/health`
* Check `http://localhost:8000/api/v1/health`
