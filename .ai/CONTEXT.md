# CONTEXT.md

# Current Working Memory

**What is happening RIGHT NOW?**
The development phase focused on securing the Newsletter Subscription (Part 1) and Verification/Unsubscribe flows (Part 2) has successfully concluded. The system is stable, secure, and actively rejecting bots and disposable emails while elegantly handling user unsubscriptions and feedback collection. The user has paused the session for the day and indicated that they will resume tomorrow to address the "remaining options B and C of security and Part 2."

**Current Sprint:**
Threat Intelligence Feed API Implementation (Completed).

**Current Objective:**
Successfully completed the Automated Threat Reporting Engine (Weekly/Monthly summaries) and concluded the Production Hardening phase (Idempotency, Pagination, Redis token locking).

**Files Recently Modified:**
- `backend/src/jobs/cron.ts` (Created cron job to fetch external threats and broadcast alerts).
- `backend/src/index.ts` (Hooked up cron jobs to start on boot).
- `backend/src/services/threats.service.ts` (Added Redis caching logic to `getThreatFeed`).
- `backend/src/config/websocket.ts` (Added `broadcastThreatAlert` function).
- `backend/src/config/env.ts` (Added Zod validation for `CRON_THREAT_FETCH`).
- `frontend/src/hooks/useWebSocket.ts` (Added `threat_alert` event listener).
- `frontend/src/pages/Dashboard.tsx` (Integrated 'Live Threat Radar' widget and real-time sliding 'Emergency Banner').
- `backend/src/services/email.service.ts` (Added Nodemailer configuration).
- `backend/src/services/pdf/*.ts` (Added PDFKit generation logic).
- `backend/src/services/report.service.ts` (Created reporting orchestrator).
- `backend/prisma/schema.prisma` (Added `UserPreference` and `ReportAudit` tables).

**Recent Architectural Changes:**
- Introduced `node-cron` for autonomous scheduled tasks (Threat Ingestion & Automated Reporting).
- Integrated Redis for high-speed caching on public feed routes (`/api/threats/feed`).
- Standardized WebSocket event `threat:alert` for real-time frontend notifications on critical/high severity threats.
- Added `UserPreference` and `ReportAudit` via Prisma for automated email tracking.
- Orchestrated robust PDF dispatching system utilizing `pdfkit` and `nodemailer` completely in-memory (no temp files).
- Hardened report orchestration with distributed Redis locking, cursor pagination, exponential retries, and strict chronological idempotency constraints.
- Added a new database table `UnsubscribeFeedback` via Prisma and pushed the schema directly to the database.

**Pending TODO / Remaining Work:**
- Apply Turnstile Site Key on the React Frontend Login/Register forms.
- Integrate the Admin Analytics Dashboard for visualizing `UnsubscribeFeedback` (Future Scope).
- Expand `/threat-feed` full-page with advanced filtering capabilities (Currently standard implementation).

**Deployment Status:**
- Local Development environment.
- Backend running on `http://localhost:5000`.
- Database synchronized and Prisma client generated successfully (`v6.19.3`).

**What should the next AI do FIRST?**
1. Read `AGENT.md` to understand the security constraints (especially CSP rules and DNS handling).
2. Assist the user with migrating this robust orchestrator to BullMQ when they are ready (Phase 2), as the architecture is already fully decoupled.
3. Validate that `npm run dev` is actively running and database connections are stable before initiating new code modifications.
