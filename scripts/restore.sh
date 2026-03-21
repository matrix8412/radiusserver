#!/bin/bash
# ============================================================
# RadiusServer – Database Restore Script
# ============================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-/backup}"
DB_NAME="${POSTGRES_DB:-radius}"
DB_USER="${POSTGRES_USER:-radius}"

log() {
    echo "[restore] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

# Find backup to restore
BACKUP_FILE="${1}"

if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/radiusserver_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        log "ERROR: No backup files found in $BACKUP_DIR"
        exit 1
    fi
    log "No file specified. Using latest backup: $BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

log "Restoring from: $BACKUP_FILE"
log "WARNING: This will overwrite the current database '$DB_NAME'!"
log "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

# Drop and recreate database
log "Dropping and recreating database..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h 127.0.0.1 -U "$DB_USER" -d postgres -c "
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" 2>/dev/null || true

su - postgres -c "dropdb --if-exists $DB_NAME"
su - postgres -c "createdb -O $DB_USER $DB_NAME"

# Restore
log "Restoring data..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
    -h 127.0.0.1 \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    2>&1 || true

log "Restore complete. Restart the container to apply changes."
