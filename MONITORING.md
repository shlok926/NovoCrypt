# MONITORING
**Enterprise Observability Architecture & Access Guide**

---

## Architecture
The observability stack is deployed via Docker Compose and operates strictly within the internal Docker bridge network to preserve security boundaries.

*   **Prometheus:** Acts as the central time-series database. Scrapes `/metrics` from the backend every 15 seconds. Retention is strictly capped at 15 days (max 1GB).
*   **Grafana:** Visualizes the metrics. Dashboards and datasources are 100% provisioned via code in `docker/grafana/provisioning/`.
*   **Uptime Kuma:** Provides blackbox availability monitoring and active alerting.
*   **Pino:** The Node.js backend emits high-performance, structured NDJSON logs. All sensitive headers (`Authorization`, `Cookie`, `password`) are automatically redacted.

## Accessing Grafana
Grafana is intentionally blocked from the public internet. It is bound to `127.0.0.1:3000`.

To access the dashboard:
1. Establish an SSH tunnel to the host:
   ```bash
   ssh -L 3000:127.0.0.1:3000 admin@your-server-ip
   ```
2. Open your local browser to `http://localhost:3000`.
3. Login using `admin` and the password defined in the host `.env` file under `GF_SECURITY_ADMIN_PASSWORD`.

## Metric Definitions
*   `http_requests_total`: A counter of all HTTP requests, labeled by method, route, and status code.
*   `http_request_duration_seconds`: A histogram of request latencies.
*   `process_resident_memory_bytes`: Memory consumption of the Node.js process.
*   `process_cpu_seconds_total`: CPU time consumed by the Node.js process.
*   `nodejs_eventloop_lag_seconds`: Indicates Node.js thread blocking.

## Dashboard Modifications
Manual UI edits are prohibited. To modify a dashboard:
1. Export the JSON from Grafana.
2. Commit it to `docker/grafana/dashboards/`.
3. Redeploy the stack via GitHub Actions.
