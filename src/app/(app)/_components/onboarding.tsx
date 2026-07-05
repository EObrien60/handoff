"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";

/**
 * Shown to a gate-authenticated user who has no Member yet. One question — the
 * firm's name — creates the Organisation and makes them its owner. No wizard.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const api = useApi();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/onboarding", { method: "POST", json: { organisationName: name.trim() } });
      onDone();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <p className="font-display text-2xl tracking-tight text-brand">Handoff</p>
        <h1 className="mt-6 font-display text-3xl leading-tight tracking-tight text-ink">
          Let&rsquo;s set up your workspace.
        </h1>
        <p className="mt-2 text-muted">
          What&rsquo;s the name of your firm? Your clients will see this.
        </p>

        <Card className="mt-6 p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Firm name" hint="e.g. Acme Bookkeeping">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Bookkeeping"
                maxLength={120}
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={!name.trim() || busy} className="w-full">
              {busy ? <Spinner className="border-t-white" /> : "Create workspace"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-faint">
          14-day free trial · no card required
        </p>
      </div>
    </div>
  );
}
