"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageHeader } from "../../_components/app-shell";
import { Button, Card, Field, Input, Modal, Spinner, Badge } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { statusMeta } from "@/lib/request-status";
import type { Customer, RequestListItem } from "@/lib/types";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: customer, loading, reload } = useResource<Customer>(`/api/customers/${id}`);
  const { data: requests } = useResource<RequestListItem[]>("/api/requests");
  const [addOpen, setAddOpen] = useState(false);

  if (loading && !customer) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!customer) return null;

  const theirRequests = (requests ?? []).filter((r) => r.customer.id === id);

  return (
    <>
      <PageHeader
        title={customer.name}
        description="Client workspace overview."
        action={
          <Link href={`/requests/new?customer=${id}`}>
            <Button>New request</Button>
          </Link>
        }
      />

      <div className="grid gap-8 p-8 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">Requests</h2>
          {theirRequests.length ? (
            <div className="space-y-2">
              {theirRequests.map((r) => {
                const meta = statusMeta[r.status];
                const done = r.items.filter((i) => i.status === "completed").length;
                return (
                  <Link key={r.id} href={`/requests/${r.id}`}>
                    <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
                      <div>
                        <p className="font-medium text-ink">{r.title}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {done}/{r.items.length} items done
                        </p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-6 text-sm text-muted">
              No requests yet.{" "}
              <Link href={`/requests/new?customer=${id}`} className="text-brand underline">
                Create one
              </Link>{" "}
              to collect what you need.
            </Card>
          )}
        </section>

        <aside>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">Contacts</h2>
            <button onClick={() => setAddOpen(true)} className="text-sm font-medium text-brand hover:underline">
              Add
            </button>
          </div>
          <Card className="divide-y divide-line">
            {customer.contacts.length ? (
              customer.contacts.map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-ink">{c.name || c.email}</p>
                  {c.name && <p className="text-xs text-muted">{c.email}</p>}
                </div>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-muted">No contacts yet. Add one to send requests.</p>
            )}
          </Card>
        </aside>
      </div>

      <AddContactModal
        open={addOpen}
        customerId={id}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          void reload();
        }}
      />
    </>
  );
}

function AddContactModal({
  open,
  customerId,
  onClose,
  onCreated,
}: {
  open: boolean;
  customerId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const api = useApi();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      await api(`/api/customers/${customerId}/contacts`, {
        method: "POST",
        json: { email: email.trim(), name: name.trim() || undefined },
      });
      setEmail("");
      setName("");
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add contact">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" />
        </Field>
        <Field label="Name" hint="Optional.">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!email.trim() || busy}>
            {busy ? <Spinner className="border-t-white" /> : "Add contact"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
