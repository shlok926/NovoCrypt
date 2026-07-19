# MEMORY.md

# Permanent Project Memory

**Project Timeline & Major Milestones:**
- **Phase 1:** Initial backend scaffolding, Database connection (PostgreSQL + Prisma), Redis integration, WebSocket initialization.
- **Phase 2 (Completed):** Enterprise-Grade Newsletter Hardening & Security Implementation. Transitioned from naive subscription to a robust Double Opt-In system.

**Completed Features:**
1. **Threat Intelligence Feed & Export Engine (Completed & Frozen):**
   - Replaced all frontend-mocked intelligence with real, database-backed fields.
   - Expanded `ThreatItem` schema with enterprise parameters (`cveId`, `impact`, `affectedAlgorithms`).
   - Hardened database outage handling to explicitly return 500 status rather than mocking empty arrays.
   - Re-architected CSV and PDF exporters to render highly-structured executive reports dynamically containing new database fields.
   
2. **Double Opt-In Newsletter System:**
   - Generates 32-byte secure crypto tokens upon subscription.
   - Saves users in DB as `verified: false`.
   - Sends modern, dark-mode verification emails via Nodemailer.
   - Activates subscription upon token verification (`/api/threats/verify`).
2. **Multi-Layered Security Architecture:**
   - Honeypot implementation to trap bots.
   - Zod validation for buffer overflow and format protection.
   - Redis-backed rate limiting.
   - `disposable-email-domains` integration (30,000+ blocklist).
   - DNS MX record validation.
   - **Cloudflare Turnstile (Invisible CAPTCHA):** Integrated via custom middleware (`turnstile.middleware.ts`) onto `/login` and `/register` endpoints to block credential stuffing and brute-force attacks at the edge.
3. **Enterprise Unsubscribe Flow:**
   - CSP-compliant native HTML feedback form rendered from the backend.
   - Records unsubscribe reasons ("too many emails", "not relevant") directly to `UnsubscribeFeedback` Prisma model.
4. **Automated Threat Intelligence Reporting Engine:**
   - PDFKit in-memory generation of Weekly Threat Summaries and Monthly Compliance Reports.
   - Nodemailer automated dispatches based on `UserPreference` subscriptions.
   - **Production Hardened Execution:**
     - `withRedisLock`: Distributed cron locking using ownership tokens to prevent duplicate overlaps across clustered pods.
     - `take/skip` Cursor Pagination: Bounded O(1) memory footprint during massive user list iterations.
     - Deterministic Idempotency: `@@unique([userId, reportType, reportPeriod])` composite constraints to eliminate cron jitter bypasses.
     - Exponential Backoff Retries: Built-in `withRetry` for transient SMTP faults.
     - Deterministic Priority Sorting: Pre-mapped severity weights to ensure PDF capacity constraints only slice the highest priority vulnerabilities.

**Important Design Decisions:**
- **CSP Compliance via Native Forms:** Initially, the unsubscribe form used `fetch()` with inline JavaScript. This was blocked by `helmet`'s strict Content-Security-Policy. *Decision:* Rewrote the flow to use native `<form method="POST">` to submit data, bypassing CSP restrictions while maintaining enterprise security.
- **Graceful DNS Failures:** `dns.promises.resolveMx` was implemented to block fake domains. However, local environments/ISPs sometimes block Node's direct DNS queries, returning `ECONNREFUSED`. *Decision:* Modified the catch block to strictly reject only on `ENOTFOUND` or `ENODATA`. Network errors are logged but allowed to pass to prevent blocking real users.
- **Double Opt-In vs SMTP VRFY:** Rejected the idea of real-time SMTP mailbox verification (checking if a specific Gmail exists) because major providers block `RCPT TO` harvesting (Directory Harvest Attacks) by always returning 200 OK. *Decision:* Rely entirely on the cryptographic Double Opt-In link to guarantee email ownership.

**Database Decisions:**
- Introduced `UnsubscribeFeedback` model to separate churn analytics from active subscriptions.
- Expanded `ThreatItem` model to include `affectedAlgorithms`, `impact`, `recommendation`, and `cveId` for strict backend-controlled intelligence.
- ThreatSubscriptions contain a `severityThreshold` and `verificationToken`.

**Rejected Approaches:**
- **Hardcoded Disposable Emails:** Initially tested with 15 hardcoded temp domains. Rejected in favor of the `disposable-email-domains` NPM package to ensure long-term robustness.
- **Inline JS for Server-Rendered Views:** Rejected due to XSS vulnerabilities and Helmet middleware conflicts.

**Known Limitations & Technical Debt:**
- The email system currently runs synchronously in the Express request cycle. During high load, `nodemailer.sendMail` could block the event loop or cause slow responses. *Tech Debt:* Move email dispatching to a background queue (e.g., BullMQ with Redis).
- Endpoints currently rely on `.env` SMTP credentials. Production may require an API-based provider (Resend, SendGrid) for better deliverability.

**Future Ideas & Improvements:**
- Build an Admin Dashboard to visualize data from the `UnsubscribeFeedback` model (Pie charts for churn reasons).
- Implement the "Cryptography Scanner" (Feature 2 in schema) to parse URLs/code for legacy crypto algorithms.
- JWT implementation for deeper authentication flows.
