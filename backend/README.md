# Backend API

FastAPI backend for the client e-commerce project.

## Local Development (Docker)

To run the PostgreSQL database and backend API locally using Docker Compose:

```bash
docker-compose -f ../docker-compose.dev.yml up -d db backend
```

The API will be available at `http://localhost:8000`.
The interactive API documentation (Swagger) is available at `http://localhost:8000/docs`.

## Database Migrations (Alembic)

To autogenerate a new migration after modifying models:

```bash
docker-compose -f ../docker-compose.dev.yml exec backend alembic revision --autogenerate -m "description of changes"
```

To apply migrations to the database:

```bash
docker-compose -f ../docker-compose.dev.yml exec backend alembic upgrade head
```

## Testing

To run the test suite:

```bash
docker-compose -f ../docker-compose.dev.yml exec backend pytest
```
