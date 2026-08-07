#!/usr/bin/env bash
set -e

echo "Starting Environment Validation..."

REQUIRED_VARS=(
  "JWT_SECRET"
  "POSTGRES_PASSWORD"
  "POSTGRES_USER"
  "POSTGRES_DB"
  "REDIS_PASSWORD"
  "DOMAIN"
  "EMAIL"
  "S3_ACCESS_KEY_ID"
  "S3_SECRET_ACCESS_KEY"
  "S3_BUCKET"
  "S3_REGION"
)

# Check if .env file exists
if [ -f .env ]; then
  source .env
else
  echo "WARNING: .env file not found. Falling back to exported environment variables."
fi

MISSING_VARS=0

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: Required environment variable $var is missing."
    MISSING_VARS=$((MISSING_VARS+1))
  fi
done

if [ $MISSING_VARS -gt 0 ]; then
  echo "FATAL: $MISSING_VARS required environment variables are missing."
  echo "Validation failed. Aborting deployment."
  exit 1
fi

echo "Environment validation passed."
exit 0
