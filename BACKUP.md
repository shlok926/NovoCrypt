# Enterprise Disaster Recovery & Backup Runbook

## Architecture
The Postgres database is automatically backed up using the `prodrigestivill/postgres-backup-local` sidecar container integrated directly into the `docker-compose.yml` stack.

- **Engine:** `pg_dump` (Logical backup)
- **Schedule:** `@daily` (Configurable via `SCHEDULE` environment variable)
- **Retention:** 7 Days (Configurable via `BACKUP_KEEP_DAYS`)
- **Storage:** Local named volume `postgres_backups`

## 1. Backup Workflow
Backups run automatically. You can also manually trigger a backup by executing:
```bash
docker exec novocrypt-db-backup /backup.sh
```
To verify the backups have been created:
```bash
docker run --rm -v novocrypt_postgres_backups:/backups alpine ls -lh /backups
```

## 2. Restore Workflow
To restore the database from a backup, follow these exact steps:

1. **Stop the backend** to prevent new connections:
   ```bash
   docker compose stop backend
   ```
2. **Identify the backup file**:
   ```bash
   docker run --rm -v novocrypt_postgres_backups:/backups alpine ls -lh /backups
   ```
3. **Drop existing connections & Restore**:
   ```bash
   # Replace <timestamp> with the actual backup filename
   docker exec -i novocrypt-db pg_restore -U shield_user -d novocrypt --clean --if-exists < /var/lib/postgresql/backups/<timestamp>-novocrypt.sql
   ```
   *Note: If the backup is gzip compressed (.gz), decompress it via a pipe: `zcat <file.gz> | docker exec -i novocrypt-db psql -U shield_user -d novocrypt`*

4. **Restart the backend**:
   ```bash
   docker compose start backend
   ```

## 3. Validation Procedure
A backup is invalid until it has been restored.
To validate:
1. Spin up a temporary, isolated Postgres container.
2. Load the latest dump into the temporary container.
3. Execute `SELECT count(*) FROM "User";` (or equivalent) to verify data structure and counts.
4. Verify the checksum of the backup archive if transferring off-site.

## 4. Disaster Recovery
If the host is completely lost but the `postgres_backups` volume was synced offsite:
1. Re-provision the host.
2. Place the backup archive in the local filesystem.
3. Mount the local path to the new Postgres container.
4. Execute the Restore Workflow (Step 3).

## 5. Restore Testing Checklist
- [ ] Weekly automated backup executed successfully.
- [ ] Checksum matched between source and destination (if exported).
- [ ] Backup successfully loaded into a staging database.
- [ ] Application logic verified against the staging database.
