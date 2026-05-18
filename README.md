# LOG2ACTION

Docker Compose runs the full app: PostgreSQL with pgvector, FastAPI, and the Vite frontend served by nginx.

## Cloud Shell Clean Run

Use this when the browser or Docker cache looks stale, or login keeps failing because an old Postgres volume still has old users.

```bash
docker compose down --volumes --remove-orphans
docker compose build --no-cache
VITE_API_URL= docker compose up -d
docker compose ps
```

Open the Cloud Shell web preview for port `8080`.

Development login:

```text
Email: admin@log2action.local
Password: AdminPass1234
```

The development admin is created or repaired on startup while `ENVIRONMENT` is not `production` and `ENABLE_DEV_ADMIN=true`.

## Local Run

```bash
cp .env.example .env
docker compose up --build
```

Frontend: `http://localhost:8080`

API health: `http://localhost:8000/health`

## Production Notes

Before production, set `ENVIRONMENT=production`, use a strong `JWT_SECRET_KEY`, configure explicit `CORS_ORIGINS` and `ALLOWED_HOSTS`, use a strong database password or managed `DATABASE_URL`, and create the first admin with `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`.
