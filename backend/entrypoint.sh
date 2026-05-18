#!/bin/bash
set -e

echo "[BOOT] Running database migrations..."
alembic upgrade head

echo "[BOOT] Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
