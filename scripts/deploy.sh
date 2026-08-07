#!/usr/bin/env bash
set -e

echo "Starting Deployment..."

# Ensure we are in the repository root
cd "$(dirname "$0")/.."

# Validate environment
echo "Running environment validation..."
bash scripts/validate-env.sh

# Verify Git state and pull latest
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main

# Pull latest images
echo "Pulling latest images..."
docker compose pull

# Build images
echo "Building local images..."
docker compose build

# Bootstrap TLS certificates to prevent NGINX startup deadlock
echo "Checking TLS certificates..."
if ! docker run --rm -v pqc_certbot_data:/etc/letsencrypt alpine sh -c "test -f /etc/letsencrypt/live/novocrypt/fullchain.pem" 2>/dev/null; then
  echo "Bootstrapping dummy TLS certificates to allow NGINX to start..."
  docker run --rm -v pqc_certbot_data:/etc/letsencrypt alpine sh -c "apk add --no-cache openssl && mkdir -p /etc/letsencrypt/live/novocrypt && openssl req -x509 -nodes -newkey rsa:2048 -days 1 -keyout /etc/letsencrypt/live/novocrypt/privkey.pem -out /etc/letsencrypt/live/novocrypt/fullchain.pem -subj '/CN=localhost'"
fi

# Deploy
echo "Deploying infrastructure..."
docker compose up -d

# Wait for healthchecks
echo "Waiting for services to become healthy..."
sleep 30

# Verify services
UNHEALTHY=$(docker compose ps -q | xargs docker inspect -f '{{.State.Health.Status}}' | grep -v "healthy" | grep -v "starting" || true)

if [ -n "$UNHEALTHY" ]; then
  echo "FATAL: One or more services failed healthchecks."
  docker compose ps
  exit 1
fi

# Setup automated NGINX reload cron job (avoids docker.sock exposure)
echo "Configuring NGINX automated reload cron job..."
CRON_CMD="0 0 * * * cd $(pwd) && docker compose exec -T frontend nginx -s reload"
if ! crontab -l 2>/dev/null | grep -q "nginx -s reload"; then
  (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
fi


# I will just exit successfully.

echo "Deployment completed successfully!"
exit 0
