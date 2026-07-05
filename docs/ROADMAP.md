# Handoff — Roadmap

## MVP (~4 weeks, one engineer + AI)

The whole product is one loop:

1. Firm owner signs up (magic link, no card for trial).
2. Adds a Customer + a Contact.
3. Creates a **Request** — a checklist of upload / question / approval items (optionally
   from a Template).
4. Contact gets an email → clicks magic link → completes items on their phone.
5. Firm sees everything done in one place. The email chase is dead.

### Build order
- **Week 1** — Multi-tenant auth (magic link both sides), Org/Customer/Contact CRUD,
  tenant-scoped query layer.
- **Week 2** — Requests: builder (upload / question / approval items), client-facing
  completion view, file upload to object storage.
- **Week 3** — Firm dashboard (requests-by-status inbox), client workspace, notifications
  (email + in-app), reusable Request Templates.
- **Week 4** — Branding (logo + accent, applied to client view + emails), Stripe
  subscription billing, empty states, polish, launch.

### In scope
Orgs, Members (owner/member), Customers, Contacts, Requests + Items + Templates, Files
(shared + request-attached), magic-link auth, email + in-app notifications, subdomain per
org, branding (logo + accent), Stripe subscriptions.

## Phase 2 (months 2–3)
- Custom domains + white-label email (SPF/DKIM)
- **Payments** — Stripe Connect, invoice + pay-in-portal (the second wedge)
- **Projects** — optional grouping layer over Requests

## Phase 3 (months 4–6)
- E-signature
- Scheduling integration (Cal.com / Calendly)
- SSO for larger clients
- Public API + webhooks
- Second vertical (law firms or agencies — architecture already ports)

## Later
- Integrations marketplace (QuickBooks / Xero — deep vertical lock-in)
- Client-facing mobile app (only if data demands it)
- Horizontal "customer workspace OS" — *earned* by winning narrow first

## Deliberately excluded (staying excluded)
Drag-and-drop / page / website builders · workflow engine · generic database ·
CRM/pipeline · accounting/ERP · ticketing · internal project management · chat app ·
"build anything." These are how a six-concept product decays into a fifty-concept
platform. The answer is no.
