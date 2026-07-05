import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createHandoffClient, type HandoffClient, type HandoffClientConfig } from "./client";
import { withTheme, type HandoffTheme } from "./theme";
import type { Customer, RequestSummary, Org } from "./types";

interface HandoffContextValue {
  client: HandoffClient;
  theme: HandoffTheme;
}

const HandoffContext = createContext<HandoffContextValue | null>(null);

export interface HandoffProviderProps extends HandoffClientConfig {
  theme?: Partial<HandoffTheme>;
  children: ReactNode;
}

/**
 * Provides a configured {@link HandoffClient} and theme to the component tree.
 * Auth-agnostic: pass `getToken` returning whatever bearer token your app uses
 * (e.g. a gate access token).
 */
export function HandoffProvider({ theme, children, ...config }: HandoffProviderProps) {
  const value = useMemo<HandoffContextValue>(
    () => ({ client: createHandoffClient(config), theme: withTheme(theme) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.baseUrl, theme?.accent],
  );
  return <HandoffContext.Provider value={value}>{children}</HandoffContext.Provider>;
}

export function useHandoff(): HandoffClient {
  const ctx = useContext(HandoffContext);
  if (!ctx) throw new Error("useHandoff must be used within <HandoffProvider>");
  return ctx.client;
}

export function useHandoffTheme(): HandoffTheme {
  return useContext(HandoffContext)?.theme ?? withTheme();
}

/** Generic async-resource hook used by the data hooks below. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(() => {
    setLoading(true);
    fn()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  return { data, error, loading, reload: run };
}

export function useCustomers() {
  const client = useHandoff();
  return useAsync<Customer[]>(() => client.listCustomers(), [client]);
}

export function useRequests() {
  const client = useHandoff();
  return useAsync<RequestSummary[]>(() => client.listRequests(), [client]);
}

export function useOrg() {
  const client = useHandoff();
  return useAsync<Org>(() => client.getOrg(), [client]);
}
