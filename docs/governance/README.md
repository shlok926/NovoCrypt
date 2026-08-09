# NovoCrypt Backend — Enterprise Governance & Lifecycle Documentation

---

## 1. Purpose of Governance Documentation

This directory contains the authoritative, consolidated governance, discovery, architectural, security, and quality gate records for all software evolution cycles (Patches and Enhancements) applied to the NovoCrypt Backend platform.

Enterprise governance documentation ensures complete auditability, technical traceability, and architectural preservation across the engineering lifecycle.

---

## 2. Distinction Between PATCH and ENHANCEMENT

- **PATCH (`docs/governance/patches/PATCH-XX.md`):** A remediation lifecycle focused on eliminating vulnerability findings, architectural defects, resource leaks, or quality bottlenecks in existing platform components. Patches preserve existing API contracts unless security dictates breaking changes.
- **ENHANCEMENT (`docs/governance/enhancements/ENHANCEMENT-XX.md`):** A platform evolution lifecycle introducing major new capabilities, API governance frameworks, developer experience tools, or architectural extensions without breaking baseline immutability contracts.

---

## 3. Lifecycle Methodology

Every evolution cycle follows an enterprise 9-stage lifecycle:

```
Discovery
  └─► Architecture Proposal
        └─► Scope Freeze
              └─► Implementation Plan
                    └─► Execution & Remediation
                          └─► Security Review & Quality Gates
                                └─► Release & Deployment
                                      └─► Post-Implementation Review
                                            └─► Formal Lifecycle Closure
```

---

## 4. Directory Hierarchy

```
docs/
└── governance/
    ├── README.md
    │
    ├── patches/
    │   ├── PATCH-06.md
    │   ├── PATCH-07.md
    │   ├── PATCH-08.md
    │   ├── PATCH-09.md
    │   └── PATCH-10.md
    │
    └── enhancements/
        └── ENHANCEMENT-01.md
```

---

## 5. Locating Historical Changes

- **Docker Runtime Hardening & NGINX User Ownership:** See [PATCH-06.md](file:///docs/governance/patches/PATCH-06.md)
- **Production TLS, Disaster Recovery & Deployment:** See [PATCH-07.md](file:///docs/governance/patches/PATCH-07.md)
- **Enterprise Observability, Pino Logging & Metrics:** See [PATCH-08.md](file:///docs/governance/patches/PATCH-08.md)
- **3-Tier Vitest Suite, Automation & V8 Quality Gates:** See [PATCH-09.md](file:///docs/governance/patches/PATCH-09.md)
- **Enterprise IAM, RBAC, JTI Revocation & Audit Logs:** See [PATCH-10.md](file:///docs/governance/patches/PATCH-10.md)
- **Enterprise API Platform, OpenAPI 3.1 & Dual Versioning:** See [ENHANCEMENT-01.md](file:///docs/governance/enhancements/ENHANCEMENT-01.md)

---

## 6. Governance Principles for AI Agents & Developers

### Core Principle
> **"Preserve the reasoning, evidence, decisions, and historical context behind engineering changes."**

1. **Separation of Concerns:** Production code (`backend/src`) and governance documentation (`docs/governance`) are strictly separated. Modifying documentation must never alter production application behavior.
2. **Baseline Immutability:** Closed patches (e.g. PATCH-10) represent immutable architectural baselines. Subsequent enhancements must treat baseline security and relational models as closed.
3. **Traceability:** All technical claims, coverage percentages, commit SHAs, and test matrix numbers in governance files must reflect empirical test execution logs.
