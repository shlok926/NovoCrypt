# CONTEXT.md

# Current Working Memory

**What is happening RIGHT NOW?**
The development phase focused on securing the Newsletter Subscription (Part 1) and Verification/Unsubscribe flows (Part 2) has successfully concluded. The system is stable, secure, and actively rejecting bots and disposable emails while elegantly handling user unsubscriptions and feedback collection. The user has paused the session for the day and indicated that they will resume tomorrow to address the "remaining options B and C of security and Part 2."

**Current Sprint:**
Threat Intelligence Feed API Implementation (Completed).

**Current Objective:**
Successfully implemented the Threat Intelligence Feed API architecture including `node-cron` data ingestion, Redis caching, and WebSocket real-time alerts.

**Files Recently Modified:**
- `backend/src/jobs/cron.ts` (Created cron job to fetch external threats and broadcast alerts).
- `backend/src/index.ts` (Hooked up cron jobs to start on boot).
- `backend/src/services/threats.service.ts` (Added Redis caching logic to `getThreatFeed`).
- `backend/src/config/websocket.ts` (Added `broadcastThreatAlert` function).
- `backend/src/config/env.ts` (Added Zod validation for `CRON_THREAT_FETCH`).
- `frontend/src/hooks/useWebSocket.ts` (Added `threat_alert` event listener).
- `frontend/src/pages/Dashboard.tsx` (Integrated 'Live Threat Radar' widget and real-time sliding 'Emergency Banner').

**Recent Architectural Changes:**
- Introduced `node-cron` for autonomous scheduled tasks (Threat Ingestion).
- Integrated Redis for high-speed caching on public feed routes (`/api/threats/feed`).
- Standardized WebSocket event `threat:alert` for real-time frontend notifications on critical/high severity threats.
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
2. Ask the user to define what "Options B and C of security" entail, as this was left as an implicit objective for the next session.
3. Validate that `npm run dev` is actively running and database connections are stable before initiating new code modifications.
