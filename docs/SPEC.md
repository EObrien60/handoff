# Handoff — Product Specification

## Vision
A beautiful, opinionated client workspace that eliminates the email/Dropbox/attachment
chaos between a service business and its clients — starting with the thing email is worst
at: getting the right things *from* clients, on time, with sign-off.

## Positioning
> Stop chasing clients for documents. One link, everything you need, in your brand.

Category: client portal — entered through the *document-collection & approval* wedge, not
head-on against horizontal incumbents.

## ICP (launch)
Bookkeeping, accounting, and fractional-finance firms. 1–20 staff, 10–150 recurring
clients. Currently on email + shared drives or a heavy incumbent they resent. Buyer =
firm owner or ops lead. Pays on a company card. Never takes a sales call.

## Value proposition
- **Firm:** kill the "any update? did you get my email?" tax. See who owes you what in one
  glance. Reuse a template across every client.
- **Client:** one link, no password, no app, done in two minutes on their phone.

## Pricing hypotheses (test, don't marry)
- **Solo — $29/mo:** 1 seat, unlimited clients, subdomain + branding.
- **Firm — $79/mo:** up to 5 seats, templates, reminders, shared Files.
- **Studio — $199/mo:** unlimited seats, custom domain, full white-label email (Phase 2).

Price on seats + features, never on client count (that punishes your best customers and
taxes the two-sided adoption you need). Free trial, no card up front.

## Domain model
See [`src/db/schema.ts`](../src/db/schema.ts) for the source of truth.

- **Organisation** (tenant) 1─* **Member**
- **Organisation** 1─* **Customer** 1─* **Contact**
- **Organisation** 1─* **RequestTemplate**
- **Customer** 1─* **Request** 1─* **RequestItem** ─* **File**
- **Customer** 1─* **File** (shared Files area)

### Request item types
- `upload` — one or more files
- `question` — short/long text or choice
- `approval` — approve / request-changes on an attached file or text

### Lifecycles
- Organisation: `trialing → active → past_due → cancelled`
- Customer: `active → archived` (never hard-deleted)
- Request: `draft → sent → in_progress → submitted → completed` (+ `cancelled`)
- Item: `pending → completed` (+ `changes_requested` for approvals)

## Permission model (MVP — deliberately tiny)
- **Owner:** everything + billing + branding + members.
- **Member:** everything except billing/members.
- **Contact:** read/write only within their own Customer; complete request items, view
  shared Files. Never sees other Customers, firm internals, or other Contacts' PII.
- **Hard invariant:** every query scoped by `organisationId`; every Contact query also by
  `customerId`. Enforced at the data layer, tested adversarially.

## Multi-tenancy
Single Postgres database, shared schema, mandatory `organisationId` on every row and
query. Object storage keyed by tenant/customer path with signed, expiring URLs.

## White-labelling
Tiered: subdomain + logo + accent + no "powered-by" (MVP) → custom domain + white-label
email with proper SPF/DKIM (Phase 2). Invariant: a client never encounters *our* brand on
a paid plan.

## Authentication
Two populations, two mechanisms (see [`AUTH.md`](AUTH.md)):
- **Members (staff)** authenticate via the **gate** SSO server (OAuth2 + PKCE, JWT).
- **Contacts (clients)** use tenant-scoped, single-use magic links (no account).

## Functional requirements (MVP)
Multi-tenant orgs; gate SSO for staff + magic-link for clients; Customer/Contact management; Requests with
upload/question/approval items; request lifecycle + reminders; templates; per-Customer
shared Files; branded client workspace + emails; subdomain per org; email + in-app
notifications; Stripe subscription billing; audit trail on request events.

## Non-functional requirements
- **Tenant isolation is NFR #1** — data-layer enforced, adversarially tested.
- Mobile file upload reliability (large photos, flaky connections, resumable).
- Fast first paint on the client view (they judge the firm by it).
- Email deliverability (this *is* the product's nervous system — SPF/DKIM from day one).
- 99.9% target; daily backups; GDPR-ready export/delete.

## True-north metric
% of *sent* requests actually *completed* by clients. Not signups. This measures whether
the two-sided loop works.

## Risks
1. **Second-sided adoption** — clients ignore the link, reply by email anyway. Mitigated by
   magic-link + mobile-perfect completion + being easier than email.
2. **Incumbent (TaxDome/Liscio)** — firms may want the all-in-one and refuse a second tool.
3. **Wedge too thin** — collection alone may not sustain a subscription; mitigated by the
   recurring vertical and fast expansion into payments.
4. **Deliverability** — our emails ARE the product; a spam problem is an outage.
5. **Commoditization** — moat is workflow depth + integrations (QuickBooks/Xero), not the
   portal shell.

## Unknowns (resolve with ~10 customer conversations, not more building)
- Is *collection* the wedge, or is *payments / e-sign* the real must-have?
- Will clients tolerate even magic-link, or do they want zero-login links?
- Is $79/mo the right anchor, or do firms expect per-client billing they pass through?
- Is accounting the best beachhead, or a lower-competition adjacent vertical?
