"use client";

import { PageHeader } from "../_components/app-shell";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Requests" description="Everything you're waiting on, and everything that's come in." />
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center">
        <p className="font-display text-xl text-ink">No requests yet</p>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Add a client and send your first request to stop chasing documents over email.
        </p>
      </div>
    </>
  );
}
