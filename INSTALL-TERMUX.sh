#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-$HOME/sidra-repair/Sidra-main}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$HOME/sidra-final-backup-$STAMP"

if [ ! -d "$TARGET" ]; then
  echo "Target Sidra repository not found: $TARGET"
  exit 1
fi

mkdir -p "$BACKUP"
cp -a "$TARGET/." "$BACKUP/"
echo "Backup created: $BACKUP"

find "$TARGET" -mindepth 1 -maxdepth 1 \
  ! -name '.git' \
  ! -name '.env.local' \
  ! -name 'node_modules' \
  ! -name '.next' \
  -exec rm -rf {} +

cp -a "$SOURCE_DIR/." "$TARGET/"
rm -rf "$TARGET/.git" "$TARGET/node_modules" "$TARGET/.next"

cd "$TARGET"
node scripts/production/verify-final-repair.mjs
npm install
npm run typecheck
npm run lint
npm run test
npm run build

echo
echo "Sidra final production repair installed and verified."
echo "Review localhost before committing and pushing."
