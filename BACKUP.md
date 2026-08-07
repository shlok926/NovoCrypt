# NovoCrypt Enterprise Backup & Disaster Recovery

## Overview
This document outlines the disaster recovery architecture for the NovoCrypt database, officially configured to automatically push encrypted logical backups to an S3-compatible cloud storage bucket.

## Architecture
The system uses the `postgres-backup-local` sidecar container. 
*   **Local Storage:** Backups are saved locally to the `postgres_backups` Docker volume.
*   **Cloud Synchronization:** Backups are simultaneously pushed to an S3-compatible object store (AWS S3, Backblaze B2, Cloudflare R2, MinIO).
*   **Schedule:** `@daily` (Midnight).
*   **Retention:** 7 days locally and remotely.

## Required S3 Credentials
The following environment variables must be defined in `.env`:
*   `S3_ACCESS_KEY_ID`
*   `S3_SECRET_ACCESS_KEY`
*   `S3_BUCKET`
*   `S3_REGION`
*   `S3_ENDPOINT` (Required if using non-AWS providers like MinIO or R2)

## Disaster Recovery Procedure

### 1. Download Backup from S3
If the local host is completely destroyed, download the latest `.sql.gz` backup file from the secure S3 bucket using the AWS CLI or provider console:
```bash
aws s3 cp s3://<S3_BUCKET>/<YYYY-MM-DD-HH-MM-SS>-novocrypt.sql.gz ./latest-backup.sql.gz
```

### 2. Verify Integrity
Compare the checksum of the downloaded file with the expected checksum (if generated/logged) to ensure the archive is not corrupted.

### 3. Restore to Database
Copy the backup archive to the running database container and restore it:
```bash
# Copy file to container
docker cp latest-backup.sql.gz novocrypt-db:/tmp/

# Execute restore
docker exec -it novocrypt-db bash -c "gunzip -c /tmp/latest-backup.sql.gz | psql -U shield_user -d novocrypt"
```

## Restore Testing Policy
The Enterprise Architecture Review Board mandates that a manual restore test (following the above procedure) must be executed into a staging environment at least once per quarter to mathematically verify the disaster recovery pipeline.
