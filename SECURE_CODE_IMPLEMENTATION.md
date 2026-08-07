# SECURE CODE IMPLEMENTATION & PATCH ENGINEERING
**Enterprise Vulnerability Patch Strategy**
**Status:** Version 1.0

---

## PHASE 1: PATCH INVENTORY

| Patch ID | Related Finding ID | Vulnerability | Priority | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **PATCH-01** | API-VULN-01 | Prisma Typo IDOR | Critical | None |
| **PATCH-02** | CRYPTO-VULN-01 | Fail-Open Auth | Critical | None |
| **PATCH-03** | SUPPLY-VULN-01 | Phantom Packages | Critical | None |
| **PATCH-04** | INFRA-VULN-01 | Open Redis Binding | Critical | None |
| **PATCH-05** | AUTH-VULN-01 | Unauth Scanner APIs | High | PATCH-01 (Types) |
| **PATCH-06** | FS-VULN-01 | Workspace Leakage (DoS) | High | None |
| **PATCH-07** | INFRA-VULN-02 | PDF Postgres Bloat | High | DB Migration |
| **PATCH-08** | API-VULN-02 | Community Stored XSS | High | Frontend |
| **PATCH-09** | SUPPLY-VULN-02 | Container Root | Medium | Docker Build |
| **PATCH-10** | CICD-VULN-01 | Unpinned GH Actions | Medium | None |

---

## PHASE 2: FILE-BY-FILE CHANGE PLAN

### **PATCH-01 (API-VULN-01): Prisma Typo IDOR**
*   **Files:** `backend/src/routes/assets.routes.ts`, `backend/src/routes/reports.routes.ts`, `backend/src/middleware/auth.middleware.ts`
*   **Functions:** Route handlers invoking `req.user.id`
*   **Database Models:** `Asset`, `Report`, `Job`
*   **Changes:** Enforce `req.user.userId`.

### **PATCH-02 (CRYPTO-VULN-01): Fail-Open Auth Bypass**
*   **Files:** `backend/src/services/auth.service.ts`
*   **Functions:** `AuthService.login(email, password)`
*   **Changes:** Strip the `catch (error) { return MOCK_USER; }` block.

### **PATCH-06 (FS-VULN-01): Workspace Cleanup Leakage**
*   **Files:** `backend/src/services/scanner/acquisition/TargetAcquisitionService.ts`
*   **Functions:** `acquire(target, type)`
*   **Changes:** Add `try/finally` around repository operations.

---

## PHASE 3: SECURE REFACTORING DESIGN

### **Refactoring: Authentication Service (PATCH-02)**
*   **Current Implementation:** Catching a Prisma connection error returns a mocked administrative user object, bypassing password comparison.
*   **Target Implementation:** The `catch` block throws a `new AppError('Database connection failed', 503)`.
*   **Why required:** Fail-open authentication guarantees total platform compromise.
*   **Backward Compatibility:** Standard REST error shape (`{ error: ... }`). The frontend must handle the 503 response.
*   **Rollback Strategy:** Revert Git commit. No database state changes are involved.

---

## PHASE 4: AUTHENTICATION PATCHES

*   **JWT Typing:** Create `src/types/express/index.d.ts` and define:
    ```typescript
    declare namespace Express {
      export interface Request {
        user?: { userId: string; email: string; role: string };
      }
    }
    ```
*   **Ownership Enforcement:** Refactor all endpoints passing `req.user!.id` to Prisma to explicitly pass `req.user!.userId`. This strictly enforces boundary constraints.

---

## PHASE 5: API SECURITY PATCHES

*   **SSRF Protection (FS-VULN-02):** In `TargetAcquisitionService.ts`, validate that external git URLs strictly match `^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/.*\.git$` before spawning child processes.
*   **XSS Protection (API-VULN-02):** In `community.service.ts`, implement `import DOMPurify from 'isomorphic-dompurify'` and run `DOMPurify.sanitize(content)` on all thread insertions.
*   **CSV Protection (API-VULN-03):** In `reports.routes.ts`, filter all exported string values: if `value.match(/^[=\+\-@]/)`, prepend a single quote `'`.

---

## PHASE 6: FILESYSTEM & SCANNER PATCHES

