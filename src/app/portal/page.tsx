"use client";

import Link from "next/link";
import { Badge, Card, Spinner } from "@/components/ui";
import { usePortalResource } from "@/lib/portal-api";
import { statusMeta } from "@/lib/request-status";
import type { RequestListItem } from "@/lib/types";

export default function PortalHome() {
  const { data, loading, error } = usePortalResource<RequestListItem[]>("/api/portal/requests");

  if (loading && !data) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }
  if (error) {
    return (
      <Card className="p-8 text-center">
        <h1 className="font-display text-xl text-ink">Please open your latest link</h1>
        <p className="mt-2 text-sm text-muted">Your session isn&rsquo;t active. Open the most recent email link to continue.</p>
      </Card>
    );
  }

  const requests = data ?? [];
  const open = requests.filter((r) => r.status !== "completed");
  const done = requests.filter((r) => r.status === "completed");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl tracking-tight text-ink">Your requests</h1>
        <p className="mt-1 text-sm text-muted">Everything your provider needs from you, in one place.</p>
      </div>

      <Section title="To do" items={open} emptyLabel="Nothing outstanding — you're all caught up." />
      {done.length > 0 && <Section title="Completed" items={done} />}
    </div>
  );
}

function Section({ title, items, emptyLabel }: { title: string; items: RequestListItem[]; emptyLabel?: string }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">{title}</h2>
      {items.length === 0 ? (
        emptyLabel ? <p className="text-sm text-muted">{emptyLabel}</p> : null
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const done = r.items.filter((i) => i.status === "completed").length;
            const meta = statusMeta[r.status];
            return (
              <Link key={r.id} href={`/portal/r/${r.id}`}>
                <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
                  <div>
                    <p className="font-medium text-ink">{r.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{done}/{r.items.length} done</p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
