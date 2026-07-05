import type { Customer, Org, RequestSummary, NewRequestItem } from "./types";
export interface HandoffClientConfig {
    /** Base URL of the Handoff deployment, e.g. `https://app.handoff.example`. */
    baseUrl: string;
    /**
     * Returns a bearer token for the current user, or null. Auth-agnostic: pass
     * a gate access token, a session JWT, whatever your app uses. Called before
     * every request so it can refresh transparently.
     */
    getToken?: () => Promise<string | null> | string | null;
    /** Injectable fetch (tests/SSR). Defaults to global fetch. */
    fetchImpl?: typeof fetch;
}
export declare class HandoffApiError extends Error {
    status: number;
    constructor(status: number, message: string);
}
/**
 * Typed client for the Handoff API. Framework-agnostic — the React bindings and
 * any other consumer build on top of this.
 */
export interface HandoffClient {
    listCustomers(): Promise<Customer[]>;
    createCustomer(input: {
        name: string;
    }): Promise<Customer>;
    getCustomer(id: string): Promise<Customer>;
    addContact(customerId: string, input: {
        email: string;
        name?: string;
    }): Promise<Contact>;
    listRequests(): Promise<RequestSummary[]>;
    getRequest(id: string): Promise<unknown>;
    createRequest(input: {
        customerId: string;
        title: string;
        items: NewRequestItem[];
    }): Promise<{
        id: string;
    }>;
    sendRequest(id: string): Promise<unknown>;
    completeRequest(id: string): Promise<unknown>;
    getOrg(): Promise<Org>;
    /** Escape hatch for endpoints not yet wrapped. */
    request<T = unknown>(path: string, init?: RequestInit & {
        json?: unknown;
    }): Promise<T>;
}
type Contact = Customer["contacts"][number];
export declare function createHandoffClient(config: HandoffClientConfig): HandoffClient;
export {};
