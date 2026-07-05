"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useApi, ApiError } from "@/lib/api";
import { Spinner } from "@/components/ui";
import { Onboarding } from "./onboarding";

export type Member = {
  memberId: string;
  organisationId: string;
  role: "owner" | "member";
};

const MemberContext = createContext<Member | null>(null);

export function useMember(): Member {
  const m = useContext(MemberContext);
  if (!m) throw new Error("useMember must be used within MemberProvider");
  return m;
}

type State = { status: "loading" } | { status: "onboarding" } | { status: "member"; member: Member };

/**
 * Resolves the acting Member from /api/me. RequireAuth guarantees a gate
 * session already, so a 401 here means "authenticated but not yet onboarded" →
 * show the onboarding form. Otherwise provide the Member to the app.
 */
export function MemberProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    try {
      const member = await api<Member>("/api/me");
      setState({ status: "member", member });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setState({ status: "onboarding" });
      } else {
        // Transient/network — retry once shortly.
        setTimeout(() => void load(), 1500);
      }
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (state.status === "onboarding") {
    return <Onboarding onDone={() => void load()} />;
  }
  return <MemberContext.Provider value={state.member}>{children}</MemberContext.Provider>;
}
