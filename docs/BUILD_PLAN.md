# Build Plan & Progress Log

Autonomous build log. Updated as work proceeds so progress is visible at a glance.

## Local stack (dev ports)
- gate Postgres: `localhost:5432` (gate's own docker-compose)
- gate server: `localhost:4000` (`:3000` is taken by another project)
- handoff Postgres: `localhost:5433` (handoff docker-compose)
- handoff Next dev: `localhost:3001`
- Mail (dev): magic links + emails written to `.mail/` and logged to console

## Phases

- [x] **0. Auth E2E** — DONE. gate on :4000, handoff on :3001, shared Postgres on
  :5544, `handoff` client seeded. Verified in a real browser: `/dashboard` →
  gate login → back to handoff authenticated (see `handoff-auth-e2e.png`).
- [x] **1. Member onboarding** — DONE + verified in browser. First gate login
  with no Member shows an onboarding form → creates Organisation (14-day trial)
  + owner Member linked to the gate `sub`. Design system + app shell built.
- [x] **2. Data-access layer** — DONE. Tenant-scoped repos (customers, requests,
  templates) + withMember route wrapper + zod validation. All queries scoped by
  organisationId at the repo boundary.
- [x] **3. Customers & Contacts** — DONE + verified. List/create clients, client
  detail, add contacts.
- [x] **4. Requests** — DONE + verified. Builder (upload/question/approval),
  templates, lifecycle (draft→sent), requests-by-status inbox, request detail
  with send/cancel. Created & sent a real request in-browser.
- [x] **5. Client magic-link flow** — DONE + verified end to end. Sending a
  request emails each contact a single-use link → contact session cookie →
  branded portal → upload/answer/approve → auto-advances to "submitted" →
  firm marks complete. Full round-trip driven in-browser.
- [x] **6. Files & storage** — DONE. Pluggable Storage (local disk in dev),
  tenant-scoped keys, contact upload + org-checked staff download (verified).
- [x] **7. Notifications** — DONE (email both directions). Client emailed a
  magic link on send; firm emailed when a client completes a request
  (submitted transition). Dev transport → .mail/ + console. In-app bell: future.
- [x] **8. Branding** — DONE. Client portal white-labelled per-org (accent +
  name + logo). Owner-only settings UI edits name/accent/logo (/api/org).
- [x] **9. Billing** — DONE + verified. Pluggable Billing provider; dev stub
  gives a working self-serve upgrade (trial → active), verified in-browser.
  Real Stripe Checkout + webhook slots into the same seam when keys are set.
- [x] **10. Landing page** — DONE. Public 30-second pitch (hero, "daily tax",
  3 steps, pricing) → CTA into gate login. Verified rendering in-browser.
- [x] **11. Dashboarding SDK** — DONE + verified. `@handoff/sdk` (packages/sdk):
  auth-agnostic typed client + self-styled React dashboard primitives
  (DashboardShell, StatTile/StatGrid, DataTable, StatusBadge, RequestInbox) +
  data hooks. Dogfooded at /sdk-demo — the whole view renders from the SDK
  against the live API with the gate token. Builds to dist via tsc.

## Status notes
- (start) Foundation + gate SSO wiring committed. Beginning Phase 0.
- ✅ ALL 11 PHASES COMPLETE. The full loop is built and verified end to end in a
  real browser: staff sign in via gate → onboard → add client + contact → build
  and send a request → client opens a magic link → uploads/answers/approves in a
  branded portal → firm is notified, reviews the file, marks complete. Plus a
  landing page, per-org branding, self-serve billing (dev stub), and a
  dashboarding SDK (`@handoff/sdk`) dogfooded at /sdk-demo.
- Remaining polish (not blocking): real Stripe keys, in-app notification bell,
  custom domains + white-label email (Phase 2 roadmap), S3 storage impl.
