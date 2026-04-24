#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/www.xiami.dev}"
CHIHIRO_IMAGE="${CHIHIRO_IMAGE:-}"
IMAGE_TAR="${IMAGE_TAR:-chihiro-image.tar}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-chihiro}"

if [ -z "$CHIHIRO_IMAGE" ]; then
  echo "CHIHIRO_IMAGE is not set." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed on the server." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is not installed on the server." >&2
  exit 1
fi

cd "$APP_DIR"

if [ ! -f "$IMAGE_TAR" ]; then
  echo "Image archive not found: $APP_DIR/$IMAGE_TAR" >&2
  exit 1
fi

if [ ! -f "$APP_DIR/.env" ]; then
  postgres_password="$(openssl rand -base64 24 | tr -d '\n' | tr '/+' '__')"
  site_url="${NEXT_PUBLIC_SITE_URL:-https://www.xiami.dev}"

  cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="postgresql://chihiro:${postgres_password}@localhost:5432/chihiro?schema=public"
DOCKER_DATABASE_URL="postgresql://chihiro:${postgres_password}@postgres:5432/chihiro?schema=public"
NEXT_PUBLIC_SITE_URL="${site_url}"
POSTGRES_DB="chihiro"
POSTGRES_USER="chihiro"
POSTGRES_PASSWORD="${postgres_password}"
POSTGRES_HOST="127.0.0.1"
POSTGRES_PORT="5432"
APP_PORT="3000"
PORT="3000"
RUN_MIGRATIONS="true"
PRISMA_DEPLOY_MODE="push"
EOF

  chmod 600 "$APP_DIR/.env"
  echo "Created $APP_DIR/.env with generated database credentials."
fi

docker load -i "$IMAGE_TAR"
rm -f "$IMAGE_TAR"

export CHIHIRO_IMAGE
export COMPOSE_PROJECT_NAME

docker compose up -d --remove-orphans
docker compose ps

echo "Docker deployment complete using loaded image $CHIHIRO_IMAGE."
