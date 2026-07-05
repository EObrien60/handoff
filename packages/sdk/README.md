# @handoff/sdk

Dashboarding SDK for [Handoff](../../README.md). A typed, **auth-agnostic** API
client plus **self-styled** React dashboard primitives — drop a Handoff-backed
dashboard into any app with no Tailwind or CSS import required.

## Install

```bash
pnpm add @handoff/sdk react
```

## Quick start

```tsx
import {
  HandoffProvider,
  RequestInbox,
  StatGrid,
  StatTile,
  useRequests,
} from "@handoff/sdk";

function Dashboard() {
  return (
    <HandoffProvider
      baseUrl="https://app.yourfirm.com"
      getToken={async () => myAuth.getAccessToken()} // gate token, JWT, anything
      theme={{ accent: "#0d5c4f" }}
    >
      <Overview />
    </HandoffProvider>
  );
}

function Overview() {
  const { data: requests = [] } = useRequests();
  return (
    <>
      <StatGrid>
        <StatTile label="Open requests" value={requests.length} />
      </StatGrid>
      <RequestInbox onOpen={(r) => router.push(`/requests/${r.id}`)} />
    </>
  );
}
```

## What's in the box

**Client (framework-agnostic)**
- `createHandoffClient({ baseUrl, getToken, fetchImpl })` — typed methods:
  `listCustomers`, `createCustomer`, `getCustomer`, `addContact`,
  `listRequests`, `getRequest`, `createRequest`, `sendRequest`,
  `completeRequest`, `getOrg`, plus a `request()` escape hatch.
- `HandoffApiError` with `.status`.

**React bindings**
- `<HandoffProvider baseUrl getToken theme>` — provides the client + theme.
- `useHandoff()` → the client. `useHandoffTheme()` → the theme.
- Data hooks: `useCustomers()`, `useRequests()`, `useOrg()`, and a generic
  `useAsync(fn, deps)` — each returns `{ data, error, loading, reload }`.

**Components** (inline-styled, theme-aware)
- `<DashboardShell brand nav>` — sidebar layout.
- `<StatGrid>` / `<StatTile label value hint>` — KPI tiles.
- `<DataTable columns rows onRowClick empty>` — generic table.
- `<StatusBadge status>` — request-status pill.
- `<RequestInbox onOpen>` — a complete requests-by-status inbox, wired to the API.

## Auth-agnostic by design

The SDK never assumes an auth provider. `getToken` returns whatever bearer token
your Handoff deployment accepts (Handoff staff auth uses [gate](../../../gate)
SSO, so you'd return a gate access token). The token is fetched before every
request, so transparent refresh just works.

## Theming

Pass `theme={{ accent: "#…" }}` (and optionally `ink`, `surface`, `line`,
`radius`, `fontFamily`, …) to `HandoffProvider`. Components read it from context,
so one accent colour brands the whole dashboard.
