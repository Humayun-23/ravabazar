# Ravabazar Backend API

FastAPI backend for the Ravabazar e-commerce project.

Current phase: backend foundation only. Product, order, payment, and auth
business logic are intentionally not implemented yet.

## Configuration

Copy the example file for local non-Docker development:

```bash
cp .env.example .env
```

Important settings:

```text
APP_NAME=Ravabazar API
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ravabazar
JWT_SECRET=change_this_secret
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Use a strong `JWT_SECRET` outside local development. Production must not use
wildcard CORS.

## Local Development (Docker)

To run the PostgreSQL database and backend API locally using Docker Compose:

```bash
docker compose -f ../docker-compose.dev.yml up -d db backend
```

The API will be available at `http://localhost:8000`.
The interactive API documentation (Swagger) is available at `http://localhost:8000/docs`.

Health endpoints:

```text
GET /health
GET /health/database
GET /api/v1/health
```

## Database Migrations (Alembic)

To autogenerate a new migration after modifying models:

```bash
docker compose -f ../docker-compose.dev.yml exec backend alembic revision --autogenerate -m "description of changes"
```

To apply migrations to the database:

```bash
docker compose -f ../docker-compose.dev.yml exec backend alembic upgrade head
```

## Testing

To run the test suite:

```bash
docker compose -f ../docker-compose.dev.yml exec backend pytest
```

For local Python development, install `requirements.txt` in a virtual
environment and run:

```bash
python -m pytest
```
