# SECURITY IMPLEMENTATION BIBLE
**Enterprise Security Remediation & Hardening Guide**
**Status:** Version 1.0

---

## PHASE 1: SECURITY ARCHITECTURE PRINCIPLES

### Security Philosophy
The NovoCrypt architecture is fundamentally sound (Prisma ORM, BullMQ workers, strict AST parsers, JWT auth) but currently lacks enforcement of boundary protections. Remediation will follow these principles without requiring a complete redesign:
*   **Defense in Depth:** Layered protections (e.g., auth checks *and* network isolation for Redis).
*   **Least Privilege:** Dropping `root` privileges in containers, restricting Prisma queries to the current `req.user.userId`.
*   **Fail Secure:** Replacing "mock user" database fallbacks with hard HTTP 503 Service Unavailable errors.
*   **Principle of Complete Mediation:** Every API route must explicitly validate the authentication token and the requested asset's ownership boundary.

---

## PHASE 2: VULNERABILITY INVENTORY

**CRITICAL FINDINGS:**
*   **API-VULN-01:** Systemic IDOR via `req.user.id` typo in Prisma filters.
*   **CRYPTO-VULN-01:** Fail-Open DB Authentication bypass emitting Mock Users.
*   **SUPPLY-VULN-01:** Dependency Confusion via phantom packages (`nodemailer@^9.0.3`, `openai@^6.47.0`).
*   **INFRA-VULN-01:** Unauthenticated Redis exposed to host network (`6379`).

**HIGH FINDINGS:**
*   **FS-VULN-01:** Workspace Leakage / Disk Exhaustion DoS on failed clones.
*   **FS-VULN-03:** AST Parser Sync Loop block (CPU starvation).
*   **INFRA-VULN-02:** PostgreSQL PDF Blob Bloat (`resultPayload` column).
*   **API-VULN-02:** Stored XSS in Community Threads.
*   **AUTH-VULN-01:** Unauthenticated Scanner Endpoints.

*(Medium/Low findings from the Master Plan are carried forward into the implementation phases below).*

---

## PHASE 3: ROOT CAUSE ANALYSIS

*   **API-VULN-01 (IDOR):**
    *   *Why it exists:* JWT is signed with `userId` but middleware attaches it to `req.user`. Developers blindly queried `req.user.id`.
    *   *Code-level reason:* TypeScript interfaces did not strictly enforce the `JwtPayload` shape on the Express Request object. Prisma explicitly strips `undefined` keys from `where` clauses, degrading `where: { tenantId, id: undefined }` to just `where: { tenantId }` (or worse).
*   **CRYPTO-VULN-01 (Fail-Open):**
    *   *Design-level reason:* The `try/catch` in `login()` returns a hardcoded `MOCK_USER` instead of throwing an error when the DB is offline, completely bypassing `bcrypt` verification.
*   **SUPPLY-VULN-01 (Dependency Confusion):**
    *   *Architectural reason:* Lack of `.npmrc` enforcing a private registry scope combined with AI/Human hallucination of future version numbers.

---

## PHASE 4: THREAT MODELING

*   **Finding:** API-VULN-01 (IDOR)
    *   *Threat Actor:* Authenticated Tenant.
    *   *Attack Vector:* Modifying `assetId` in REST paths.
    *   *Kill Chain:* Exploitation -> Actions on Objectives (Data Exfiltration).
    *   *OWASP:* A01: Broken Access Control.
*   **Finding:** INFRA-VULN-01 (Redis Poisoning)
    *   *Threat Actor:* Internal Network Pivot or Malicious Neighbor.
    *   *Attack Surface:* Host Port `6379`.
    *   *Kill Chain:* Delivery -> Exploitation (AST Injection).
    *   *OWASP:* A05: Security Misconfiguration.

---

## PHASE 5: SECURE ARCHITECTURE DESIGN

*   **Database Storage Architecture:**
    *   *Current:* PDF buffers are Base64 encoded and stored in the `Job` table's JSON column.
    *   *Target:* Worker service writes PDF to AWS S3 (or MinIO), generates a pre-signed URL, and saves ONLY the metadata and URL string to PostgreSQL.
