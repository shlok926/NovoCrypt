# RUNBOOK
**Enterprise Incident Response & Standard Operating Procedures**

---

## 1. High CPU / Memory Alert
**Symptom:** Grafana alerts indicate Host CPU > 90% or Host Memory > 90% for 5 minutes.
**Action:**
1. Connect via SSH to the server.
2. Run `docker stats` to identify the offending container.
3. If it's the backend, verify if an intensive cron job is running or if there's a DDoS.
4. Scale up the VM if legitimate load, or restart the container: `docker compose restart backend`.

## 2. Application HTTP 5xx Rate > 5%
**Symptom:** Grafana alerts indicate high error rate.
**Action:**
1. Connect via SSH.
2. Review backend structured logs: `docker compose logs --tail=100 -f backend`.
3. Filter by error level in NDJSON output to identify the failing route.
4. Verify database and redis connectivity.

## 3. Database Connection Exhaustion
**Symptom:** Backend logs show connection pooling errors (`PrismaClientInitializationError`).
**Action:**
1. Restart the backend container to clear zombie connections.
2. Verify Postgres logs: `docker compose logs postgres`.

## 4. Prometheus or Grafana Unavailable
**Symptom:** Port 3000 tunnel fails or metrics are missing.
**Action:**
1. Check container health: `docker compose ps`.
2. View logs: `docker compose logs prometheus` or `docker compose logs grafana`.
3. Recreate if corrupted: `docker compose up -d --force-recreate prometheus grafana`.
