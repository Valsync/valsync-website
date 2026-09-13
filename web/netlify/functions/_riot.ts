import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type HandlerEvent = {
  headers: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
};
export type HandlerResponse = { statusCode: number; headers?: Record<string, string>; body: string };

type Session = {
  accessToken: string;
  entitlementsToken: string;
  puuid: string;
  shard: string;
  expiresAt: number;
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
export function getSession(event: HandlerEvent) {
  const session = open<Session>(cookies(event)[SESSION_COOKIE]);
  return session && session.expiresAt > Date.now() ? session : null;
}
export function makeSessionCookie(session: Session) {
  return cookie(SESSION_COOKIE, seal(session), Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000)));
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
  return Boolean(process.env.RIOT_RSO_CLIENT_ID && process.env.RIOT_RSO_CLIENT_SECRET && process.env.RIOT_RSO_REDIRECT_URI && process.env.RIOT_SESSION_SECRET);
}

export function json(statusCode: number, body: unknown, headers: Record<string, string> = {}): HandlerResponse {
  return { statusCode, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }, body: JSON.stringify(body) };
}

export function sameValue(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const oauth = { origin: OAUTH_ORIGIN };