*   **Workspace Cleanup (PATCH-06):**
    ```typescript
    try {
      await this.gitClone(url, tmpDir);
      // ... yield files ...
    } finally {
      if (fs.existsSync(tmpDir)) {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      }
    }
    ```
*   **Parser Isolation (FS-VULN-03):** Wrap `scannerEngine.runEnterpriseScan` execution in Node.js `worker_threads` (via `Piscina` or native `Worker`). The main event loop must not be blocked by recursive AST descent.

---

## PHASE 7: INFRASTRUCTURE PATCHES

*   **Docker (PATCH-09):** In `Dockerfile.backend`:
    ```dockerfile
    RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
    USER nodeapp
    ```
*   **Redis (PATCH-04):** In `docker-compose.yml`, change `redis:7-alpine` to require a password. Remove `ports: ["6379:6379"]`.
*   **Graceful Shutdown (INFRA-VULN-03):** In `index.ts`:
    ```typescript
    process.on('SIGTERM', async () => {
      await redis.quit();
      await prisma.$disconnect();
      server.close();
      process.exit(0);
    });
    ```

---

## PHASE 8: DEVSECOPS PATCHES

*   **Dependency Pinning (PATCH-03):** Run `npm install nodemailer@6.9.14 openai@4.52.0 @prisma/client@5.16.1 --save-exact` to remove caret ranges and prevent dependency confusion.
*   **GitHub Actions (PATCH-10):** In `ci.yml`:
    ```yaml
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
    ```

---

## PHASE 9: DATABASE MIGRATION PLAN

*   **Prisma Migrations (INFRA-VULN-02):**
    1. Update `schema.prisma`: Add `reportUrl String?` to the `Job` model.
    2. Generate migration: `npx prisma migrate dev --name offload_pdfs_to_s3`.
    3. **Data Migration:** Create a script (`scripts/migrate-pdfs.ts`) to upload existing `resultPayload` Base64 strings to S3, save the URLs to `reportUrl`, and nullify the `resultPayload` blobs.
    4. **Rollback:** Retain database snapshots before running the migration.

---

## PHASE 10: TESTING PLAN

*   **Unit Tests:** Verify `AuthService.login` throws 503 when the Prisma client is mocked to reject.
*   **Integration Tests:** Verify `GET /api/assets` correctly respects the `userId` JWT token and returns only the authenticated user's assets.
*   **Security Tests (DAST):** Attempt to call `/api/scanner/trigger` without an `Authorization` header. Assert 401 Unauthorized.
*   **Verification Checklist:**
    *   [ ] No Base64 strings exist in the DB.
    *   [ ] Redis connection from localhost fails.
    *   [ ] `npm audit` is clean.

---

## PHASE 11: PATCH DEPENDENCY GRAPH

1.  **Sprint 1 (Blockers):** PATCH-01 (IDOR) & PATCH-02 (Auth Bypass) must be deployed immediately. They have no dependencies.
2.  **Sprint 1 (Parallel):** PATCH-03 (Phantom Packages) & PATCH-04 (Redis Auth) can be done by DevSecOps in parallel.
3.  **Sprint 2:** PATCH-07 (PDF Bloat) blocks the scalability of the workers. Requires DB Migration approval before merging.
4.  **Sprint 3:** PATCH-09 (Docker Root) and PATCH-10 (GH Actions) harden the pipeline.

---

## PHASE 12: FINAL IMPLEMENTATION READINESS

*   **Are patches production-safe?** Yes. All patches preserve the existing BullMQ, Prisma, and Express architectural layers.
*   **Which patches require downtime?** PATCH-04 (Redis Auth) and PATCH-07 (PDF Postgres Bloat) require a brief maintenance window (approx. 5 minutes) to restart containers and run migrations.
*   **Which patches require feature flags?** None. These are core security flaw fixes.
*   **Which patches require staged rollout?** PATCH-07 (PDF Migration). The migration script should be run in Staging with production data clones before executing against the production PostgreSQL instance.
*   **Recommended implementation order:** Authentication Core (PATCH-01/02) -> Supply Chain Lockdown (PATCH-03) -> Redis Lockdown (PATCH-04) -> Resource Leak Fixes (PATCH-06/07) -> Container Hardening (PATCH-09).
