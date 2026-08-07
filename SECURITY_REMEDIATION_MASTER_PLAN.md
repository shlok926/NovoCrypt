# SECURITY REMEDIATION MASTER PLAN
**Enterprise Security Implementation Roadmap**
**Status:** ACTIVE
**Version:** 1.0

---

## 1. EXECUTIVE OVERVIEW

**Objective:** Transform all verified vulnerabilities, architectural gaps, and security debt identified during the NovoCrypt Offensive Security Review into a structured, production-grade implementation roadmap. This document serves as the single source of truth for the engineering remediation program.

**Scope:** Backend APIs, Authentication, Authorization, Database configuration, Redis integration, CI/CD pipelines, Supply Chain dependencies, and Logging infrastructure.

**Current Security Posture:** HIGH RISK (Unsafe for Production). The platform has severe implementation flaws that break data isolation, authentication fallbacks, and supply chain integrity.
*   **Overall Risk Rating:** CRITICAL
*   **Total Findings:** 16 (4 Critical, 5 High, 5 Medium, 2 Low)
*   **Production Recommendation:** STRICT NO-GO until Sprint 1 & 2 are complete.
*   **Estimated Remediation Timeline:** 30 Days (Blockers) / 90 Days (Enterprise Maturity)

---

## 2. SECURITY DASHBOARD

| Finding ID | Vulnerability | Severity | Status | Sprint | Owner | ETA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| API-VULN-01 | Systemic IDOR via Prisma Typo | Critical | Open | Sprint 1 | Backend | 24h |
| CRYPTO-VULN-01 | Fail-Open DB Auth Bypass | Critical | Open | Sprint 1 | Backend | 24h |
| SUPPLY-VULN-01 | Dependency Confusion | Critical | Open | Sprint 1 | DevSecOps | 24h |
| INFRA-VULN-01 | Unauthenticated Exposed Redis | Critical | Open | Sprint 1 | DevOps | 48h |
| AUTH-VULN-01 | Unauthenticated Scanner Endpoints | High | Open | Sprint 2 | Backend | 72h |
| FS-VULN-01 | Workspace Leakage (DoS) | High | Open | Sprint 2 | Backend | 1wk |
| FS-VULN-03 | AST Parser Sync Loop (DoS) | High | Open | Sprint 2 | Platform | 1wk |
| INFRA-VULN-02 | PostgreSQL PDF Blob Bloat | High | Open | Sprint 2 | Database | 2wk |
| API-VULN-02 | Stored XSS in Community Threads | High | Open | Sprint 2 | Frontend | 1wk |
| API-VULN-03 | CSV Formula Injection | Medium | Open | Sprint 3 | Backend | 3wk |
| SUPPLY-VULN-02 | Container Root Execution | Medium | Open | Sprint 3 | DevOps | 3wk |
| INFRA-VULN-03 | Missing SIGTERM handlers | Medium | Open | Sprint 3 | Backend | 3wk |
| CICD-VULN-01 | Unpinned GitHub Actions | Medium | Open | Sprint 3 | DevSecOps | 3wk |
| CICD-VULN-02 | Overprivileged GITHUB_TOKEN | Medium | Open | Sprint 3 | DevSecOps | 3wk |
| LOG-VULN-02 | Missing HTTP Request Correlation | Low | Open | Sprint 4 | SecOps | 4wk |
| CRYPTO-VULN-02 | `bcryptjs` timing attacks | Low | Open | Sprint 4 | Backend | 4wk |

---

## 3. RELEASE BLOCKERS

The following vulnerabilities strictly block production deployment:
1.  **API-VULN-01 (IDOR):** Allows any authenticated user to view any tenant's data. **Exit Criteria:** Prisma queries strictly use `req.user.userId`.
2.  **CRYPTO-VULN-01 (Fail-Open Auth):** Allows unauthenticated `admin` access if the DB times out. **Exit Criteria:** `catch` block throws HTTP 503 instead of mocking a user.
3.  **SUPPLY-VULN-01 (Dependency Confusion):** Imminent RCE if attacker claims phantom versions. **Exit Criteria:** `package.json` downgraded to valid versions (`nodemailer@6.9.14`).
4.  **INFRA-VULN-01 (Open Redis):** Direct host access allows queue poisoning. **Exit Criteria:** `requirepass` enabled, host port mappings removed from `docker-compose.yml`.

