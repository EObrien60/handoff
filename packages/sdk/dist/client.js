export class HandoffApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = "HandoffApiError";
    }
}
export function createHandoffClient(config) {
    const doFetch = config.fetchImpl ?? fetch;
    const base = config.baseUrl.replace(/\/$/, "");
    async function request(path, init) {
        const token = config.getToken ? await config.getToken() : null;
        const headers = new Headers(init?.headers);
        if (token)
            headers.set("authorization", `Bearer ${token}`);
        let body = init?.body;
        if (init?.json !== undefined) {
            headers.set("content-type", "application/json");
            body = JSON.stringify(init.json);
        }
        const res = await doFetch(`${base}${path}`, { ...init, headers, body });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok)
            throw new HandoffApiError(res.status, data?.error ?? res.statusText);
        return data;
    }
    return {
        request,
        listCustomers: () => request("/api/customers"),
        createCustomer: (input) => request("/api/customers", { method: "POST", json: input }),
        getCustomer: (id) => request(`/api/customers/${id}`),
        addContact: (customerId, input) => request(`/api/customers/${customerId}/contacts`, { method: "POST", json: input }),
        listRequests: () => request("/api/requests"),
        getRequest: (id) => request(`/api/requests/${id}`),
        createRequest: (input) => request("/api/requests", { method: "POST", json: input }),
        sendRequest: (id) => request(`/api/requests/${id}`, { method: "PATCH", json: { action: "send" } }),
        completeRequest: (id) => request(`/api/requests/${id}`, { method: "PATCH", json: { action: "complete" } }),
        getOrg: () => request("/api/org"),
    };
}
