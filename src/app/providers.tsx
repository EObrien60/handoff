"use client";

import { GateProvider } from "@gate/web-sdk";
import type { ReactNode } from "react";

/**
 * Wraps the staff-facing app in gate SSO. GateProvider completes any in-flight
 * `?code=` redirect callback automatically, so mounting it at the root is all
 * the wiring needed — no router callback route required.
 *
 * Contacts (clients) never touch this; they authenticate via tenant-scoped
 * magic links handled separately.
 */
export function Providers({ children }: { children: ReactNode }) {
  const issuer = process.env.NEXT_PUBLIC_GATE_ISSUER;
  const clientId = process.env.NEXT_PUBLIC_GATE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GATE_REDIRECT_URI;

  if (!issuer || !clientId || !redirectUri) {
    throw new Error(
      "Missing gate config: set NEXT_PUBLIC_GATE_ISSUER, NEXT_PUBLIC_GATE_CLIENT_ID, NEXT_PUBLIC_GATE_REDIRECT_URI",
    );
  }

  return (
    <GateProvider config={{ issuer, clientId, redirectUri, scope: "openid profile" }}>
      {children}
    </GateProvider>
  );
}
