# LOG2ACTION

Docker Compose runs the full app: PostgreSQL with pgvector, FastAPI, and the Vite frontend served by nginx.

## Initial Setup & Configuration

This project strictly relies on environment variables for security. You **must** create an `.env` file before running the application.

```bash
cp .env.example .env
```
Edit `.env` to configure your environment, database secrets, and AI provider.

## Cloud Shell Clean Run

Use this when the browser or Docker cache looks stale, or login keeps failing because an old Postgres volume still has old users.

```bash
docker compose down --volumes --remove-orphans
docker compose build --no-cache
docker compose up -d
docker compose ps
```

Open the Cloud Shell web preview for port `8080`.

**Development login:**
If `ENVIRONMENT=development` and `ENABLE_DEV_ADMIN=true` in your `.env` file, the development admin is automatically created using the `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD` credentials defined there. Check your `.env` file for these default credentials.

## Local Run

```bash
docker compose up --build
```

Frontend: `http://localhost:8080`

API health: `http://localhost:8000/health`

## Production Notes

Before deploying to production (e.g. AWS EC2, cloud services), update your `.env` file:
1. Set `ENVIRONMENT=production`.
2. Generate and set a strong `JWT_SECRET_KEY` and `POSTGRES_PASSWORD`.
3. Configure explicit `CORS_ORIGINS` and `ALLOWED_HOSTS`.
4. Define `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` to create your initial admin account, and remove them after the first deployment.
