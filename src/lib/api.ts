"use client";

import { useAuth } from "@gate/web-sdk";
import { useCallback } from "react";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Returns a fetch wrapper bound to the current gate session. Every authed call
 * from the staff app goes through this so the bearer token is attached
 * consistently and JSON is parsed/raised uniformly.
 */
export function useApi() {
  const { getAccessToken } = useAuth();

  return useCallback(
    async <T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> => {
      const token = await getAccessToken();
      const headers = new Headers(init?.headers);
      if (token) headers.set("authorization", `Bearer ${token}`);
      let body = init?.body;
      if (init?.json !== undefined) {
        headers.set("content-type", "application/json");
        body = JSON.stringify(init.json);
      }
      const res = await fetch(path, { ...init, headers, body });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new ApiError(res.status, data?.error ?? res.statusText);
      }
      return data as T;
    },
    [getAccessToken],
  );
}

/**
 * Open an authenticated binary resource (e.g. a stored file). Anchor links
 * can't carry the gate bearer token, so we fetch the bytes and open a blob URL.
 */
export function useDownload() {
  const { getAccessToken } = useAuth();
  return useCallback(
    async (path: string) => {
      const token = await getAccessToken();
      const res = await fetch(path, { headers: token ? { authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new ApiError(res.status, res.statusText);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    [getAccessToken],
  );
}
