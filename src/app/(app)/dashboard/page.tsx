"use client";

import Link from "next/link";
import { PageHeader } from "../_components/app-shell";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import { statusMeta, inboxOrder } from "@/lib/request-status";
import type { RequestListItem, RequestStatus } from "@/lib/types";

export default function DashboardPage() {
  const { data, loading } = useResource<RequestListItem[]>("/api/requests");

  if (loading && !data) {
    return <div className="flex flex-1 items-center justify-center"><Spinner /></div>;
  }

  const requests = data ?? [];

  if (requests.length === 0) {
    return (
      <>
        <PageHeader title="Requests" description="Everything you're waiting on, and everything that's come in." />
        <EmptyState
          title="No requests yet"
          description="Add a client and send your first request to stop chasing documents over email."
          action={
            <Link href="/clients">
              <Button>Go to clients</Button>
            </Link>
          }
        />
      </>
    );
  }

  const grouped = inboxOrder
    .map((status) => ({ status, items: requests.filter((r) => r.status === status) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader
        title="Requests"
        description="Everything you're waiting on, and everything that's come in."
        action={
          <Link href="/requests/new">
            <Button>New request</Button>
          </Link>
        }
      />
      <div className="space-y-8 p-8">
        {grouped.map((group) => (
          <section key={group.status}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
                {statusMeta[group.status as RequestStatus].label}
              </h2>
              <span className="text-xs text-faint">{group.items.length}</span>
            </div>
            <div className="space-y-2">
              {group.items.map((r) => {
                const done = r.items.filter((i) => i.status === "completed").length;
                const meta = statusMeta[r.status];
                return (
                  <Link key={r.id} href={`/requests/${r.id}`}>
                    <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{r.title}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {r.customer.name} · {done}/{r.items.length} done
                        </p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
