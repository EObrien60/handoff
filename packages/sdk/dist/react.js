import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { createHandoffClient } from "./client";
import { withTheme } from "./theme";
const HandoffContext = createContext(null);
/**
 * Provides a configured {@link HandoffClient} and theme to the component tree.
 * Auth-agnostic: pass `getToken` returning whatever bearer token your app uses
 * (e.g. a gate access token).
 */
export function HandoffProvider({ theme, children, ...config }) {
    const value = useMemo(() => ({ client: createHandoffClient(config), theme: withTheme(theme) }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.baseUrl, theme?.accent]);
    return _jsx(HandoffContext.Provider, { value: value, children: children });
}
export function useHandoff() {
    const ctx = useContext(HandoffContext);
    if (!ctx)
        throw new Error("useHandoff must be used within <HandoffProvider>");
    return ctx.client;
}
export function useHandoffTheme() {
    return useContext(HandoffContext)?.theme ?? withTheme();
}
/** Generic async-resource hook used by the data hooks below. */
export function useAsync(fn, deps = []) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const run = useCallback(() => {
        setLoading(true);
        fn()
            .then((d) => {
            setData(d);
            setError(null);
        })
            .catch((e) => setError(e))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    useEffect(run, [run]);
    return { data, error, loading, reload: run };
}
export function useCustomers() {
    const client = useHandoff();
    return useAsync(() => client.listCustomers(), [client]);
}
export function useRequests() {
    const client = useHandoff();
    return useAsync(() => client.listRequests(), [client]);
}
export function useOrg() {
    const client = useHandoff();
    return useAsync(() => client.getOrg(), [client]);
}
