"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "../../_components/app-shell";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { itemTypeMeta } from "@/lib/request-status";
import type { Customer, ItemType, Template } from "@/lib/types";

type DraftItem = { type: ItemType; label: string };

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><Spinner /></div>}>
      <NewRequestInner />
    </Suspense>
  );
}

function NewRequestInner() {
  const api = useApi();
  const router = useRouter();
  const params = useSearchParams();
  const { data: customers } = useResource<Customer[]>("/api/customers");
  const { data: templates } = useResource<Template[]>("/api/templates");

  const [customerId, setCustomerId] = useState(params.get("customer") ?? "");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ type: "upload", label: "" }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!customerId && customers?.length === 1) setCustomerId(customers[0].id);
  }, [customers, customerId]);

  function addItem(type: ItemType) {
    setItems((xs) => [...xs, { type, label: "" }]);
  }
  function updateItem(i: number, label: string) {
    setItems((xs) => xs.map((it, j) => (j === i ? { ...it, label } : it)));
  }
  function removeItem(i: number) {
    setItems((xs) => xs.filter((_, j) => j !== i));
  }
  function applyTemplate(t: Template) {
    if (!title) setTitle(t.title);
    setItems(t.items.map((it) => ({ type: it.type, label: it.label })));
  }

  const validItems = items.filter((it) => it.label.trim());
  const canSubmit = customerId && title.trim() && validItems.length > 0 && !busy;

  async function create(send: boolean) {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const request = await api<{ id: string }>("/api/requests", {
        method: "POST",
        json: {
          customerId,
          title: title.trim(),
          items: validItems.map((it) => ({ type: it.type, label: it.label.trim() })),
        },
      });
      if (send) {
        await api(`/api/requests/${request.id}`, { method: "PATCH", json: { action: "send" } });
      }
      router.push(`/requests/${request.id}`);
    } catch {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="New request" description="Build a checklist of what you need from your client." />

      <div className="mx-auto w-full max-w-2xl space-y-6 p-8">
        {templates && templates.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted">Start from a template</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-sm text-ink hover:bg-surface-2"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <Card className="space-y-5 p-6">
          <Field label="Client">
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-10 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
              <option value="">Select a client…</option>
              {(customers ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Request title" hint="What the client will see, e.g. “August books”.">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="August books" />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Checklist</p>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-20 shrink-0 rounded-md px-2 py-1 text-center text-xs font-medium",
                      it.type === "upload" && "bg-brand-tint text-brand-ink",
                      it.type === "question" && "bg-[#f6eddb] text-warn",
                      it.type === "approval" && "bg-[#e6f0e8] text-ok",
                    )}
                  >
                    {itemTypeMeta[it.type].label}
                  </span>
                  <Input
                    value={it.label}
                    onChange={(e) => updateItem(i, e.target.value)}
                    placeholder={
                      it.type === "upload"
                        ? "Bank statement for August"
                        : it.type === "question"
                          ? "Any purchases over $5k?"
                          : "Approve the draft P&L"
                    }
                  />
                  <button
                    onClick={() => removeItem(i)}
                    className="shrink-0 rounded-md p-2 text-faint hover:bg-surface-2 hover:text-danger"
                    aria-label="Remove item"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <AddButton onClick={() => addItem("upload")}>+ Upload</AddButton>
              <AddButton onClick={() => addItem("question")}>+ Question</AddButton>
              <AddButton onClick={() => addItem("approval")}>+ Approval</AddButton>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={() => create(false)} disabled={!canSubmit}>
            Save draft
          </Button>
          <Button onClick={() => create(true)} disabled={!canSubmit}>
            {busy ? <Spinner className="border-t-white" /> : "Create & send"}
          </Button>
        </div>
      </div>
    </>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-[var(--radius)] border border-dashed border-line-strong px-3 py-1.5 text-sm font-medium text-muted hover:border-brand hover:text-brand"
    >
      {children}
    </button>
  );
}
