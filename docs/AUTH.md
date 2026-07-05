# Authentication

Handoff has two distinct user populations with different needs, so it uses two
auth mechanisms:

| Who | Mechanism | Why |
| --- | --- | --- |
| **Members** (firm staff) | **gate SSO** (OAuth2 + PKCE) | Real accounts, single sign-on across our apps, JWT-based. This is exactly what [`gate`](../../gate) is for. |
| **Contacts** (clients) | **Tenant-scoped magic link** | Frictionless, no account, no password — "easier than replying to an email." gate has no tenant/customer concept and always creates an account, so it's the wrong fit here. |

## Members via gate

- **Client:** `src/app/(app)/layout.tsx` wraps the staff app in `GateProvider`
  (`src/app/providers.tsx`) and `RequireAuth`. `useAuth()` exposes the user,
  `login()`, `logout()`, and `getAccessToken()`.
- **Server:** route handlers verify the bearer token with `@gate/verify` via
  `src/lib/gate.ts` → `memberFromRequest(req)`, which resolves the gate `sub`
  claim to a Member (and therefore an Organisation + role). See
  `src/app/api/me/route.ts` for the reference pattern.
- **Linking:** each Member row stores `gateUserId` (the gate `sub`). The gate
  `sub` is globally unique, so it maps to exactly one Member in the MVP model.

### Running gate locally

`gate` is a sibling repo (`../../gate`). Its packages are consumed via `file:`
dependencies (`@gate/verify`, `@gate/web-sdk`).

```bash
# in ../../gate
pnpm install
pnpm db:up && pnpm migrate
# register handoff as a client (edit packages/server/src/seed.ts or call seedClients):
#   { id: "handoff", name: "Handoff", redirectUris: ["http://localhost:3001/dashboard"] }
pnpm seed
GATE_CORS_ORIGINS=http://localhost:3001 pnpm dev:server   # gate on :3000
```

Then run handoff on a different port so it doesn't clash with gate's `:3000`:

```bash
# in handoff
pnpm dev --port 3001
```

Set `handoff/.env.local` from `.env.example`: `GATE_ISSUER` and
`NEXT_PUBLIC_GATE_ISSUER` → `http://localhost:3000`, `NEXT_PUBLIC_GATE_CLIENT_ID`
→ `handoff`, `NEXT_PUBLIC_GATE_REDIRECT_URI` → `http://localhost:3001/dashboard`.

> If a gate package changes, rebuild it (`pnpm --filter @gate/web-sdk build`) so
> handoff picks up the new `dist`.

## Contacts via magic link

Contact tokens are handled entirely within handoff (`src/lib/tokens.ts` +
`auth_tokens` table): a high-entropy raw token is emailed, only its SHA-256 hash
is stored, tokens are single-use with a 15-minute TTL, and access is scoped to
the contact's own Customer. This path is being built out next.
