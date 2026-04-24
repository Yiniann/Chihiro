#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-true}" != "false" ]; then
  if [ "${PRISMA_DEPLOY_MODE:-push}" = "migrate" ]; then
    pnpm exec prisma migrate deploy
  else
    pnpm exec prisma db push --skip-generate
  fi
fi

exec "$@"
