import { type ReactNode } from "react";
import { type HandoffClient, type HandoffClientConfig } from "./client";
import { type HandoffTheme } from "./theme";
import type { Customer, RequestSummary, Org } from "./types";
export interface HandoffProviderProps extends HandoffClientConfig {
    theme?: Partial<HandoffTheme>;
    children: ReactNode;
}
/**
 * Provides a configured {@link HandoffClient} and theme to the component tree.
 * Auth-agnostic: pass `getToken` returning whatever bearer token your app uses
 * (e.g. a gate access token).
 */
export declare function HandoffProvider({ theme, children, ...config }: HandoffProviderProps): import("react").JSX.Element;
export declare function useHandoff(): HandoffClient;
export declare function useHandoffTheme(): HandoffTheme;
/** Generic async-resource hook used by the data hooks below. */
export declare function useAsync<T>(fn: () => Promise<T>, deps?: unknown[]): {
    data: T | null;
    error: Error | null;
    loading: boolean;
    reload: () => void;
};
export declare function useCustomers(): {
    data: Customer[] | null;
    error: Error | null;
    loading: boolean;
    reload: () => void;
};
export declare function useRequests(): {
    data: RequestSummary[] | null;
    error: Error | null;
    loading: boolean;
    reload: () => void;
};
export declare function useOrg(): {
    data: Org | null;
    error: Error | null;
    loading: boolean;
    reload: () => void;
};
