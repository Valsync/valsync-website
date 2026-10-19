import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type HandlerEvent = {
  headers: Record<string, string | undefined>;
  httpMethod?: string;
  queryStringParameters?: Record<string, string | undefined>;
};
export type HandlerResponse = { statusCode: number; headers?: Record<string, string>; body: string; multiValueHeaders?: Record<string, string[]> };

export type Session = {
  accessToken: string;
  entitlementsToken: string;
  puuid: string;
  shard: string;
  expiresAt: number;
  refreshToken?: string;
  refreshUntil?: number;
};

const SESSION_COOKIE = "valsync_rso_session";
const TRANSACTION_COOKIE = "valsync_rso_transaction";
const OAUTH_ORIGIN = "https://auth.riotgames.com";
const PLATFORM = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIndpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogInVua25vd24iDQp9";

function secret() {
  const raw = process.env.RIOT_SESSION_SECRET;
  if (!raw || raw.length < 32) throw new Error("RIOT_SESSION_SECRET must be at least 32 characters");
  return createHash("sha256").update(raw).digest();
}

function seal(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

function open<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    const payload = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", secret(), payload.subarray(0, 12));
    decipher.setAuthTag(payload.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8")) as T;
  } catch { return null; }
}

function cookies(event: HandlerEvent) {
  return Object.fromEntries((event.headers.cookie ?? "").split(";").map((part) => {
    const index = part.indexOf("=");
    return index === -1 ? ["", ""] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }));
}

export function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookie(name: string) { return cookie(name, "", 0); }
export function readSession(event: HandlerEvent) {
  const jar = cookies(event);
  const packed = [0, 1, 2].map(i => jar[`${SESSION_COOKIE}_${i}`] ?? "").join("");
  const session = open<Session>(packed);
  return session && shards.includes(session.shard) && session.puuid && session.accessToken && (session.refreshUntil ?? session.expiresAt) > Date.now() ? session : null;
}
export function getSession(event: HandlerEvent) {
  const session = readSession(event);
  return session && session.expiresAt > Date.now() ? session : null;
}
export function makeSessionCookies(session: Session) {
  const packed = seal(session);
  if (packed.length > 7500) throw new Error("session_too_large");
  const maxAge = Math.max(0, Math.floor(((session.refreshUntil ?? session.expiresAt) - Date.now()) / 1000));
  return [clearCookie(SESSION_COOKIE), ...[0, 1, 2].map(i => cookie(`${SESSION_COOKIE}_${i}`, packed.slice(i * 2500, (i + 1) * 2500), maxAge))];
}
export function clearSessionCookies() {
  return [clearCookie(SESSION_COOKIE), ...[0, 1, 2].map(i => clearCookie(`${SESSION_COOKIE}_${i}`))];
}
export function transactionCookie(transaction: unknown) { return cookie(TRANSACTION_COOKIE, seal(transaction), 600); }
export function getTransaction<T>(event: HandlerEvent) { return open<T>(cookies(event)[TRANSACTION_COOKIE]); }
export const transactionCookieName = TRANSACTION_COOKIE;
export const clientPlatform = PLATFORM;

export function baseUrl(event: HandlerEvent) {
  const host = event.headers["x-forwarded-host"] ?? event.headers.host;
  const protocol = event.headers["x-forwarded-proto"] ?? "https";
  return host ? `${protocol}://${host}` : "";
}

export function configured() {
  return Boolean(process.env.RIOT_RSO_CLIENT_ID && process.env.RIOT_RSO_CLIENT_SECRET && process.env.RIOT_RSO_REDIRECT_URI && (process.env.RIOT_SESSION_SECRET?.length ?? 0) >= 32);
}

export function json(statusCode: number, body: unknown, headers: Record<string, string> = {}): HandlerResponse {
  return { statusCode, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }, body: JSON.stringify(body) };
}

export function sameValue(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const oauth = { origin: OAUTH_ORIGIN };

export const shards = ["na", "eu", "ap", "kr", "br", "latam"];
export function privateDataEnabled() { return process.env.RIOT_PRIVATE_API_ENABLED === "true"; }
export function requirePost(event: HandlerEvent): HandlerResponse | null {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" }, { Allow: "POST" });
  try {
    if (!process.env.RIOT_RSO_REDIRECT_URI || event.headers.origin !== new URL(process.env.RIOT_RSO_REDIRECT_URI).origin || event.headers["x-valsync-request"] !== "1") return json(403, { error: "invalid_origin" });
  } catch { return json(503, { error: "riot_rso_not_configured" }); }
  return null;
}
export class UpstreamError extends Error {
  constructor(public status: number, public retryAfter = "60") { super("upstream_unavailable"); }
}
export async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new UpstreamError(response.status, /^\d+$/.test(response.headers.get("retry-after") ?? "") ? response.headers.get("retry-after")! : "60");
  return response.json() as Promise<T>;
}
export type Tokens = { access_token?: string; id_token?: string; refresh_token?: string; expires_in?: number };
export async function setupSession(tokens: Tokens, refreshUntil = Date.now() + 7 * 86400_000): Promise<Session> {
  if (!tokens.access_token || !tokens.id_token) throw new Error("token_response_incomplete");
  const authorization = { Authorization: `Bearer ${tokens.access_token}` };
  const [entitlement, user, region] = await Promise.all([
    request<{ entitlements_token?: string }>("https://entitlements.auth.riotgames.com/api/token/v1", { method: "POST", headers: { ...authorization, "Content-Type": "application/json" }, body: "{}" }),
    request<{ sub?: string }>(`${oauth.origin}/userinfo`, { headers: authorization }),
    request<{ affinities?: { live?: string } }>("https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant", { method: "PUT", headers: { ...authorization, "Content-Type": "application/json" }, body: JSON.stringify({ id_token: tokens.id_token }) }),
  ]);
  const shard = region.affinities?.live;
  if (!entitlement.entitlements_token || !user.sub || !shard || !shards.includes(shard)) throw new Error("riot_session_incomplete");
  const expiresAt = Date.now() + Math.min(86400, Math.max(1, tokens.expires_in ?? 3600)) * 1000;
  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, entitlementsToken: entitlement.entitlements_token, puuid: user.sub, shard, expiresAt, refreshUntil: tokens.refresh_token ? refreshUntil : expiresAt };
}
export function tokenRequest(body: URLSearchParams) {
  return request<Tokens>(`${oauth.origin}/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${process.env.RIOT_RSO_CLIENT_ID}:${process.env.RIOT_RSO_CLIENT_SECRET}`).toString("base64")}` }, body,
  });
}
// Native Netlify Request/Response entry point, with legacy events kept internal
// so endpoint logic can be exercised without the hosting runtime.
export function netlify(fn: (event: HandlerEvent) => Promise<HandlerResponse>) {
  return async (incoming: Request): Promise<Response> => {
    const event: HandlerEvent = { httpMethod: incoming.method, headers: Object.fromEntries(incoming.headers), queryStringParameters: Object.fromEntries(new URL(incoming.url).searchParams) };
    try {
      const result = await fn(event);
      const headers = new Headers(result.headers);
      for (const [name, values] of Object.entries(result.multiValueHeaders ?? {})) for (const value of values) headers.append(name, value);
      return new Response(result.body, { status: result.statusCode, headers });
    } catch { return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
  };
}
