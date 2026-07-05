"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "../_components/app-shell";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { useMember } from "../_components/member-provider";

type Org = {
  name: string;
  slug: string;
  status: string;
  accentColor: string | null;
  logoUrl: string | null;
  trialEndsAt: string | null;
};

export default function SettingsPage() {
  const member = useMember();
  const api = useApi();
  const { data, loading, reload } = useResource<Org>("/api/org");

  const [name, setName] = useState("");
  const [accent, setAccent] = useState("#0d5c4f");
  const [logoUrl, setLogoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setAccent(data.accentColor ?? "#0d5c4f");
      setLogoUrl(data.logoUrl ?? "");
    }
  }, [data]);

  if (loading && !data) {
    return <div className="flex flex-1 items-center justify-center"><Spinner /></div>;
  }

  const canEdit = member.role === "owner";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setSaved(false);
    try {
      await api("/api/org", {
        method: "PATCH",
        json: { name: name.trim(), accentColor: accent, logoUrl: logoUrl.trim() || null },
      });
      setSaved(true);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Your workspace and how clients see you." />
      <div className="max-w-xl space-y-6 p-8">
        {data?.status === "trialing" && (
          <Card className="border-brand/30 bg-brand-tint/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-brand-ink">
                You&rsquo;re on a free trial
                {data.trialEndsAt ? ` until ${new Date(data.trialEndsAt).toLocaleDateString()}` : ""}.
              </p>
              {canEdit && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const { url } = await api<{ url: string }>("/api/billing/checkout", {
                        method: "POST",
                        json: { plan: "firm" },
                      });
                      window.location.href = url;
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Upgrade
                </Button>
              )}
            </div>
          </Card>
        )}
        {data?.status === "active" && (
          <Card className="border-ok/30 bg-[#e6f0e8]/50 p-4 text-sm text-ok">Your subscription is active. Thank you!</Card>
        )}

        <Card className="p-6">
          <h2 className="font-display text-lg text-ink">Branding</h2>
          <p className="mt-1 text-sm text-muted">This is what your clients see in their workspace and emails.</p>

          <form onSubmit={save} className="mt-5 space-y-4">
            <Field label="Firm name">
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
            </Field>
            <Field label="Accent colour" hint="Used across the client-facing workspace.">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  disabled={!canEdit}
                  className="h-10 w-14 cursor-pointer rounded-[var(--radius)] border border-line-strong bg-surface"
                />
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} disabled={!canEdit} className="font-mono" />
              </div>
            </Field>
            <Field label="Logo URL" hint="Optional. A hosted image URL shown to clients.">
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" disabled={!canEdit} />
            </Field>
            {canEdit && (
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={busy}>
                  {busy ? <Spinner className="border-t-white" /> : "Save changes"}
                </Button>
                {saved && <span className="text-sm text-ok">Saved ✓</span>}
              </div>
            )}
            {!canEdit && <p className="text-sm text-faint">Only the workspace owner can edit branding.</p>}
          </form>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-faint">Your role</p>
          <p className="font-medium text-ink capitalize">{member.role}</p>
          <p className="mt-3 text-sm text-faint">Workspace subdomain</p>
          <p className="font-mono text-sm text-ink">{data?.slug}</p>
        </Card>
      </div>
    </>
  );
}
