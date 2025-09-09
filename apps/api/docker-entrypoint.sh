#!/bin/sh
set -e

echo "[entrypoint] Prisma generate"
npx prisma generate

echo "[entrypoint] Waiting for database and applying migrations"
ATTEMPTS=30
until npx prisma migrate deploy; do
  ATTEMPTS=$((ATTEMPTS - 1))
  if [ "$ATTEMPTS" -le 0 ]; then
    echo "[entrypoint] Database is not ready. Exiting."
    exit 1
  fi
  echo "[entrypoint] DB not ready, retrying in 2s... ($ATTEMPTS left)"
  sleep 2
done

echo "[entrypoint] Seeding database (if configured)"
npm run prisma:seed || echo "[entrypoint] Seed skipped"

echo "[entrypoint] Starting API"
exec node dist/main.js

