#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-$HOME/Sidra-git-push}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$HOME/sidra-admin-os-source-backup-$STAMP"

if [ ! -f "$TARGET/package.json" ]; then
  echo "Sidra project not found: $TARGET"
  exit 1
fi

python - "$TARGET" "$BACKUP" <<'PY'
from pathlib import Path
import shutil
import sys

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
excluded = {".git", ".next", "node_modules", ".env.local", "tsconfig.tsbuildinfo"}

for item in src.rglob("*"):
    relative = item.relative_to(src)
    if any(part in excluded for part in relative.parts):
        continue
    target = dst / relative
    if item.is_dir():
        target.mkdir(parents=True, exist_ok=True)
    elif item.is_file() and item.suffix != ".log":
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, target)
PY

echo "Lightweight source backup created: $BACKUP"

find "$TARGET" -mindepth 1 -maxdepth 1 \
  ! -name '.git' \
  ! -name '.env.local' \
  ! -name 'node_modules' \
  -exec rm -rf {} +

python - "$SOURCE_DIR" "$TARGET" <<'PY'
from pathlib import Path
import shutil
import sys

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
excluded = {".git", ".next", "node_modules", ".env.local", "tsconfig.tsbuildinfo"}

for item in src.rglob("*"):
    relative = item.relative_to(src)
    if any(part in excluded for part in relative.parts):
        continue
    target = dst / relative
    if item.is_dir():
        target.mkdir(parents=True, exist_ok=True)
    elif item.is_file() and item.suffix != ".log":
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, target)
PY

cd "$TARGET"
rm -f tsconfig.tsbuildinfo
node scripts/production/verify-final-repair.mjs
node scripts/production/verify-admin-os.mjs

if [ ! -d node_modules ]; then
  npm install --legacy-peer-deps
fi

npm run typecheck
npm run lint
npx vitest run --maxWorkers=1 --no-file-parallelism
NODE_OPTIONS="--max-old-space-size=3072" npm run build

echo
echo "SIDRA Admin OS + CMS installed and verified."
echo "Next: deploy Firestore rules, test localhost, then commit and push."
