# PATCH-06 — Docker Runtime Hardening & NGINX User Ownership

---

## 1. Executive Summary

PATCH-06 addresses container runtime security defects, root execution vulnerabilities, and workspace resource leaks identified in the NovoCrypt container infrastructure. It enforces unprivileged process execution (`nodeapp` and `nginx` non-root users), sets strict file ownership boundaries, and implements deterministic workspace cleanup routines.

- **Status:** CLOSED & IMMUTABLE
- **Baseline Commit:** `1f94043` / `2ffe2a9`
- **Primary Focus:** Container Security, Least Privilege, Resource Leak Remediation

---

## 2. Business / Engineering Objective

Eliminate container escape vectors, root privilege escalation vulnerabilities, and temporary disk exhaustion risks on production nodes hosting the NovoCrypt scanner service and NGINX reverse proxy.

---

## 3. Initial Discovery

Audits revealed that backend microservices and NGINX frontend proxies were executing as default `root` (`UID 0`) within containers. Furthermore, workspace acquisition operations in `TargetAcquisitionService.ts` lacked deterministic cleanup in error boundaries, leading to disk accumulation in `/tmp`.

---

## 4. Existing Architecture

- Backend container executed using default `node` image without specifying an unprivileged `USER`.
- NGINX proxy container wrote temporary cache and PID files as `root`.
- Git repository clone operations wrote payload blobs to `/tmp` without guaranteeing deletion on exception.

---

## 5. Identified Problems / Findings

| Finding ID | Flaw | Risk Level | Target Subsystem |
| :--- | :--- | :---: | :--- |
| **SUPPLY-VULN-02** | Container Root Execution | Medium | Docker Runtime |
| **FS-VULN-01** | Workspace Cleanup Leakage (DoS) | High | `TargetAcquisitionService` |
| **INFRA-VULN-04** | NGINX `tmpfs` Permission Mismatch | Medium | NGINX Container |

---

## 6. Threat Model / Security Analysis

- **T1068 (Privilege Escalation):** Attackers exploiting RCE vulnerabilities in Node.js dependencies gain immediate container root capabilities.
- **T1489 (Service Stop / DoS):** Maliciously failed scan requests fill container `/tmp` storage, causing host disk exhaustion and service crash.

---

## 7. Architecture Proposal

1. Create dedicated system group and user (`nodeapp`) inside `Dockerfile.backend`.
2. Wrap repository cloning operations in `try { ... } finally { await cleanup() }`.
3. Assign `tmpfs` volume ownership to unprivileged `nginx` user in NGINX container setup.

---

## 8. Scope Definition

- `Dockerfile.backend`
- `Dockerfile.nginx`
- `backend/src/services/scanner/acquisition/TargetAcquisitionService.ts`
- `docker-compose.yml`

---

## 9. Scope Freeze

Scope frozen on PATCH-06 discovery completion. Zero runtime API contract changes permitted.

---

## 10. Implementation Plan

1. Append `addgroup -S nodeapp && adduser -S nodeapp -G nodeapp` to `Dockerfile.backend`.
2. Add `USER nodeapp` directives to runtime stages.
3. Update `TargetAcquisitionService.ts` with `try/finally` workspace teardown logic.
4. Hotfix NGINX `tmpfs` ownership permissions (`chown -R nginx:nginx /var/cache/nginx`).

---

## 11. Implementation Details

```dockerfile
# Dockerfile.backend
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
USER nodeapp
```

```typescript
// TargetAcquisitionService.ts
try {
  await this.gitClone(url, tmpDir);
  return await this.processRepository(tmpDir);
} finally {
  if (fs.existsSync(tmpDir)) {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}
```

---

## 12. Testing Strategy

- Execute container process verification (`whoami`).
- Inject git clone errors to verify `/tmp` directory deletion.

---

## 13. Runtime / Integration Validation

- Container process user verified as `nodeapp` (`UID != 0`).
- NGINX proxy starts without permission errors on `/var/cache/nginx`.

---

## 14. Security Validation

- `docker exec -it novocrypt-backend whoami` outputs `nodeapp`.
- Non-root user prevents modification of container system binaries.

---

## 15. Regression Verification

- All scanner API endpoints function normally under `nodeapp` unprivileged user context.

---

## 16. Coverage / Quality Gates

- Workspace cleanup logic tested for error and success paths.

---

## 17. Git / Commit / Deployment Evidence

- **Commit `1f94043`:** `feat(infra): harden Docker runtime and production deployment (PATCH-06)`
- **Commit `2ffe2a9`:** `fix(infra): assign tmpfs ownership to unprivileged nginx user (PATCH-06 HOTFIX)`

---

## 18. Findings Register

- **SUPPLY-VULN-02:** CLOSED
- **FS-VULN-01:** CLOSED
- **INFRA-VULN-04:** CLOSED

---

## 19. Post-Implementation Review

Runtime hardening completed successfully. Container isolation verified.

---

## 20. Final Closure / Sign-off

- **Status:** APPROVED & CLOSED
- **Sign-off:** Principal Security Engineer, DevSecOps Lead

---

## 21. Historical Notes / Exceptions

Hotfix commit `2ffe2a9` was applied immediately following `1f94043` to resolve NGINX `tmpfs` startup permission checks.
