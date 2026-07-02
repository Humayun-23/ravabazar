# Deployment Guide

* Frontend: Vercel
* Backend: VPS (Docker + Nginx)
* Database: PostgreSQL

## Backend Foundation Notes

Required backend environment variables:

```text
APP_NAME
ENVIRONMENT
API_V1_PREFIX
DATABASE_URL
JWT_SECRET
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
CORS_ORIGINS
```

Production must use a strong `JWT_SECRET`, must restrict `CORS_ORIGINS` to the
deployed frontend domains, and must not expose PostgreSQL publicly.
