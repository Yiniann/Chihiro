#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUILD_DIR="$ROOT_DIR/.next/standalone"
STATIC_DIR="$ROOT_DIR/.next/static"
PUBLIC_DIR="$ROOT_DIR/public"
PRISMA_DIR="$ROOT_DIR/prisma"
DIST_ROOT="$ROOT_DIR/.dist"
PACKAGE_DIR="$DIST_ROOT/chihiro-standalone"
ARCHIVE_PATH="$DIST_ROOT/chihiro-standalone.tar.gz"

if [ ! -d "$BUILD_DIR" ]; then
  echo "Standalone build output not found. Run 'pnpm build' first." >&2
  exit 1
fi

rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR/.next"

cp -R "$BUILD_DIR"/. "$PACKAGE_DIR/"

if [ -d "$STATIC_DIR" ]; then
  cp -R "$STATIC_DIR" "$PACKAGE_DIR/.next/static"
fi

if [ -d "$PUBLIC_DIR" ]; then
  cp -R "$PUBLIC_DIR" "$PACKAGE_DIR/public"
fi

if [ -d "$PRISMA_DIR" ]; then
  cp -R "$PRISMA_DIR" "$PACKAGE_DIR/prisma"
fi

mkdir -p "$DIST_ROOT"
rm -f "$ARCHIVE_PATH"
tar -C "$PACKAGE_DIR" -czf "$ARCHIVE_PATH" .

echo "Created standalone bundle:"
echo "  $ARCHIVE_PATH"
