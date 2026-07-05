# Handoff

**The client workspace that kills the email chase.**

> Stop chasing clients for documents. One link, everything you need, in your brand.

Handoff is an opinionated, self-serve B2B SaaS: a beautiful client workspace that
replaces the email / Dropbox / attachment chaos between a service business and its
clients. It is **not** a CRM, an ERP, a form builder, or a "build anything" platform.
It does one thing exceptionally well and refuses to do the other fifty.

---

## The wedge

Every service business eventually drowns in the same emails:

> *"Can you send me the bank statement?" · "Did you get my receipts?" · "Can you approve this?" · "Any update?"*

Email is the worst possible tool for **getting the right things from a client, on time,
with sign-off** — and that is the one job Handoff does. A business creates a **Request**
(a checklist of things to upload, questions to answer, and documents to approve), sends
one link, and the client completes it from their phone with no password and no app.

Value is delivered in under 10 minutes and does not depend on branding, a custom domain,
or a long relationship to prove itself.

## Who it's for (launch beachhead)

Bookkeeping, accounting, and fractional-finance firms (1–20 staff, 10–150 recurring
clients). The relationship is **inherently monthly**, so retention is built into the
business model rather than bolted on. The architecture is vertical-agnostic — the
domain model ports to agencies, law firms, and consultants; only the default templates
and marketing bend.

## What makes it different

- **Opinionated, not configurable.** No drag-and-drop, no page builder, no workflow
  engine. You answer a few questions; the workspace is excellent by default.
- **Beautiful by default.** The client should think *"this is where I deal with this
  company,"* never *"I'm using portal software."*
- **Frictionless for the client.** Magic-link access, no password, mobile-perfect. The
  bar is: easier than replying to an email.
- **10× simpler and cheaper** than horizontal incumbents (Copilot, SuiteDash, TaxDome).

---

## Core concepts

Five user-facing concepts. That's the whole product.

| Concept | What it is |
| --- | --- |
| **Organisation** | The tenant — a firm. Owns branding, subdomain, subscription, staff. |
| **Member** | A staff user at the firm. Roles: `owner` (adds billing) and `member`. |
| **Customer** | A client the firm serves (a company or individual). |
| **Contact** | A person who logs into a Customer's workspace via magic link. |
| **Request** | The unit of work: a checklist of `upload` / `question` / `approval` items. |

Supporting: **Request Templates** (reusable skeletons — "Monthly close"), **Files**
(shared documents the firm gives outward), and **Notifications** (email + in-app, plumbing).

### Request lifecycle

```
draft → sent → in_progress → submitted → completed
                                   └──────────────→ cancelled
```

A Request is `completed` when every Item is resolved.

### The non-negotiable invariant

Everything is scoped by `organisationId`. Contact-facing queries are **additionally**
scoped by `customerId`. A contact can only ever see their own Customer's data. A
cross-tenant leak is company-ending — it is enforced in the query layer and tested
adversarially, never left to app-level trust.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Postgres** + **Drizzle ORM** (single database, shared schema, mandatory tenant scoping)
- Object storage for files (signed, expiring, tenant/customer-scoped URLs)
- **Auth:** staff (Members) via [`gate`](../gate) SSO (OAuth2 + PKCE); clients
  (Contacts) via tenant-scoped magic links. See [`docs/AUTH.md`](docs/AUTH.md).
- **Stripe** for firm subscriptions (payments *through* the portal is a later phase)

Deliberately boring and proven. The cleverness budget is spent on the Request UX and
tenant isolation, not the plumbing.

## Project structure

```
handoff/
├── src/
│   ├── app/
│   │   ├── (app)/        # staff app — gated behind gate SSO
│   │   │   ├── layout.tsx        # GateProvider + RequireAuth
│   │   │   └── dashboard/        # requests inbox (WIP)
│   │   ├── api/me/       # reference: verify gate token → Member
│   │   └── providers.tsx # client GateProvider wrapper
│   ├── db/
│   │   ├── schema.ts     # the domain model (source of truth)
│   │   └── index.ts      # Drizzle client
│   └── lib/
│       ├── gate.ts       # server-side gate token verify → MemberPrincipal
│       ├── principal.ts  # tenant-scope assertions (NFR #1)
│       └── tokens.ts     # contact magic-link primitives
├── docs/
│   ├── SPEC.md           # full product specification
│   ├── ROADMAP.md        # MVP scope + what's deliberately excluded
│   └── AUTH.md           # gate SSO + magic-link architecture
└── drizzle.config.ts
```

## Getting started

```bash
pnpm install
cp .env.example .env.local          # set DATABASE_URL
pnpm db:push                        # push schema to Postgres
pnpm dev                            # http://localhost:3000
```

## Roadmap (short version)

- **MVP (~4 weeks):** auth, Org/Customer/Contact, Requests + items + templates, branded
  client workspace, subdomain, email notifications, Stripe subscriptions.
- **Phase 2:** custom domains, white-label email, **Payments** (Stripe Connect), Projects.
- **Phase 3:** e-signature, scheduling integration, SSO, API/webhooks, second vertical.

See [`docs/SPEC.md`](docs/SPEC.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full picture.

## Deliberately excluded (and staying that way)

Website/page/form builders · workflow engine · generic database · CRM/pipeline ·
accounting/ERP · ticketing · internal project management · chat app · "build anything."

Every one of these is how a sharp six-concept product decays into an average
fifty-concept platform. The answer is no.
