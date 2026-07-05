"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@gate/web-sdk";
import { Providers } from "../providers";
import { Spinner } from "@/components/ui";
import { MemberProvider } from "./_components/member-provider";
import { AppShell } from "./_components/app-shell";

/**
 * Staff app layout. Composition:
 *   GateProvider  → gate SSO session (processes the OAuth callback)
 *   RequireAuth   → redirect to gate login if unauthenticated
 *   MemberProvider→ resolve the Member, or show onboarding
 *   AppShell      → sidebar chrome (only once a Member exists)
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <RequireAuth
        fallback={
          <div className="flex min-h-full flex-1 items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <MemberProvider>
          <AppShell>{children}</AppShell>
        </MemberProvider>
      </RequireAuth>
    </Providers>
  );
}
