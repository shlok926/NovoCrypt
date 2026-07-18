# CONTEXT.md

# Current Working Memory

**What is happening RIGHT NOW?**
The development phase focused on securing the Newsletter Subscription (Part 1) and Verification/Unsubscribe flows (Part 2) has successfully concluded. The system is stable, secure, and actively rejecting bots and disposable emails while elegantly handling user unsubscriptions and feedback collection. The user has paused the session for the day and indicated that they will resume tomorrow to address the "remaining options B and C of security and Part 2."

**Current Sprint:**
Authentication Security Hardening (Cloudflare Turnstile).

**Current Objective:**
Successfully integrated Cloudflare Turnstile into the `auth.routes.ts` (Login/Register) endpoints to prevent credential stuffing and brute-force attacks.

**Files Recently Modified:**
- `backend/.env` (Added Turnstile Secret Key).
- `backend/src/config/env.ts` (Added Zod validation for Turnstile key).
- `backend/src/middleware/turnstile.middleware.ts` (Created server-to-server Cloudflare verification).
- `backend/src/routes/auth.routes.ts` (Applied middleware to /login and /register).

**Recent Architectural Changes:**
- Removed inline JavaScript from backend-rendered HTML to comply with `helmet` Content-Security-Policy.
- Added a new database table `UnsubscribeFeedback` via Prisma and pushed the schema directly to the database.

**Pending TODO / Remaining Work:**
- Apply Turnstile Site Key on the React Frontend Login/Register forms.
- Integrate the Admin Analytics Dashboard for visualizing `UnsubscribeFeedback` (Future Scope).
- Begin work on Threat Intelligence Feed API.

**Deployment Status:**
- Local Development environment.
- Backend running on `http://localhost:5000`.
- Database synchronized and Prisma client generated successfully (`v6.19.3`).

**What should the next AI do FIRST?**
1. Read `AGENT.md` to understand the security constraints (especially CSP rules and DNS handling).
2. Ask the user to define what "Options B and C of security" entail, as this was left as an implicit objective for the next session.
3. Validate that `npm run dev` is actively running and database connections are stable before initiating new code modifications.