*   **Redis Architecture:**
    *   *Current:* `0.0.0.0:6379` bound to host. No `requirepass`.
    *   *Target:* Redis container does not expose ports to the host. Services communicate internally on `novocrypt-network`. Redis initializes with `REDIS_PASSWORD`.

---

## PHASE 6: IMPLEMENTATION PLAN

*   **API-VULN-01 (IDOR Fix):**
    *   *Affected Files:* `src/routes/assets.routes.ts`, `src/routes/reports.routes.ts`, `src/routes/threats.routes.ts`.
    *   *Affected Middleware:* `src/middleware/auth.middleware.ts` (Requires strict typing mapping `userId`).
*   **FS-VULN-01 (Workspace Cleanup Fix):**
    *   *Affected Classes:* `TargetAcquisitionService`.
*   **CRYPTO-VULN-01 (Fail-Open Fix):**
    *   *Affected Services:* `AuthService.login`.

---

## PHASE 7: CODE REFACTORING STRATEGY

*   **AuthService Refactor:**
    *   *Current Code:* `catch (e) { return MOCK_USER; }`
    *   *Required Changes:* `catch (e) { throw new AppError('Database unavailable', 503); }`
    *   *Backward Compatibility:* Requires frontend to handle 503 errors gracefully during login.
*   **Prisma Typo Refactor:**
    *   *Current Code:* `where: { userId: req.user!.id }`
    *   *Required Changes:* `where: { userId: req.user!.userId }`
    *   *Expected Result:* Prisma correctly enforces the WHERE clause boundary.

---

## PHASE 8: IMPLEMENTATION ORDER

*   **Sprint 1 (Critical):** Fix Prisma `userId` references. Remove `MOCK_USER` fallback. Downgrade NPM packages. Add Redis auth.
*   **Sprint 2 (High):** Add `requireAuth` to Scanner. Add `try/finally` in `TargetAcquisitionService`. Migrate PDFs to S3. Add DOMPurify for Community.
*   **Sprint 3 (Medium):** Docker `USER node`. Pin GitHub Actions. Fix CSV Injection headers. Add `SIGTERM` handlers.
*   **Sprint 4 (Low):** Fix `bcryptjs` (migrate to `bcrypt`). Add HTTP Request IDs for Logging.
*   **Sprint 5 (Hardening):** Immutable audit logs via Datadog.

---

## PHASE 9: DATABASE CHANGES

*   **Schema Modifications:** 
    *   `Job.resultPayload` must be scrubbed of existing Base64 strings.
    *   Add `reportUrl` (String, nullable) to `Job` or `ScanResult` schema for S3 links.
*   **Migrations:** A single Prisma migration script is required to prune legacy Base64 blobs from the database to recover disk space.

---

## PHASE 10: AUTHENTICATION HARDENING

*   **JWT Integrity:** Maintain current symmetric signing, but enforce strict TypeScript casting on `jwt.verify()` outputs to guarantee the `userId` field exists.
*   **Rate Limiting:** Ensure `express-rate-limit` is actively applied to the `/api/auth/login` route to prevent brute-force (currently applied globally, needs strict 5-attempt limit on auth).

---

## PHASE 11: API SECURITY HARDENING

*   **Validation:** Keep Zod, but enforce `.strict()` on all schemas to prevent mass assignment.
*   **Output Encoding:** Community thread titles and bodies must be sanitized.
*   **CSV Protection:** In `reports.routes.ts`, iterate over export strings. If a field starts with `=`, `+`, `-`, or `@`, prepend a single quote (`'`) to neutralize Excel macro injection.

---

## PHASE 12: INFRASTRUCTURE HARDENING

*   **Docker:** In `docker/Dockerfile.backend` and `Dockerfile.frontend`, inject `USER node` before the `CMD` instruction.
*   **Graceful Shutdown:** In `src/index.ts`, add `process.on('SIGTERM', ...)` to close Prisma and BullMQ cleanly.
*   **Redis/Postgres:** In `docker-compose.yml`, delete `ports:` blocks for internal databases.

