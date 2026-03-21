#!/bin/bash
# ============================================================
# RadiusServer – Database Backup Script
# ============================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-/backup}"
DB_NAME="${POSTGRES_DB:-radius}"
DB_USER="${POSTGRES_USER:-radius}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/radiusserver_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

log() {
    echo "[backup] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

mkdir -p "$BACKUP_DIR"

log "Starting backup of database '$DB_NAME'..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h 127.0.0.1 \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --format=custom \
    | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup saved: $BACKUP_FILE ($FILESIZE)"

# Remove old backups
log "Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "radiusserver_*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

REMAINING=$(ls -1 "$BACKUP_DIR"/radiusserver_*.sql.gz 2>/dev/null | wc -l)
log "Backup complete. $REMAINING backup(s) on disk."
