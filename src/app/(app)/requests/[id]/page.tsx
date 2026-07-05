"use client";

import { use, useState } from "react";
import { PageHeader } from "../../_components/app-shell";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { useApi, useDownload } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { statusMeta, itemTypeMeta } from "@/lib/request-status";
import type { RequestDetail, RequestItem } from "@/lib/types";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const api = useApi();
  const { data: request, loading, reload } = useResource<RequestDetail>(`/api/requests/${id}`);
  const [busy, setBusy] = useState(false);

  if (loading && !request) {
    return <div className="flex flex-1 items-center justify-center"><Spinner /></div>;
  }
  if (!request) return null;

  const meta = statusMeta[request.status];
  const done = request.items.filter((i) => i.status === "completed").length;

  async function act(action: "send" | "cancel" | "complete") {
    setBusy(true);
    try {
      await api(`/api/requests/${id}`, { method: "PATCH", json: { action } });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={request.title}
        description={`For ${request.customer.name}`}
        action={
          request.status === "draft" ? (
            <Button onClick={() => act("send")} disabled={busy}>
              {busy ? <Spinner className="border-t-white" /> : "Send to client"}
            </Button>
          ) : request.status === "submitted" ? (
            <Button onClick={() => act("complete")} disabled={busy}>
              {busy ? <Spinner className="border-t-white" /> : "Mark complete"}
            </Button>
          ) : (
            <Badge tone={meta.tone}>{meta.label}</Badge>
          )
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-6 p-8">
        <div className="flex items-center justify-between text-sm text-muted">
          <span className="flex items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {done}/{request.items.length} completed
          </span>
          {request.status !== "draft" && request.status !== "cancelled" && request.status !== "completed" && (
            <button onClick={() => act("cancel")} className="text-danger hover:underline" disabled={busy}>
              Cancel request
            </button>
          )}
        </div>

        <Card className="divide-y divide-line">
          {request.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </Card>

        {request.customer.contacts.length === 0 && request.status !== "draft" && (
          <Card className="border-warn/40 bg-[#f6eddb]/40 p-4 text-sm text-warn">
            This client has no contacts yet, so no one can open the request. Add a contact on the client page.
          </Card>
        )}
      </div>
    </>
  );
}

function ItemRow({ item }: { item: RequestItem }) {
  const download = useDownload();
  const complete = item.status === "completed";

  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span
        className={
          complete
            ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-white"
            : "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-line-strong"
        }
      >
        {complete && (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{item.label}</p>
        <p className="mt-0.5 text-xs text-faint">{itemTypeMeta[item.type].label}</p>

        {item.type === "question" && typeof item.response?.answer === "string" && (
          <p className="mt-2 rounded-md bg-surface-2 px-3 py-2 text-sm text-ink">{item.response.answer}</p>
        )}
        {item.type === "approval" && typeof item.response?.decision === "string" && (
          <p className="mt-1 text-xs font-medium text-ok">
            {item.response.decision === "approved" ? "Approved" : "Changes requested"}
          </p>
        )}
        {item.type === "upload" && item.files && item.files.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.files.map((f) => (
              <button
                key={f.id}
                onClick={() => download(`/api/files/${f.id}`)}
                className="flex items-center gap-2 text-sm text-brand hover:underline"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 3v5h5" />
                </svg>
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