---

## PHASE 13: DEVSECOPS HARDENING

*   **GitHub Actions:** In `.github/workflows/ci.yml`, replace `actions/checkout@v4` with `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (or current SHA).
*   **Permissions:** Add `permissions: contents: read` to `ci.yml`.

---

## PHASE 14: LOGGING & MONITORING

*   **Correlation IDs:** Add `express-request-id` middleware in `app.ts`. Attach `req.id` to `res.locals`. Pass this ID into all `Logger.info()` calls as `traceId`.
*   **Audit Trails:** In `AuthService.login`, call `AuditService.recordEvent({ stage: 'Authentication', status: 'success' })`.

---

## PHASE 15: SECURITY TESTING

*   **IDOR Verification:** Write a Jest Integration Test: Create User A and User B. Authenticate as User A. Request `/api/assets/:user_B_asset_id`. Assert response is HTTP 403/404.
*   **Fail-Open Verification:** Stop the Postgres container. Send login POST. Assert response is 503 (Not 200 with JWT).
*   **Workspace DoS Verification:** Mock `git clone` to throw an error. Assert that `fs.existsSync(tmpDir)` is `false` after the error.

---

## PHASE 16: PRODUCTION ROLLOUT

*   **Deployment Plan:** 
    1. Deploy Database migration (prune Base64).
    2. Deploy Infrastructure (Docker-compose network lockdown).
    3. Deploy Backend API updates.
*   **Post-Deployment Validation:** Run automated integration tests against the staging environment. Execute manual DAST against the Scanner API to verify authentication enforcement.

---

## PHASE 17: ENTERPRISE SECURITY CHECKLIST

*   [ ] **API-VULN-01:** `userId` typo fixed everywhere. (Owner: Backend | Priority: Critical | Dep: None).
*   [ ] **CRYPTO-VULN-01:** Fail-Open `catch` block removed. (Owner: Backend | Priority: Critical | Dep: None).
*   [ ] **SUPPLY-VULN-01:** Phantom packages downgraded in `package.json`. (Owner: DevSecOps | Priority: Critical | Dep: None).
*   [ ] **INFRA-VULN-01:** Redis host binding removed, password required. (Owner: DevOps | Priority: Critical | Dep: None).

---

## PHASE 18: SECURITY GOVERNANCE

*   **PR Checklist:** All future PRs must prove Zod validation is applied and Prisma `where` clauses rely strictly on `req.user.userId`.
*   **Architecture Checklist:** No binary files (PDFs, images) shall ever be stored in the PostgreSQL database.

---

## PHASE 19: ENGINEERING SCORECARD

| Category | Target Score (Post-Remediation) |
| :--- | :--- |
| **Architecture Isolation** | 90/100 |
| **Authentication/Authorization** | 100/100 |
| **Infrastructure Hardening** | 85/100 |
| **Supply Chain** | 95/100 |
| **Observability** | 80/100 |
| **Overall Security Maturity** | **90/100 (ENTERPRISE READY)** |

---

## PHASE 20: FINAL DETERMINATION

*   **Can every verified vulnerability be fixed without architectural redesign?** YES. The core architecture (Prisma, Express, BullMQ) is correct. The vulnerabilities are implementation flaws (typos, missing try/catch/finally, exposed network ports).
*   **What should be fixed immediately?** The 4 Criticals: IDOR (`req.user.id`), Fail-Open DB Auth, Phantom Packages, and Redis network exposure.
*   **Which fixes require migrations?** Migrating PDF generation from Postgres JSON to S3 requires a data migration script.
*   **Which fixes require downtime?** The database pruning and Redis network reconfiguration will require a brief maintenance window (approx. 5 minutes).
*   **Recommended Sequence:** Fix configuration & packages (Supply/Infra) -> Fix Authentication -> Fix Authorization -> Fix Resource Leaks -> Hardening.