---

## 4. CRITICAL FINDINGS

### API-VULN-01: Systemic IDOR via JWT/Prisma Typo
*   **Severity:** Critical (CVSS 9.9) | **OWASP:** A01: Broken Access Control | **MITRE:** T1068
*   **Repository Evidence:** `auth.controller.ts` signs JWTs with `{ userId }`. `assets.routes.ts` queries Prisma using `userId: req.user.id`. `req.user.id` is `undefined`, so Prisma strips the `WHERE` clause.
*   **Attack Scenario:** Attacker calls `GET /api/assets`. Prisma returns all assets in the DB.
*   **Root Cause:** JWT payload property mismatch. Prisma explicitly ignores `undefined` values.
*   **Business Impact:** Total loss of tenant data confidentiality.
*   **Technical Impact:** Horizontal Privilege Escalation.
*   **Affected Files:** `assets.routes.ts`, `reports.routes.ts`, `jwt.util.ts`.
*   **Implementation Strategy:** Standardize JWT payload types.
*   **Step-by-step Fix Plan:** 
    1. Define a strict `JwtPayload` interface containing `userId: string`.
    2. Update `express.d.ts` to extend `Request` with `user: JwtPayload`.
    3. Find/Replace all instances of `req.user.id` with `req.user.userId`.
*   **Validation Steps:** Unit test mocking `req.user.userId` vs `id`. Integration test querying assets as User A, ensuring User B's assets are absent.
*   **Acceptance Criteria:** `undefined` is never passed to Prisma `where` clauses.
*   **Priority:** 1 | **Owner:** Backend | **Status:** Open

*(Similar structures apply for CRYPTO-VULN-01, SUPPLY-VULN-01, INFRA-VULN-01. Condensing for brevity while retaining enterprise structure.)*

---

## 5. HIGH FINDINGS

### FS-VULN-01: Workspace Leakage (DoS)
*   **Severity:** High (CVSS 7.5) | **OWASP:** A04: Insecure Design | **MITRE:** T1489
*   **Repository Evidence:** `TargetAcquisitionService.ts` calls `spawn` for `git clone` but lacks a `finally` block to remove the `/tmp` directory if the clone throws an error.
*   **Root Cause:** Missing resource teardown in error boundaries.
*   **Business Impact:** Platform outage when disk fills up with orphaned repositories.
*   **Implementation Strategy:** Implement deterministic cleanup.
*   **Step-by-step Fix Plan:** Wrap the clone logic in `try { ... } finally { await cleanup() }`.

*(Similar structures for AUTH-VULN-01, FS-VULN-03, INFRA-VULN-02, API-VULN-02)*

---

## 6. MEDIUM FINDINGS

*(Standardized finding structures for API-VULN-03, SUPPLY-VULN-02, INFRA-VULN-03, CICD-VULN-01, CICD-VULN-02)*

---

## 7. LOW FINDINGS

*(Standardized finding structures for LOG-VULN-02, CRYPTO-VULN-02)*

---

## 8. SECURITY HARDENING CHECKLIST

*   [ ] **Authentication:** Replace `bcryptjs` with native `bcrypt` (C-bindings).
*   [ ] **Authorization:** Implement centralized RBAC middleware; deprecate ad-hoc `req.user.role === 'ADMIN'` checks.
*   [ ] **Input Validation:** Use `zod` strictly for all request `body`, `query`, and `params`.
*   [ ] **Output Encoding:** Implement DOMPurify on the frontend for Community threads.
*   [ ] **HTTP Headers:** Add Helmet.js to Express (already present but verify CSP configuration).
*   [ ] **Docker:** Add `USER node` to `Dockerfile.backend` and `Dockerfile.frontend`.
*   [ ] **Redis:** Add `REDIS_PASSWORD` via environment variables.
*   [ ] **PostgreSQL:** Remove host port `5433` mapping in `docker-compose.yml`.
*   [ ] **Filesystem:** Ensure AST worker runs in an isolated `worker_threads` context.
*   [ ] **Logging:** Implement `express-request-id` middleware for correlation tracking.
*   [ ] **Supply Chain:** Remove caret (`^`) versioning; use exact versions in `package.json`.
*   [ ] **CI/CD:** Pin all GitHub Actions to exact cryptographic SHAs.

