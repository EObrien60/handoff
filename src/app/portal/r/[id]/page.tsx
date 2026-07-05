"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Spinner, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { portalApi, usePortalResource } from "@/lib/portal-api";
import { statusMeta } from "@/lib/request-status";
import type { RequestDetail, RequestItem } from "@/lib/types";

export default function PortalRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, reload } = usePortalResource<RequestDetail>(`/api/portal/requests/${id}`);

  if (loading && !data) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (error || !data) {
    return (
      <Card className="p-8 text-center">
        <h1 className="font-display text-xl text-ink">We couldn&rsquo;t open this request</h1>
        <p className="mt-2 text-sm text-muted">Please open the most recent link your provider sent you.</p>
      </Card>
    );
  }

  const done = data.items.filter((i) => i.status === "completed").length;
  const allDone = done === data.items.length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">← All requests</Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl tracking-tight text-ink">{data.title}</h1>
          <Badge tone={statusMeta[data.status].tone}>{statusMeta[data.status].label}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">{done} of {data.items.length} done</p>
      </div>

      {allDone && (
        <Card className="border-ok/30 bg-[#e6f0e8]/50 p-4 text-sm text-ok">
          All done — thank you! Your provider has been notified.
        </Card>
      )}

      <div className="space-y-3">
        {data.items.map((item) => (
          <ItemCard key={item.id} item={item} onChanged={reload} />
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item, onChanged }: { item: RequestItem; onChanged: () => void }) {
  const complete = item.status === "completed";
  return (
    <Card className={cn("p-5", complete && "opacity-70")}>
      <div className="flex items-start gap-3">
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
          <p className="font-medium text-ink">{item.label}</p>
          {!complete && (
            <div className="mt-3">
              {item.type === "upload" && <UploadControl item={item} onChanged={onChanged} />}
              {item.type === "question" && <QuestionControl item={item} onChanged={onChanged} />}
              {item.type === "approval" && <ApprovalControl item={item} onChanged={onChanged} />}
            </div>
          )}
          {complete && item.type === "question" && typeof item.response?.answer === "string" && (
            <p className="mt-2 rounded-md bg-surface-2 px-3 py-2 text-sm text-ink">{item.response.answer as string}</p>
          )}
          {complete && item.type === "approval" && (
            <p className="mt-1 text-xs font-medium text-ok">Approved</p>
          )}
          {complete && item.type === "upload" && <p className="mt-1 text-xs text-muted">Uploaded ✓</p>}
        </div>
      </div>
    </Card>
  );
}

function UploadControl({ item, onChanged }: { item: RequestItem; onChanged: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const form = new FormData();
      form.set("file", file);
      await portalApi(`/api/portal/items/${item.id}/upload`, { method: "POST", body: form });
      onChanged();
    } catch {
      setErr("Upload failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Spinner /> : "Choose file"}
      </Button>
      {err && <p className="mt-2 text-sm text-danger">{err}</p>}
    </div>
  );
}

function QuestionControl({ item, onChanged }: { item: RequestItem; onChanged: () => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!value.trim() || busy) return;
    setBusy(true);
    try {
      await portalApi(`/api/portal/items/${item.id}/answer`, { method: "POST", json: { answer: value.trim() } });
      onChanged();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea rows={2} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type your answer…" />
      <Button onClick={submit} disabled={!value.trim() || busy}>
        {busy ? <Spinner className="border-t-white" /> : "Submit answer"}
      </Button>
    </div>
  );
}

function ApprovalControl({ item, onChanged }: { item: RequestItem; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approved" | "changes_requested") {
    setBusy(true);
    try {
      await portalApi(`/api/portal/items/${item.id}/approve`, { method: "POST", json: { decision } });
      onChanged();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => decide("approved")} disabled={busy}>
        Approve
      </Button>
      <Button variant="secondary" onClick={() => decide("changes_requested")} disabled={busy}>
        Request changes
      </Button>
    </div>
  );
}
