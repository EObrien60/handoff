"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@gate/web-sdk";
import { Providers } from "../providers";

/**
 * Layout for the staff-facing app. Everything under (app) requires a gate
 * session; unauthenticated visitors are redirected to the gate login page.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <RequireAuth fallback={<CenteredMessage>Signing you in…</CenteredMessage>}>
        {children}
      </RequireAuth>
    </Providers>
  );
}

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-8 text-sm text-neutral-500">
      {children}
    </div>
  );
}
