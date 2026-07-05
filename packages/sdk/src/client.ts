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

export class HandoffApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HandoffApiError";
  }
}

/**
 * Typed client for the Handoff API. Framework-agnostic — the React bindings and
 * any other consumer build on top of this.
 */
export interface HandoffClient {
  listCustomers(): Promise<Customer[]>;
  createCustomer(input: { name: string }): Promise<Customer>;
  getCustomer(id: string): Promise<Customer>;
  addContact(customerId: string, input: { email: string; name?: string }): Promise<Contact>;
  listRequests(): Promise<RequestSummary[]>;
  getRequest(id: string): Promise<unknown>;
  createRequest(input: { customerId: string; title: string; items: NewRequestItem[] }): Promise<{ id: string }>;
  sendRequest(id: string): Promise<unknown>;
  completeRequest(id: string): Promise<unknown>;
  getOrg(): Promise<Org>;
  /** Escape hatch for endpoints not yet wrapped. */
  request<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T>;
}

type Contact = Customer["contacts"][number];

export function createHandoffClient(config: HandoffClientConfig): HandoffClient {
  const doFetch = config.fetchImpl ?? fetch;
  const base = config.baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
    const token = config.getToken ? await config.getToken() : null;
    const headers = new Headers(init?.headers);
    if (token) headers.set("authorization", `Bearer ${token}`);
    let body = init?.body;
    if (init?.json !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(init.json);
    }
    const res = await doFetch(`${base}${path}`, { ...init, headers, body });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new HandoffApiError(res.status, data?.error ?? res.statusText);
    return data as T;
  }

  return {
    request,
    listCustomers: () => request("/api/customers"),
    createCustomer: (input) => request("/api/customers", { method: "POST", json: input }),
    getCustomer: (id) => request(`/api/customers/${id}`),
    addContact: (customerId, input) =>
      request(`/api/customers/${customerId}/contacts`, { method: "POST", json: input }),
    listRequests: () => request("/api/requests"),
    getRequest: (id) => request(`/api/requests/${id}`),
    createRequest: (input) => request("/api/requests", { method: "POST", json: input }),
    sendRequest: (id) => request(`/api/requests/${id}`, { method: "PATCH", json: { action: "send" } }),
    completeRequest: (id) => request(`/api/requests/${id}`, { method: "PATCH", json: { action: "complete" } }),
    getOrg: () => request("/api/org"),
  };
}
