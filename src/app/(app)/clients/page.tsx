"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "../_components/app-shell";
import { Button, Card, EmptyState, Field, Input, Modal, Spinner } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import type { Customer } from "@/lib/types";

export default function ClientsPage() {
  const { data, loading, reload } = useResource<Customer[]>("/api/customers");
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Clients"
        description="The businesses and people you work with."
        action={<Button onClick={() => setOpen(true)}>Add client</Button>}
      />

      <div className="p-8">
        {loading && !data ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <Card className="p-5 transition-shadow hover:shadow-md">
                  <p className="font-medium text-ink">{c.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {c.contacts.length} contact{c.contacts.length === 1 ? "" : "s"}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No clients yet"
            description="Add your first client, then send them a request to collect what you need."
            action={<Button onClick={() => setOpen(true)}>Add client</Button>}
          />
        )}
      </div>

      <AddClientModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          void reload();
        }}
      />
    </>
  );
}

function AddClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const api = useApi();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await api("/api/customers", { method: "POST", json: { name: name.trim() } });
      setName("");
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add client">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Client name" hint="A company or an individual.">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Ltd" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || busy}>
            {busy ? <Spinner className="border-t-white" /> : "Add client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
