# LOG2ACTION Production Readiness

This app is closer to deployable after the hardening pass in this branch, but production readiness also depends on infrastructure choices and operating discipline.

## Required Before Production

- Set `ENVIRONMENT=production`.
- Set `JWT_SECRET_KEY` to a unique 32+ character secret from a secret manager.
- Use managed Postgres or a private Postgres host through `DATABASE_URL`.
- Set `POSTGRES_PASSWORD` to a strong secret if using the bundled database.
- Set `CORS_ORIGINS` to explicit HTTPS frontend origins. Do not use `*` in production.
- Set `ALLOWED_HOSTS` to the deployed hostnames.
- Configure TLS at the load balancer or reverse proxy.
- Configure `VITE_API_URL` only when the API is on a different domain. Leave it empty for same-origin nginx proxying.
- Create the first admin with `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`, then remove both values after the admin exists.
- Keep `FIRST_USER_AUTO_ADMIN` as a local development convenience only. In production, first-user admin creation is disabled.
- Use `AI_PROVIDER=gemini` with `GEMINI_API_KEY` for real analysis. Keep `mock` for demos and tests only.

## Deployment Notes

- The backend container runs Alembic migrations at boot and starts Uvicorn without `--reload`.
- The frontend container builds static assets and serves them through nginx.
- nginx proxies `/api/*` and `/health` to the backend service, so a single-domain deployment works without browser CORS.
- The backend also supports cloud platforms that provide a `PORT` environment variable.

## Multi-User Data Isolation

- Chat history and log history are scoped to the authenticated user.
- Uploaded documents are listed and deleted only by their owner unless the requester is an admin.
- RAG retrieval is scoped to the current user's document chunks, plus legacy chunks without a user owner.
- Admin routes remain global and require `is_admin=true`.

## Security Controls Present

- JWT auth with configurable expiry.
- Password hashing with bcrypt.
- Minimum password complexity on registration.
- Admin approval gate for non-first users.
- Auth rate limiting per source IP in-process.
- Explicit production validation for CORS, JWT secret, and database password.
- Security headers on API and frontend responses.
- Upload size limits for document and chat file uploads.

## Remaining Work For A Strong SaaS Launch

- Move auth tokens from `localStorage` to secure, HTTP-only cookies or add refresh-token rotation and token revocation.
- Add organization/workspace tenancy if customers need shared team spaces. Current isolation is user-level, not org-level.
- Add audit logs for admin approval, deletes, login failures, and document uploads.
- Add object storage for original uploads if files must be retained; currently text/chunks are database-backed.
- Add background jobs for AI/RAG processing so large uploads do not tie up API workers.
- Add observability: structured logs, request IDs, metrics, tracing, uptime checks, and alerting.
- Add backups, restore drills, and migration rollback policy for Postgres.
- Add automated tests for auth, authorization, document ownership, and chat/RAG paths.
- Add a real billing/subscription layer before calling it a commercial SaaS.
