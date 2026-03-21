# Backup & Restore

## Automatic Backup

Run a backup from the host:

```bash
make backup
# or
docker compose exec radiusserver /scripts/backup.sh
```

Backups are stored in `/backup/` inside the container (mounted volume).

Format: `radius_backup_YYYYMMDD_HHMMSS.sql.gz`

Old backups (>30 days) are automatically removed.

## Restore

```bash
make restore FILE=radius_backup_20240101_120000.sql.gz
# or
docker compose exec radiusserver /scripts/restore.sh /backup/radius_backup_20240101_120000.sql.gz
```

> **Warning:** Restore will drop and recreate the database. All current data will be lost.

## Manual Backup

```bash
docker compose exec radiusserver pg_dump -U radius radius_db | gzip > backup.sql.gz
```

## Backup Strategy

For production deployments:
1. Schedule regular backups via cron on the host
2. Copy backups to external storage
3. Test restore procedures periodically
4. Monitor backup size and retention

Example cron entry (daily at 2 AM):
```
0 2 * * * docker compose -f /path/to/docker-compose.yml exec -T radiusserver /scripts/backup.sh
```
