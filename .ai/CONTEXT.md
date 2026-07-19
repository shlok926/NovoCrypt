# CONTEXT.md

# Current Working Memory

**What is happening RIGHT NOW?**
The development of the Threat Intelligence Feed and Export Modules has successfully concluded. The system is stable, securely handling edge cases (like DB outages returning proper 500 errors instead of empty fallbacks), and cleanly exporting enterprise-grade CSVs and PDFs with genuine database-backed data.

**Current Sprint:**
Threat Intelligence Module (Completed & Frozen).

**Current Objective:**
Develop the Dashboard Executive Reporting Engine. This will act as NovoCrypt's enterprise USP, combining multiple security modules into an executive-ready report that scales naturally with future growth.

**Files Recently Modified:**
- `backend/src/services/threats.service.ts` (Removed mocks, hardened DB outage error handling)
- `backend/prisma/schema.prisma` (Added `affectedAlgorithms`, `impact`, `recommendation`, `cveId` to `ThreatItem`)
- `backend/src/routes/reports.routes.ts` (Enterprise-grade CSV/PDF formatting and export fields)
- `frontend/src/pages/ThreatFeed.tsx` (Handled nullable fields, dynamic UI fallbacks)
- `frontend/src/services/threatMigrationService.ts` (Stripped fake array injections, cleaned data mappings)
- `frontend/src/types/threat-migration.types.ts` (Typed nullable response fields)
- `frontend/src/pages/components/SearchAndExport.tsx` (Added robust error boundary toasts and dynamic filenames)

**Recent Architectural Changes:**
- Introduced `node-cron` for autonomous scheduled tasks (Threat Ingestion & Automated Reporting).
- Integrated Redis for high-speed caching on public feed routes (`/api/threats/feed`).
- Standardized WebSocket event `threat:alert` for real-time frontend notifications on critical/high severity threats.
- Added `UserPreference` and `ReportAudit` via Prisma for automated email tracking.
- Orchestrated robust PDF dispatching system utilizing `pdfkit` and `nodemailer` completely in-memory (no temp files).
- Hardened report orchestration with distributed Redis locking, cursor pagination, exponential retries, and strict chronological idempotency constraints.
- Added a new database table `UnsubscribeFeedback` via Prisma and pushed the schema directly to the database.

**Pending TODO / Remaining Work:**
- Build the Dashboard Executive Reporting Engine.
- Apply Turnstile Site Key on the React Frontend Login/Register forms.
- Integrate the Admin Analytics Dashboard for visualizing `UnsubscribeFeedback` (Future Scope).

**Deployment Status:**
- Local Development environment.
- Backend running on `http://localhost:5000`.
- Database synchronized and Prisma client generated successfully (`v6.19.3`).

**What should the next AI do FIRST?**
1. Read `AGENT.md` to understand the security constraints.
2. Review the requirements for the Dashboard Executive Reporting Engine.
3. Assist the user in designing and scaffolding the new executive report aggregator.
