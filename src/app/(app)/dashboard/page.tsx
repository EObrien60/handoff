"use client";

import { useAuth } from "@gate/web-sdk";

type GateUser = { sub: string; email: string };

/**
 * Placeholder staff dashboard. Its only job right now is to prove the gate
 * session works end to end: we read the authenticated user and can sign out.
 * The real requests-by-status inbox lands here next.
 */
export default function DashboardPage() {
  const { user, logout } = useAuth<GateUser>();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Handoff</h1>
        <button
          onClick={() => logout()}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Sign out
        </button>
      </header>

      <section className="rounded-lg border border-neutral-200 p-6">
        <p className="text-sm text-neutral-500">Signed in as</p>
        <p className="text-base font-medium">{user?.email ?? "—"}</p>
      </section>

      <p className="text-sm text-neutral-500">
        Your requests inbox will appear here.
      </p>
    </main>
  );
}
