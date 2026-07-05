"use client";

import { useAuth } from "@gate/web-sdk";
import { HandoffProvider, RequestInbox, StatGrid, StatTile, useRequests } from "@handoff/sdk";
import { PageHeader } from "../_components/app-shell";

/**
 * Dogfood page: this dashboard is built ENTIRELY from @handoff/sdk components,
 * talking to the same Handoff API through the SDK client, authed with the gate
 * token. It's the proof that the SDK works for external apps.
 */
export default function SdkDemoPage() {
  const { getAccessToken } = useAuth();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <PageHeader
        title="SDK demo"
        description="This view is rendered with @handoff/sdk — the same components any other app can install."
      />
      <div className="p-8">
        <HandoffProvider baseUrl={baseUrl} getToken={getAccessToken} theme={{ accent: "#0d5c4f" }}>
          <Inner />
        </HandoffProvider>
      </div>
    </>
  );
}

function Inner() {
  const { data } = useRequests();
  const reqs = data ?? [];
  const waiting = reqs.filter((r) => r.status === "sent" || r.status === "in_progress").length;
  const review = reqs.filter((r) => r.status === "submitted").length;
  const done = reqs.filter((r) => r.status === "completed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <StatGrid>
        <StatTile label="Total requests" value={reqs.length} />
        <StatTile label="Waiting on client" value={waiting} />
        <StatTile label="Ready to review" value={review} />
        <StatTile label="Completed" value={done} />
      </StatGrid>
      <RequestInbox />
    </div>
  );
}
