# Handoff

**The client workspace that kills the email chase.**

> Stop chasing clients for documents. One link, everything you need, in your brand.

Handoff is an opinionated, self-serve B2B SaaS: a beautiful client workspace that
replaces the email / Dropbox / attachment chaos between a service business and its
clients. A firm builds a **Request** — a checklist of things to upload, questions to
answer, and documents to approve — and sends one link. The client completes it from
their phone with no password and no app. The firm watches it come in, in one place.

It is **not** a CRM, an ERP, a form builder, or a "build anything" platform. It does
one thing exceptionally well and refuses to do the other fifty.

**Status:** MVP complete and verified end to end (all 11 build phases — see
[`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md)). Ships with a reusable dashboarding SDK,
[`@handoff/sdk`](packages/sdk).

---

## Table of contents

- [Why it exists](#why-it-exists)
- [The two experiences](#the-two-experiences)
- [Core concepts & domain model](#core-concepts--domain-model)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API reference](#api-reference)
- [The dashboarding SDK](#the-dashboarding-sdk-handoffsdk)
- [Security & tenant isolation](#security--tenant-isolation)
- [Testing & verification](#testing--verification)
- [Deploying to production](#deploying-to-production)
- [Roadmap](#roadmap)
- [Deliberately excluded](#deliberately-excluded)
- [Documentation index](#documentation-index)

---

## Why it exists

Every service business eventually drowns in the same emails:

> *"Can you send me the bank statement?" · "Did you get my receipts?" · "Can you approve this?" · "Any update?"*

Email is the worst possible tool for **getting the right things from a client, on time,
with sign-off** — and that is the one job Handoff does. Value lands in under ten minutes
and doesn't depend on branding, a custom domain, or a long relationship to prove itself.

**Beachhead:** bookkeeping, accounting, and fractional-finance firms (1–20 staff,
10–150 recurring clients). The relationship is inherently monthly, so retention is built
into the business model. The architecture is vertical-agnostic — it ports to agencies,
law firms, and consultants; only the default templates and marketing bend.

**What makes it different**

- **Opinionated, not configurable.** No drag-and-drop, no page builder, no workflow
  engine. You answer a few questions; the workspace is excellent by default.
- **Beautiful by default.** The client should think *"this is where I deal with this
  company,"* never *"I'm using portal software."*
- **Frictionless for the client.** Magic-link access, no password, mobile-perfect. The
  bar is: easier than replying to an email.
- **10× simpler and cheaper** than horizontal incumbents (Copilot, SuiteDash, TaxDome).

---

## The two experiences

Handoff is really two apps sharing one backend and tenant model.

### 1. The staff app (`/`, `/dashboard`, `/clients`, …)

Firm staff sign in through **gate** SSO. They add clients, build requests from scratch
or from templates, send them, watch the requests-by-status inbox, review submissions,
download uploaded files, and manage branding + billing.

### 2. The client portal (`/portal`)

A **white-labelled**, password-free surface for the firm's clients. A client opens a
single-use magic link from an email, lands in a workspace branded with the firm's name
and accent colour, and completes their checklist — uploading files, answering questions,
approving documents — from any device. No Handoff branding, no account to create.

### The end-to-end loop (verified in a real browser)

```
Firm signs in via gate  →  onboards (creates Organisation)  →  adds a Client + Contact
        →  builds a Request (upload / question / approval items)  →  sends it
        →  Contact is emailed a single-use magic link
        →  Contact opens the branded portal  →  uploads / answers / approves
        →  Request auto-advances to "submitted"  →  firm is emailed
        →  firm reviews the file, marks it "completed"
```

---

## Core concepts & domain model

Five user-facing concepts. That's the whole product.

| Concept | What it is |
| --- | --- |
| **Organisation** | The tenant — a firm. Owns branding, subdomain, subscription, staff. |
| **Member** | A staff user at the firm. Roles: `owner` (adds billing + branding + members) and `member`. Authenticates via gate SSO. |
| **Customer** | A client the firm serves (a company or individual). |
| **Contact** | A person who logs into a Customer's workspace via magic link. |
| **Request** | The unit of work: an ordered checklist of `upload` / `question` / `approval` **Items**. |

Supporting: **Request Templates** (reusable skeletons, e.g. "Monthly close"), **Files**
(uploaded against request items or shared per customer), **auth tokens** (hashed
single-use contact magic links), and **notifications** (email; in-app is future).

The source of truth is [`src/db/schema.ts`](src/db/schema.ts).

```
Organisation 1─* Member
Organisation 1─* Customer 1─* Contact
Organisation 1─* RequestTemplate
Customer     1─* Request 1─* RequestItem ─* File
Customer     1─* File            (shared files area)
Contact      1─* AuthToken       (single-use magic links)
```

### Lifecycles

```
Organisation:  trialing → active → past_due → cancelled
Customer:      active → archived                 (never hard-deleted)
Request:       draft → sent → in_progress → submitted → completed   (+ cancelled)
RequestItem:   pending → completed              (+ changes_requested for approvals)
```

A Request auto-advances to `in_progress` on the first completed item and to `submitted`
once every item is done; the firm then marks it `completed`.

---

## Architecture

### Two auth populations, two mechanisms

Handoff has two kinds of user with very different needs, so it uses two auth systems.
See [`docs/AUTH.md`](docs/AUTH.md) for the full write-up.

| Who | Mechanism | Why |
| --- | --- | --- |
| **Members** (staff) | **gate SSO** — OAuth2 + PKCE, EdDSA JWTs | Real accounts, single sign-on across apps. This is exactly what [`gate`](../gate) is for. |
| **Contacts** (clients) | **Tenant-scoped magic link** + signed session cookie | Frictionless, no account, no password. gate has no tenant concept and always creates an account, so it's the wrong fit here. |

```
                         ┌──────────────────────────────┐
   staff browser  ──────▶│  gate SSO server (OAuth2/PKCE)│
     (GateProvider,      │  issues EdDSA JWT + JWKS      │
      @gate/web-sdk)     └──────────────┬───────────────┘
        │  Bearer <gate access token>   │ verify via JWKS
        ▼                                ▼
   ┌─────────────────────────────────────────────────────┐
   │  Handoff (Next.js)                                    │
   │   /api/*        staff routes  → memberFromRequest()   │
   │                 gate sub → Member → Organisation      │
   │   /api/portal/* client routes → contact cookie        │
   │   /c/[token]    consume magic link → set cookie       │
   │   Drizzle ── every query scoped by organisationId     │
   │            ── contact queries also by customerId      │
   └─────────────────────────────────────────────────────┘
        │                         │                   │
        ▼                         ▼                   ▼
     Postgres              Object storage        Transactional email
   (Drizzle ORM)        (disk in dev, S3 later)   (dev → .mail/, Resend later)
```

- **Staff request flow:** the browser holds the gate token (localStorage, via
  `@gate/web-sdk`) and sends it as `Authorization: Bearer …` to `/api/*`. Route handlers
  verify it against gate's JWKS (`@gate/verify`) and resolve the gate `sub` to a Member.
- **Contact request flow:** opening `/c/<token>` consumes a single-use, hashed,
  15-minute token and mints an HMAC-signed, httpOnly session cookie carrying the tenant
  scope (contact + customer + org). `/api/portal/*` reads that cookie.
- **Pluggable seams:** `Storage` (local disk → S3/R2), `Mailer` (dev → Resend/SES), and
  `Billing` (dev stub → Stripe Checkout) are interfaces with dev implementations and a
  clear production drop-in.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS 4** — refined "editorial-utilitarian" design system (warm paper, ink
  text, deep-teal accent; Fraunces display + Hanken Grotesk UI fonts)
- **Postgres** + **Drizzle ORM** — single database, shared schema, mandatory tenant scoping
- **Auth:** [`@gate/web-sdk`](../gate) (staff) + custom magic-link (clients)
- **Vitest** for unit tests; **Playwright** used to verify flows end to end
- Consumed as local `file:` deps: `@gate/verify`, `@gate/web-sdk` (sibling `../gate` repo)

Deliberately boring and proven. The cleverness budget is spent on the Request UX and
tenant isolation, not the plumbing.

---

## Project structure

```
handoff/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # public landing (the 30-second pitch)
│   │   ├── layout.tsx                   # root layout, fonts, design tokens
│   │   ├── providers.tsx                # client GateProvider wrapper
│   │   ├── (app)/                       # staff app — gated behind gate SSO
│   │   │   ├── layout.tsx               #   GateProvider → RequireAuth → MemberProvider → AppShell
│   │   │   ├── _components/             #   app shell, member provider, onboarding
│   │   │   ├── dashboard/               #   requests-by-status inbox
│   │   │   ├── clients/                 #   list + [id] detail (contacts, requests)
│   │   │   ├── requests/new + [id]/     #   request builder + detail (send/complete)
│   │   │   ├── templates/               #   reusable request templates
│   │   │   ├── files/ · settings/       #   files (stub) · branding + billing
│   │   │   └── sdk-demo/                #   dashboard rendered entirely with @handoff/sdk
│   │   ├── portal/                      # client (Contact) portal — white-labelled
│   │   │   ├── layout.tsx               #   per-org branding shell (server component)
│   │   │   ├── page.tsx · r/[id]/       #   request list + completion UI
│   │   │   └── expired/                 #   expired-link screen
│   │   ├── c/[token]/route.ts           # magic-link landing → sets contact session
│   │   ├── billing/confirm/route.ts     # dev checkout confirmation
│   │   └── api/                         # route handlers (see API reference)
│   ├── db/
│   │   ├── schema.ts                    # the domain model (source of truth)
│   │   └── index.ts                     # Drizzle client
│   ├── lib/
│   │   ├── principal.ts                 # Principal union + tenant-scope assertions (NFR #1)
│   │   ├── gate.ts                      # verify gate token → MemberPrincipal
│   │   ├── tokens.ts                    # magic-link token primitives (hash, TTL)
│   │   ├── contact-session.ts           # signed contact session cookie
│   │   ├── route.ts · portal-route.ts   # withMember / withContact route wrappers
│   │   ├── storage.ts · mail.ts · billing.ts   # pluggable seams (dev impls)
│   │   ├── api.ts · portal-api.ts · use-resource.ts   # client fetch layers + hooks
│   │   ├── repos/                       # tenant-scoped data access (one file per aggregate)
│   │   └── tenancy.test.ts              # isolation + token unit tests
│   └── components/ui.tsx                # Button/Card/Input/Modal/Badge/… UI kit
├── packages/
│   └── sdk/                             # @handoff/sdk — dashboarding SDK for other apps
├── docs/
│   ├── SPEC.md · ROADMAP.md · AUTH.md · BUILD_PLAN.md
├── drizzle.config.ts · docker-compose.yml · .env.example
```

---

## Local development

Handoff depends on the sibling **gate** repo (`../gate`) for staff SSO. The commands
below stand up the whole stack. (Node ≥ 20, pnpm, Docker required.)

### 1. Database

One Postgres container hosts both the `gate` and `handoff` databases:

```bash
docker run -d --name handoff-stack-pg \
  -e POSTGRES_USER=dev -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=postgres \
  -p 5544:5432 postgres:16-alpine
docker exec handoff-stack-pg psql -U dev -d postgres -c "CREATE DATABASE gate;"
docker exec handoff-stack-pg psql -U dev -d postgres -c "CREATE DATABASE handoff;"
```

> Or use the bundled `docker-compose.yml` (handoff DB only, port 5544).

### 2. gate SSO server (in `../gate`)

```bash
cd ../gate && pnpm install
DATABASE_URL="postgres://dev:dev@localhost:5544/gate" pnpm migrate
# register Handoff as an OAuth client:
docker exec handoff-stack-pg psql -U dev -d gate -c \
  "INSERT INTO clients (id,name,redirect_uris,type) VALUES ('handoff','Handoff',ARRAY['http://localhost:3001/dashboard'],'public') ON CONFLICT (id) DO UPDATE SET redirect_uris=EXCLUDED.redirect_uris;"
# run it on :4000 (gate defaults to :3000)
DATABASE_URL="postgres://dev:dev@localhost:5544/gate" ISSUER="http://localhost:4000" \
  PORT=4000 COOKIE_SECURE=false GATE_CORS_ORIGINS="http://localhost:3001" \
  GATE_SIGNING_KEY_FILE=".gate-signing-key.json" pnpm dev:server
```

> gate's `@gate/verify` must export its built `dist` (a one-line fix in
> `../gate/packages/verify/package.json` — `exports["."].import` → `./dist/index.js`).
> Rebuild gate packages with `pnpm --filter @gate/web-sdk build` after changes.

### 3. Handoff app

```bash
cd ../bored/handoff
pnpm install
cp .env.example .env.local          # then edit — see the env table below
pnpm db:push                        # push the schema to the handoff database
pnpm dev --port 3001                # http://localhost:3001
```

Open http://localhost:3001, click **Start free trial / Sign in**, create an account on
the gate login page (or `POST /signup` to gate), and you'll land in onboarding.

**Magic links in dev:** sending a request writes the client's email (with the link) to
`handoff/.mail/` and logs it to the console — grab the `/c/<token>` URL from there.

---

## Environment variables

Copy `.env.example` → `.env.local`. `db:*` scripts load it via dotenv; Next loads it automatically.

| Variable | Purpose | Dev value |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection | `postgresql://dev:dev@localhost:5544/handoff` |
| `APP_URL` | Public base URL (used in emails/links) | `http://localhost:3001` |
| `GATE_ISSUER` | gate server URL (server-side JWT verify) | `http://localhost:4000` |
| `NEXT_PUBLIC_GATE_ISSUER` | gate server URL (browser SDK) | `http://localhost:4000` |
| `NEXT_PUBLIC_GATE_CLIENT_ID` | OAuth client id registered in gate | `handoff` |
| `NEXT_PUBLIC_GATE_REDIRECT_URI` | OAuth redirect back to Handoff | `http://localhost:3001/dashboard` |
| `HANDOFF_SESSION_SECRET` | HMAC secret for contact session cookies | any long random string |
| `MAIL_TRANSPORT` | `dev` writes emails to `.mail/` | `dev` |
| `STRIPE_SECRET_KEY` | (optional) enables real billing; unset → dev stub | — |

---

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Next dev server (`--port 3001` in this setup) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests |
| `pnpm db:push` | Push the Drizzle schema to Postgres |
| `pnpm db:generate` | Generate SQL migrations |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm --filter @handoff/sdk build` | Build the SDK to `dist` |

---

## API reference

All staff routes require `Authorization: Bearer <gate access token>` and are scoped to
the caller's Organisation. All portal routes require the contact session cookie and are
scoped to the caller's Customer.

### Staff (`/api/*`)

| Method & path | Purpose |
| --- | --- |
| `GET /api/me` | Resolve the acting Member (401 if not onboarded) |
| `POST /api/onboarding` | Create the Organisation + owner Member (first login) |
| `GET /api/org` · `PATCH /api/org` | Read / update branding (name, accent, logo) — owner only |
| `GET /api/customers` · `POST /api/customers` | List / create clients |
| `GET /api/customers/[id]` · `PATCH /api/customers/[id]` | Get / archive a client |
| `POST /api/customers/[id]/contacts` | Add a contact to a client |
| `GET /api/requests` · `POST /api/requests` | List / create requests (with items) |
| `GET /api/requests/[id]` | Request detail (items + files) |
| `PATCH /api/requests/[id]` | `action`: `send` \| `cancel` \| `complete` |
| `GET /api/templates` · `POST /api/templates` | List / create request templates |
| `GET /api/files/[id]` | Stream an uploaded file (org-scoped) |
| `POST /api/billing/checkout` | Start a plan checkout (owner only) |

### Client portal (`/api/portal/*`, `/c/*`)

| Method & path | Purpose |
| --- | --- |
| `GET /c/[token]` | Consume a magic link → set session → redirect into the portal |
| `GET /api/portal/requests` | List the contact's client-visible requests |
| `GET /api/portal/requests/[id]` | Request detail for completion |
| `POST /api/portal/items/[id]/answer` | Answer a question item |
| `POST /api/portal/items/[id]/approve` | Approve / request changes on an approval item |
| `POST /api/portal/items/[id]/upload` | Upload a file to an upload item (multipart) |

---

## The dashboarding SDK (`@handoff/sdk`)

A standalone, buildable package ([`packages/sdk`](packages/sdk)) so any app can embed a
Handoff-backed dashboard. It's **auth-agnostic** (pass a `getToken`) and its components
are **self-styled** (inline styles, no Tailwind required in the consumer).

```tsx
import { HandoffProvider, RequestInbox, StatGrid, StatTile, useRequests } from "@handoff/sdk";

<HandoffProvider baseUrl="https://app.yourfirm.com" getToken={() => auth.getAccessToken()} theme={{ accent: "#0d5c4f" }}>
  <RequestInbox onOpen={(r) => router.push(`/requests/${r.id}`)} />
</HandoffProvider>
```

Exports a typed client (`createHandoffClient`), React bindings (`useHandoff`,
`useCustomers`, `useRequests`, `useOrg`), and components (`DashboardShell`,
`StatGrid`/`StatTile`, `DataTable`, `StatusBadge`, `RequestInbox`). It's dogfooded in
this repo at `/sdk-demo`, which renders a full dashboard from the SDK against the live
API. See [`packages/sdk/README.md`](packages/sdk/README.md).

---

## Security & tenant isolation

Tenant isolation is the #1 non-functional requirement — a cross-tenant leak is
company-ending.

- Every row carries `organisationId`; every query is scoped by it at the repo boundary.
- Contact queries are **additionally** scoped by `customerId`.
- The `Principal` type ([`src/lib/principal.ts`](src/lib/principal.ts)) centralises the
  checks (`assertCanAccess`, `assertIsOwner`, `assertIsMember`) so they can't be
  forgotten in ad-hoc `where` clauses. These are covered by unit tests.
- Magic-link tokens are stored as SHA-256 hashes only, are single-use, and expire in 15
  minutes. Contact session cookies are HMAC-signed, httpOnly, and carry only the tenant scope.
- Object-storage keys are tenant/customer-scoped; downloads pass an org-scoped access check.

---

## Testing & verification

```bash
pnpm test                 # Vitest: tenant isolation + token lifecycle (14 tests)
pnpm exec tsc --noEmit    # typecheck
pnpm build                # production build
```

Every build phase was additionally verified by driving the real app in a browser
(Playwright) — from gate login through a client completing a request to the firm marking
it complete. The phase-by-phase log is in [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md).

---

## Deploying to production

Handoff runs anywhere Next.js does. For production, swap the dev seams:

- **Postgres:** a managed instance (Neon/Supabase/RDS); set `DATABASE_URL`, run `pnpm db:migrate`.
- **gate:** deploy the gate server, set a persistent `GATE_SIGNING_KEY`, register the
  Handoff client with your production redirect URI, and point `GATE_ISSUER` /
  `NEXT_PUBLIC_GATE_ISSUER` at it.
- **Email:** implement a Resend/SES `Mailer` in `src/lib/mail.ts` and configure SPF/DKIM
  (deliverability is the product's nervous system).
- **Storage:** implement an S3/R2 `Storage` in `src/lib/storage.ts`.
- **Billing:** set `STRIPE_SECRET_KEY` and implement Stripe Checkout + webhook behind the
  `Billing` interface (`src/lib/billing.ts`); the dev confirm route disables itself.
- **White-label:** subdomains today; custom domains + white-label email are Phase 2.

---

## Roadmap

- **MVP (done):** auth, Org/Customer/Contact, Requests + items + templates, branded client
  portal, email notifications, self-serve billing, dashboarding SDK.
- **Phase 2:** custom domains, white-label email (SPF/DKIM), **Payments** (Stripe
  Connect — pay in-portal), Projects as an optional grouping layer.
- **Phase 3:** e-signature, scheduling integration, SSO for larger clients, public API +
  webhooks, a second vertical.

Full detail in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Deliberately excluded

Website/page/form builders · workflow engine · generic database · CRM/pipeline ·
accounting/ERP · ticketing · internal project management · chat app · "build anything."

Every one of these is how a sharp six-concept product decays into an average fifty-concept
platform. The answer is no.

---

## Documentation index

| Doc | What's in it |
| --- | --- |
| [`docs/SPEC.md`](docs/SPEC.md) | Full product spec — vision, ICP, pricing, requirements, risks |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | MVP scope, phases, and what's excluded |
| [`docs/AUTH.md`](docs/AUTH.md) | gate SSO + magic-link auth architecture and local run steps |
| [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) | Phase-by-phase build log (all 11 complete) |
| [`packages/sdk/README.md`](packages/sdk/README.md) | The dashboarding SDK |
