"use client";
import { useEffect, useState } from "react";
export const COMPANION_CANONICAL_URL = "https://www.valsync.website/play.html";
export const WEB_APP_URL = process.env.NODE_ENV === "development" ? "/play" : process.env.NEXT_PUBLIC_COMPANION_HOST === "netlify" ? "play.html" : COMPANION_CANONICAL_URL;
export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
let refreshing: Promise<void> | null = null;
export async function mutateSession(action: "refresh" | "logout", source?: "phone" | "riot") {
  const url = source === "phone" && action === "logout" ? "/.netlify/functions/web-pair?action=disconnect" : `/.netlify/functions/riot-auth-${action}`;
  const response = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "X-ValSync-Request": "1" }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new ApiError(response.status, "session_expired");
}
async function refresh() {
  refreshing ??= mutateSession("refresh").finally(() => { refreshing = null; });
  return refreshing;
}
export async function getData<T>(query: string, signal?: AbortSignal, retry = true): Promise<T> {
  const response = await fetch(`/.netlify/functions/riot-companion?${query}`, { credentials: "same-origin", signal: signal ?? AbortSignal.timeout(20_000), cache: "no-store" });
  if (response.status === 401 && retry) {
    await refresh();
    return getData<T>(query, signal, false);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error ?? "upstream_unavailable");
  }
  return response.json() as Promise<T>;
}
export function useResource<T>(query: string | null, revision = 0) {
  const [value, setValue] = useState<{ key: string | null; revision: number; data?: T; error?: ApiError }>({ key: null, revision: -1 });
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), 25_000);
    getData<T>(query, controller.signal).then(data => {
      setValue({ key: query, revision, data });
    }).catch(error => {
      if (controller.signal.aborted && controller.signal.reason?.name !== "TimeoutError") {
        // Cleanup aborts must not commit a response from a previous screen.
        return;
      }
      setValue(previous => ({ key: query, revision, data: previous.key === query && !(error instanceof ApiError && [401, 403].includes(error.status)) ? previous.data : undefined, error: error instanceof ApiError ? error : new ApiError(502, "upstream_unavailable") }));
    }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query, revision]);
  const current = value.key === query && query !== null;
  return { data: current ? value.data : undefined, error: current ? value.error : undefined, loading: Boolean(query && (!current || value.revision !== revision)), stale: current && Boolean(value.data && (value.error || value.revision !== revision)) };
}
