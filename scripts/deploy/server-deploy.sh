#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/chihiro/current}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-chihiro}"
ARTIFACT_PATH="${ARTIFACT_PATH:-}"

if [ -z "$ARTIFACT_PATH" ]; then
  echo "ARTIFACT_PATH is not set." >&2
  exit 1
fi

if [ ! -f "$ARTIFACT_PATH" ]; then
  echo "Artifact not found: $ARTIFACT_PATH" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed on the server." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not installed on the server." >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 is not installed on the server." >&2
  exit 1
fi

git config --global --add safe.directory "$APP_DIR"

cd "$APP_DIR"

git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

rm -rf "$APP_DIR/.next" "$APP_DIR/node_modules"
tar -xzf "$ARTIFACT_PATH" -C "$APP_DIR"
rm -f "$ARTIFACT_PATH"

pnpm exec prisma migrate deploy

export PM2_APP_NAME
export APP_DIR

pm2 startOrReload ecosystem.config.cjs --env production
pm2 save

echo "Deployment complete for $PM2_APP_NAME on branch $DEPLOY_BRANCH using $ARTIFACT_PATH."
