# AGENT.md

# Project Overview

**What this project is:**
NovoCrypt is a premier cybersecurity platform dedicated to preparing organizations for the post-quantum cryptography (PQC) era. It tracks, analyzes, and alerts users about quantum computing threats, Q-Day advancements, and NIST standardization updates.

**Why it exists:**
Quantum computing poses an existential threat to current cryptographic standards (RSA, ECC). NovoCrypt exists to bridge the transition gap, providing real-time intelligence and vulnerability scanning to ensure enterprise readiness before "Q-Day".

**Who uses it:**
CISOs, cybersecurity researchers, enterprise IT admins, and cryptographic engineers who need to monitor post-quantum vulnerability landscapes and migrate legacy encryption.

**Business Problem:**
Organizations lack real-time visibility into quantum threats and the tools to assess their own cryptographic posture against upcoming NIST PQC standards.

**Major Features:**
1. **Threat Intelligence Feed:** Real-time curation of quantum computing threats, breaches, and research.
2. **Enterprise Newsletter System:** A highly secure, automated alerting system (Double Opt-in) for threat distribution.
3. **Cryptography Scanner (Pending):** A utility to scan URLs and codebases to identify legacy cryptographic implementations and score post-quantum risk.
4. **Real-time WebSockets:** Pushing live updates to the frontend dashboard.

**Unique Selling Proposition (USP):**
Focusing exclusively on the Post-Quantum Cryptography transition with enterprise-grade security hardening and actionable intelligence.

---

# Tech Stack

- **Frontend:** React (Vite-based), assumed running on port `5173`.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** PostgreSQL (via Prisma ORM).
- **Infrastructure:** Local development environments (Windows/PowerShell).
- **Caching & Rate Limiting:** Redis (`ioredis`).
- **Libraries:**
  - `express`, `cors`, `helmet`, `morgan` (Core API & Security)
  - `prisma` (Database ORM)
  - `zod` (Input Validation)
  - `nodemailer` (Email Transport)
  - `express-rate-limit` (Anti-DDoS)
  - `disposable-email-domains` (Anti-spam)
  - `ws` (WebSockets)
- **AI Integration:** Pending Phase (Potential use of AI for threat analysis).

---

# Repository Structure

```
d:\Desktop\PQC\backend\
├── prisma/
│   ├── schema.prisma         # Database schema (Models: ThreatItem, ThreatSubscription, UnsubscribeFeedback, ScanResult, etc.)
├── src/
│   ├── config/               # database.ts, env.ts, redis.ts, websocket.ts
│   ├── middleware/           # auth.middleware.ts, rateLimit.middleware.ts, error.middleware.ts
│   ├── routes/               # API endpoint definitions (threats.routes.ts, etc.)
│   ├── services/             # Business logic layer (threats.service.ts, etc.)
│   ├── utils/                # Helper utilities (disposableEmails.ts)
│   ├── app.ts                # Express app configuration & middleware injection
│   └── index.ts              # Application entry point, server startup, DB connections
├── .env                      # Environment variables
└── package.json
```

---

# Architecture

**Request Flow:**
`Client Request -> Helmet/CORS -> Rate Limiter -> Express Route Handler -> Zod Validation -> Service Layer -> Prisma ORM -> PostgreSQL`

**Data Flow:**
Data is strictly typed using TypeScript interfaces and validated at the boundary using `zod`. The service layer handles business logic (e.g., token generation, cryptography), decoupling the database from the HTTP layer.

**API Flow:**
Base URL: `/api`
- `/api/threats/newsletter` (POST): Initiates subscription, triggers verification email.
- `/api/threats/verify` (GET): Validates crypto-token, activates subscription.
- `/api/threats/unsubscribe` (GET): Serves HTML feedback form natively (bypassing CSP issues).
- `/api/threats/unsubscribe-confirm` (POST): Processes feedback and removes user from the active mailing list.

**Service Communication:**
The application follows a monolithic service-oriented architecture where routes exclusively call `services/` for business logic.

---

# Coding Standards

- **Naming conventions:** `camelCase` for variables/functions, `PascalCase` for classes/models, `kebab-case` for file names (e.g., `threats.routes.ts`).
- **File conventions:** Feature-based grouping (e.g., all threat logic in `threats.routes`, `threats.service`).
- **Error handling:** Global error middleware (`errorHandler`). Routes wrap logic in `try/catch` and pass domain-specific error messages. Avoid leaking stack traces in production.
- **Logging:** Use `console.warn` for security anomalies (e.g., blocked temp emails), `console.log` for successful critical flows, and `morgan` for HTTP request logging.
- **Validation:** Strictly use `zod` for all incoming request body parsing (`emailSchema.parse()`).
- **Type Safety:** Strict TypeScript rules. Avoid `any`. Use Prisma-generated types.
- **Repository Pattern:** `services/` acts as the repository interface abstracting `prisma` calls.
- **Security First:** Always assume malicious input.

---

# Enterprise Development Rules

- **Production Standards:** Code must account for edge cases (e.g., Network timeouts during DNS resolution).
- **Security Rules:** Never trust client data. Do not execute inline JavaScript in server-rendered views (Helmet CSP compliance).
- **Maintainability:** Keep controllers thin. Move heavy logic to the service layer.
- **Performance:** Ensure Redis rate limiters are applied to public endpoints to prevent DB exhaustion. Use pagination for feeds.
- **Git Commit Conventions:** Use Conventional Commits (`feat(scope): message`, `fix(scope): message`, `refactor(scope): message`).
- **Testing Requirements:** All security mechanisms (Honeypot, Validation, DNS, Rate Limiting) must be considered for QA edge-case testing.

---

# Security Checklist

- [x] **Authentication:** Required for sensitive admin routes.
- [x] **Input Validation:** Zod schemas applied with `.trim().toLowerCase().max()`.
- [x] **Rate Limiting:** `authRateLimiter` applied to public POST routes.
- [x] **Anti-Bot:** Honeypot implementation on frontend form mapped to backend rejection.
- [x] **Anti-Spam:** `disposable-email-domains` blocklist applied. DNS MX record validation applied with network-timeout fallbacks (`ECONNREFUSED`).
- [x] **Double Opt-In:** Required cryptographic token verification for active subscriptions.
- [x] **CSP Compliance:** Helmet enabled; native HTML forms used over inline JS to prevent XSS.
- [x] **Secrets:** Managed via `.env` (SMTP_PASS, DB_URL, etc.).

---

# AI Agent Instructions

**CRITICAL RULES FOR FUTURE AGENTS:**
1. **Never rewrite working code blindly:** Understand the exact architecture and enterprise constraints before modifying logic.
2. **Security is Paramount:** If asked to add a feature, first ensure it does not bypass existing rate limiters, Zod validations, or Helmet CSP policies.
3. **Respect Helmet CSP:** Do NOT use inline `<script>` tags or `onclick` handlers in HTML rendered by the server. Use native HTML forms or external JS.
4. **Network Resilience:** External API/DNS calls must handle network failures gracefully. (e.g., `ECONNREFUSED` on DNS checks should not block legitimate users).
5. **Update Memory:** After completing a task, you MUST update `MEMORY.md` and `CONTEXT.md` to reflect the new state.
6. **Small Commits:** Make granular commits with Conventional Commit messages.
7. **No Hallucinations:** Rely purely on `schema.prisma` and existing code structure. Do not assume models exist unless verified.
8. **Logging:** Always log significant actions (e.g., `[FEEDBACK] User unsubscribed...`) for auditability.
