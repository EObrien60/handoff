"use client";

import { useState } from "react";
import { PageHeader } from "../_components/app-shell";
import { Button, Card, EmptyState, Field, Input, Modal, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { itemTypeMeta } from "@/lib/request-status";
import type { ItemType, Template } from "@/lib/types";

export default function TemplatesPage() {
  const { data, loading, reload } = useResource<Template[]>("/api/templates");
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Templates"
        description="Reusable request checklists — build once, send to every client."
        action={<Button onClick={() => setOpen(true)}>New template</Button>}
      />
      <div className="p-8">
        {loading && !data ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : data && data.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((t) => (
              <Card key={t.id} className="p-5">
                <p className="font-medium text-ink">{t.title}</p>
                <ul className="mt-2 space-y-1">
                  {t.items.map((it, i) => (
                    <li key={i} className="text-sm text-muted">
                      · {it.label}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No templates yet"
            description="Create a template like “Monthly close” so your next request takes seconds."
            action={<Button onClick={() => setOpen(true)}>New template</Button>}
          />
        )}
      </div>
      <NewTemplateModal open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); void reload(); }} />
    </>
  );
}

function NewTemplateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const api = useApi();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<{ type: ItemType; label: string }[]>([{ type: "upload", label: "" }]);
  const [busy, setBusy] = useState(false);

  const valid = items.filter((i) => i.label.trim());
  const canSubmit = title.trim() && valid.length > 0 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await api("/api/templates", {
        method: "POST",
        json: { title: title.trim(), items: valid.map((i) => ({ type: i.type, label: i.label.trim() })) },
      });
      setTitle("");
      setItems([{ type: "upload", label: "" }]);
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New template">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Template name">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Monthly close" />
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Items</p>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={it.type}
                  onChange={(e) =>
                    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, type: e.target.value as ItemType } : x)))
                  }
                  className="h-9 shrink-0 rounded-[var(--radius)] border border-line-strong bg-surface px-2 text-xs text-ink focus:border-brand focus:outline-none"
                >
                  {(["upload", "question", "approval"] as ItemType[]).map((t) => (
                    <option key={t} value={t}>
                      {itemTypeMeta[t].label}
                    </option>
                  ))}
                </select>
                <Input
                  value={it.label}
                  onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  placeholder="Bank statement"
                  className="h-9"
                />
                <button
                  type="button"
                  onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}
                  className={cn("shrink-0 rounded-md p-2 text-faint hover:text-danger", items.length === 1 && "invisible")}
                  aria-label="Remove"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setItems((xs) => [...xs, { type: "upload", label: "" }])}
            className="mt-2 text-sm font-medium text-brand hover:underline"
          >
            + Add item
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {busy ? <Spinner className="border-t-white" /> : "Create template"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
