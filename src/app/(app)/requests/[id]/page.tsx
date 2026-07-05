"use client";

import { use, useState } from "react";
import { PageHeader } from "../../_components/app-shell";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { statusMeta, itemTypeMeta } from "@/lib/request-status";
import type { RequestDetail } from "@/lib/types";

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

  async function act(action: "send" | "cancel") {
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
          ) : (
            <Badge tone={meta.tone}>{meta.label}</Badge>
          )
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-6 p-8">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            {done}/{request.items.length} completed
          </span>
          {request.status !== "draft" && request.status !== "cancelled" && (
            <button onClick={() => act("cancel")} className="text-danger hover:underline" disabled={busy}>
              Cancel request
            </button>
          )}
        </div>

        <Card className="divide-y divide-line">
          {request.items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-5 py-4">
              <StatusDot done={item.status === "completed"} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="mt-0.5 text-xs text-faint">{itemTypeMeta[item.type].label}</p>
                {item.status === "completed" && item.response != null && (
                  <ItemResponse type={item.type} response={item.response} />
                )}
              </div>
            </div>
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

function StatusDot({ done }: { done: boolean }) {
  return (
    <span
      className={
        done
          ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-white"
          : "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-line-strong"
      }
    >
      {done && (
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function ItemResponse({ type, response }: { type: string; response: Record<string, unknown> }) {
  if (type === "question" && typeof response.answer === "string") {
    return <p className="mt-1 rounded-md bg-surface-2 px-3 py-2 text-sm text-ink">{response.answer}</p>;
  }
  if (type === "approval" && typeof response.decision === "string") {
    return <p className="mt-1 text-xs font-medium text-ok">{response.decision === "approved" ? "Approved" : "Changes requested"}</p>;
  }
  return null;
}