---

## 9. ENTERPRISE SECURITY BEST PRACTICES

### API Layer
*   **Current State:** Weak route protections, vulnerable to mass assignment if Zod is bypassed.
*   **Recommended Architecture:** Strict Zod parsing `req.body = schema.parse(req.body)` ensuring unknown keys are stripped. 

### Database Layer
*   **Current State:** PDF blobs stored in JSON columns causing bloat.
*   **Recommended Architecture:** Offload all binary objects to Amazon S3 (or MinIO for on-prem), storing only signed URLs in PostgreSQL.

---

## 10. SECURE ARCHITECTURE IMPROVEMENTS

*   **Network Segmentation:** Redis and PostgreSQL must be isolated to an internal Docker network, inaccessible from the host interface (`127.0.0.1` or `0.0.0.0`).
*   **Worker Isolation:** CPU-bound AST parsing should be offloaded to isolated micro-VMs or Fargate tasks to prevent main Event Loop starvation (DoS).
*   **Secrets Manager:** Move away from `.env` files into a managed solution like AWS Secrets Manager or HashiCorp Vault during Kubernetes migration.

---

## 11. SECURITY SPRINT ROADMAP

### Sprint 1 (Immediate - 24 to 48 Hours)
*   **Objectives:** Neutralize Critical Release Blockers.
*   **Tasks:** Fix Prisma Typo (IDOR), Remove Mock User (Fail-Open), Downgrade Phantom Packages, Lock down Redis.
*   **Deliverables:** PRs merged to main; validated by Security team.

### Sprint 2 (High Priority - Next 7 to 14 Days)
*   **Objectives:** Ensure Operational Availability & Data Integrity.
*   **Tasks:** S3 migration for PDFs, Workspace Cleanup `finally` blocks, Enforce Auth on Scanner routes.

### Sprint 3 (Medium Priority - Next 30 Days)
*   **Objectives:** DevSecOps and Hardening.
*   **Tasks:** Docker `USER node`, GitHub Actions SHA pinning, SIGTERM graceful shutdown.

### Sprint 4 & 5 (Enterprise Maturity - 60 to 90 Days)
*   **Objectives:** Incident Response & Telemetry.
*   **Tasks:** Implement correlation IDs, Datadog log forwarding, WORM audit trails.

---

## 12. VALIDATION PLAN

*   **IDOR Validation:** Integration tests explicitly logging in as User A and attempting to read User B's UUID. Must return 403 or 404.
*   **Phantom Package Validation:** CI pipeline must run `npm audit` and `npm ci` cleanly.
*   **Docker Validation:** Run `docker exec -it novocrypt-backend whoami` post-deployment. Must output `node`, not `root`.
*   **Redis Validation:** Attempt `redis-cli -h 127.0.0.1 -p 6379 ping` from the host. Must be refused (connection refused or auth required).

---

## 13. PRODUCTION SECURITY CHECKLIST

*   [ ] CI/CD pipeline passes completely without overriding checks.
*   [ ] Dependency confusion vulnerability is mathematically impossible (versions locked).
*   [ ] No `.env` files contain production secrets in Git.
*   [ ] Database connections require TLS (`sslmode=require`).
*   [ ] Process manager handles `SIGTERM` gracefully.
*   [ ] Container image scanners show 0 Critical/High CVEs.

---

## 14. PRODUCTION GO / NO-GO CRITERIA

**Blocking Issues (NO-GO):**
*   API-VULN-01, CRYPTO-VULN-01, SUPPLY-VULN-01, INFRA-VULN-01 remain open.

**Final Production Readiness Criteria:**
Deployment is authorized **ONLY WHEN** Sprint 1 is 100% completed, validated by Integration Tests, and signed off by the Principal Security Engineer. Residual risks from Sprint 3+ will be formally documented as Accepted Risk for the initial launch window.
