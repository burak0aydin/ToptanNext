#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/db}"
LOCAL_DB_CONTAINER="${LOCAL_DB_CONTAINER:-toptannext-db}"
LOCAL_DB_USER="${LOCAL_DB_USER:-toptannext}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-toptannext}"
POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:18-alpine}"
APPLY_MIGRATIONS="${APPLY_MIGRATIONS:-1}"
BACKUP_PRODUCTION="${BACKUP_PRODUCTION:-1}"
RESTORE_MODE="${RESTORE_MODE:-clean}"

usage() {
  cat <<'EOF'
Usage:
  PROD_DATABASE_URL="postgresql://..." pnpm db:push-local-to-prod

Required:
  PROD_DATABASE_URL       Production PostgreSQL connection string.

Optional:
  CONFIRM_PRODUCTION_RESTORE=YES  Skip the interactive confirmation.
  BACKUP_PRODUCTION=0             Skip production backup before restore.
  APPLY_MIGRATIONS=0              Skip Prisma migrate deploy.
  LOCAL_DB_CONTAINER=toptannext-db
  LOCAL_DB_USER=toptannext
  LOCAL_DB_NAME=toptannext
  BACKUP_DIR=./backups/db
  POSTGRES_IMAGE=postgres:18-alpine

Notes:
  - DigitalOcean managed PostgreSQL usually needs sslmode=require in the URL.
  - POSTGRES_IMAGE must be the same major version as production, or newer.
  - RESTORE_MODE=clean deletes matching existing objects before restoring them.
EOF
}

if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

mask_database_url() {
  node -e '
    const value = process.env.PROD_DATABASE_URL || "";
    try {
      const url = new URL(value);
      if (url.password) url.password = "****";
      console.log(url.toString());
    } catch {
      console.log("[invalid URL]");
    }
  '
}

if [[ -z "${PROD_DATABASE_URL:-}" ]]; then
  echo "ERROR: PROD_DATABASE_URL is required."
  echo
  usage
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required because pg_dump/pg_restore are run via Docker."
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$LOCAL_DB_CONTAINER"; then
  echo "ERROR: Local database container '$LOCAL_DB_CONTAINER' is not running."
  echo "Start it with: docker compose up -d postgres"
  exit 1
fi

if [[ "${CONFIRM_PRODUCTION_RESTORE:-}" != "YES" ]]; then
  echo "This will restore LOCAL database data into PRODUCTION."
  echo "Target: $(mask_database_url)"
  read -r -p "Type YES to continue: " confirmation
  if [[ "$confirmation" != "YES" ]]; then
    echo "Cancelled."
    exit 1
  fi
fi

mkdir -p "$BACKUP_DIR"
timestamp="$(date +%Y%m%d-%H%M%S)"
local_dump="$BACKUP_DIR/local-$LOCAL_DB_NAME-$timestamp.dump"
production_dump="$BACKUP_DIR/production-before-restore-$timestamp.dump"

echo "Creating local dump: $local_dump"
docker exec "$LOCAL_DB_CONTAINER" \
  pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --username "$LOCAL_DB_USER" \
  --dbname "$LOCAL_DB_NAME" > "$local_dump"

if [[ "$BACKUP_PRODUCTION" == "1" ]]; then
  echo "Creating production backup: $production_dump"
  docker run --rm "$POSTGRES_IMAGE" \
    pg_dump \
    --format=custom \
    --no-owner \
    --no-acl \
    --dbname "$PROD_DATABASE_URL" > "$production_dump"
fi

if [[ "$APPLY_MIGRATIONS" == "1" ]]; then
  echo "Applying Prisma migrations to production"
  (
    cd "$ROOT_DIR/apps/api"
    DATABASE_URL="$PROD_DATABASE_URL" pnpm exec prisma migrate deploy --schema prisma/schema.prisma
  )
fi

restore_args=(
  --no-owner
  --no-acl
  --dbname "$PROD_DATABASE_URL"
)

if [[ "$RESTORE_MODE" == "clean" ]]; then
  restore_args=(--clean --if-exists "${restore_args[@]}")
fi

echo "Restoring local dump into production"
docker run --rm -i "$POSTGRES_IMAGE" \
  pg_restore "${restore_args[@]}" < "$local_dump"

echo "Done."
echo "Local dump: $local_dump"
if [[ "$BACKUP_PRODUCTION" == "1" ]]; then
  echo "Production backup: $production_dump"
fi
