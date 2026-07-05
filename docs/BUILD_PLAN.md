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
- [~] **7. Notifications** — email on send DONE (dev transport → .mail/).
  In-app + "submitted" notification to firm still to do.
- [x] **8. Branding** — DONE. Client portal white-labelled per-org (accent +
  name + logo). Owner-only settings UI edits name/accent/logo (/api/org).
- [ ] **9. Billing** — Stripe subscription model (dev-stubbed provider).
- [x] **10. Landing page** — DONE. Public 30-second pitch (hero, "daily tax",
  3 steps, pricing) → CTA into gate login. Verified rendering in-browser.
- [ ] **11. Dashboarding SDK** — `@handoff/sdk`: gate-authed React dashboard
  primitives + typed API client, so other apps can embed a handoff dashboard.

## Status notes
- (start) Foundation + gate SSO wiring committed. Beginning Phase 0.
