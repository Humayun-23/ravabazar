# API Contract

## Backend Foundation

Base API prefix:

```text
/api/v1
```

Health endpoints:

```text
GET /health
GET /health/database
GET /api/v1/health
```

`GET /health` returns application liveness without checking PostgreSQL.

Example response:

```json
{
  "status": "ok",
  "service": "Ravabazar API",
  "environment": "development"
}
```

`GET /health/database` and `GET /api/v1/health` check PostgreSQL with
`SELECT 1`.

Example response:

```json
{
  "status": "ok",
  "service": "Ravabazar API",
  "environment": "development",
  "database": "ok"
}
```

Product, order, payment, auth, and admin business APIs are not implemented in
the backend foundation phase.
