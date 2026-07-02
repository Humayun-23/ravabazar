# Architecture

```text
User / Android TWA
        ↓
Next.js frontend on Vercel
        ↓
Backend API on VPS
        ↓
PostgreSQL database
        ↓
External image storage
```

* The frontend and backend are in one monorepo but deployed separately.
* Frontend should call the backend using `NEXT_PUBLIC_API_URL`.
* Backend should expose `/api/v1`.
* PostgreSQL should not be publicly exposed.
* Images should not be stored permanently inside Docker containers.
