#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
: "${SIDRA_SOURCE_PROJECT:?Set SIDRA_SOURCE_PROJECT}"
: "${SIDRA_RESTORE_PROJECT:?Set SIDRA_RESTORE_PROJECT to a separate test project}"
: "${SIDRA_BACKUP_BUCKET:?Set SIDRA_BACKUP_BUCKET}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PREFIX="gs://${SIDRA_BACKUP_BUCKET}/firestore/${STAMP}"
gcloud firestore export "$PREFIX" --project "$SIDRA_SOURCE_PROJECT"
gcloud firestore import "$PREFIX" --project "$SIDRA_RESTORE_PROJECT"
printf '{"performedAt":"%s","sourceProject":"%s","restoreProject":"%s","exportPrefix":"%s","status":"restore-command-completed"}\n' "$STAMP" "$SIDRA_SOURCE_PROJECT" "$SIDRA_RESTORE_PROJECT" "$PREFIX" > docs/PHASE-13-BACKUP-RESTORE-EVIDENCE.json
echo "Restore command completed. Verify document counts and sampled hashes before marking recentBackup passed."
