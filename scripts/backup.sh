#!/bin/bash

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATABASE_URL="${DATABASE_URL}"
RETENTION_DAYS="${RETENTION_DAYS:-90}"
LOG_FILE="${LOG_FILE:-/var/log/backup.log}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

if [ -z "$DATABASE_URL" ]; then
    log "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/kbc_${TIMESTAMP}.dump"
BACKUP_COMPRESSED="${BACKUP_FILE}.gz"

log "Starting database backup"
log "Database URL host: $(echo $DATABASE_URL | sed -E 's|://([^@]+)@[^/]+/.*|/HOST/|')"

mkdir -p "$BACKUP_DIR"

log "Running pg_dump to $BACKUP_FILE"
if pg_dump "$DATABASE_URL" -Fc -f "$BACKUP_FILE"; then
    log "pg_dump completed successfully"
else
    log "ERROR: pg_dump failed with exit code $?"
    exit 1
fi

log "Compressing backup to $BACKUP_COMPRESSED"
if gzip -9 "$BACKUP_FILE"; then
    log "Compression completed successfully"
    log "Backup size: $(du -h "$BACKUP_COMPRESSED" | cut -f1)"
else
    log "ERROR: Compression failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi

log "Cleaning up uncompressed backup file"
rm -f "$BACKUP_FILE"

log "Removing backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "kbc_*.dump.gz" -mtime +$RETENTION_DAYS -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "kbc_*.dump.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log "Removed $DELETED_COUNT old backup(s)"
fi

log "Backup completed successfully"
log "Backup file: $BACKUP_COMPRESSED"

exit 0
