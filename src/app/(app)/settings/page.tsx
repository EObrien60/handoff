"use client";

import { PageHeader } from "../_components/app-shell";
import { Card } from "@/components/ui";
import { useMember } from "../_components/member-provider";

export default function SettingsPage() {
  const member = useMember();
  return (
    <>
      <PageHeader title="Settings" description="Your workspace." />
      <div className="max-w-xl space-y-4 p-8">
        <Card className="p-6">
          <p className="text-sm text-faint">Role</p>
          <p className="font-medium text-ink capitalize">{member.role}</p>
        </Card>
        <p className="text-sm text-muted">Branding, billing, and team settings land here next.</p>
      </div>
    </>
  );
}
