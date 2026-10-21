import { getStore } from "@netlify/blobs";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { DashboardData, MatchDetail, MatchSummary, StoreData, StoreOffer } from "../../lib/companion-types";
export const PAIR_COOKIE = "valsync_phone_pair";
export const PAIR_LIFETIME_SECONDS = 90 * 86400;
export type PhoneSnapshot = { accountHash: string; dashboard: DashboardData; matches: MatchDetail[]; store: StoreData | null; receivedAt: string };
export type PairRecord = { code: string; browserHash: string; phoneHash?: string; accountHash?: string; expiresAt: number; pendingUntil: number; revoked?: boolean; snapshot?: PhoneSnapshot };
export type PairStore = {
  getWithMetadata(key: string, options: { type: "text" }): Promise<{ data: string; etag: string } | null>;
  set(key: string, data: string, options?: { onlyIfMatch?: string; onlyIfNew?: boolean; metadata?: Record<string, number> }): Promise<{ modified: boolean }>;
  delete(key: string): Promise<void>;
};
export const pairStore = (): PairStore => {
  const store = getStore({ name: "valsync-phone-pairs", consistency: "strong" });
  return {
    getWithMetadata: async key => { const value = await store.getWithMetadata(key); if (!value) return null; if (!value.etag) throw new Error("storage_version_missing"); return { data: value.data, etag: value.etag }; },
    set: (key, value, options) => store.set(key, value, options?.onlyIfMatch ? { onlyIfMatch: options.onlyIfMatch, metadata: options.metadata } : options?.onlyIfNew ? { onlyIfNew: true, metadata: options.metadata } : { metadata: options?.metadata }),
    delete: key => store.delete(key),
  };
};
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const pairEnabled = () => process.env.WEB_PAIRING_ENABLED === "true" && (process.env.WEB_PAIRING_SECRET?.length ?? 0) >= 32;
const key = () => createHash("sha256").update(process.env.WEB_PAIRING_SECRET ?? "").digest();
export function encodePair(value: unknown) {
  if (!pairEnabled()) throw new Error("pairing_unavailable");
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const content = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), content]).toString("base64url");
}
export function decodePair<T>(value: string): T | null {
  try { const bytes = Buffer.from(value, "base64url"); const cipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12)); cipher.setAuthTag(bytes.subarray(12, 28)); return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8")) as T; } catch { return null; }
}
export const equalHash = (secret: string, expected?: string) => { const actual = hash(secret); return Boolean(expected && /^[a-f0-9]{64}$/.test(expected) && timingSafeEqual(Buffer.from(actual), Buffer.from(expected))); };
export function credential(value: string | null): { id: string; secret: string } | null {
  const parts = value?.split(".") ?? [];
  return parts.length === 2 && /^[a-f0-9]{64}$/.test(parts[0]) && /^[A-Za-z0-9_-]{43}$/.test(parts[1]) ? { id: parts[0], secret: parts[1] } : null;
}
export function browserCredential(headers: Record<string, string | undefined>) {
  const value = (headers.cookie ?? "").split(";").map(s => s.trim()).find(s => s.startsWith(`${PAIR_COOKIE}=`))?.slice(PAIR_COOKIE.length + 1);
  return credential(value ?? null);
}
export async function getBrowserPair(headers: Record<string, string | undefined>, storage?: PairStore) {
  if (!pairEnabled()) return null;
  const store = storage ?? pairStore();
  const cred = browserCredential(headers); if (!cred) return null;
  const entry = await store.getWithMetadata(`pairs/${cred.id}`, { type: "text" });
  const record = entry ? decodePair<PairRecord>(entry.data) : null;
  if (!record || record.revoked || record.expiresAt <= Date.now() || !equalHash(cred.secret, record.browserHash)) return null;
  return { record, cred, etag: entry!.etag };
}
// Only the explicitly supported display fields are retained. Riot credentials,
// URLs, unknown objects and telemetry cannot enter stored snapshots.
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => v && typeof v === "object" && !Array.isArray(v) ? v as Obj : {};
const text = (v: unknown, max = 120) => typeof v === "string" ? v.slice(0, max) : "";
const num = (v: unknown, max = 1e14) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : null;
const list = (v: unknown, max: number) => Array.isArray(v) ? v.slice(0, max) : [];
function summary(input: unknown): MatchSummary {
  const m = obj(input);
  return { id: text(m.id, 36), startedAt: num(m.startedAt), queue: text(m.queue, 30), mapId: text(m.mapId, 160), agentId: text(m.agentId, 36), result: ["win", "loss", "draw", "unknown"].includes(String(m.result)) ? m.result as MatchSummary["result"] : "unknown", score: typeof m.score === "string" ? text(m.score, 32) : null, kills: num(m.kills, 500), deaths: num(m.deaths, 500), assists: num(m.assists, 500) };
}
function offer(input: unknown): StoreOffer {
  const o = obj(input); const image = text(o.image, 300);
  return { id: text(o.id, 80), name: text(o.name), image: /^https:\/\/media\.valorant-api\.com\//.test(image) ? image : null, vp: num(o.vp, 100000), originalVp: num(o.originalVp, 100000), discount: num(o.discount, 100) };
}
export function sanitizeSnapshot(input: unknown): PhoneSnapshot | null {
  const data = obj(input); const d = obj(data.dashboard); const p = obj(d.profile); const perf = obj(d.performance);
  const accountHash = text(data.accountHash, 64);
  if (!/^[a-f0-9]{64}$/.test(accountHash) || !text(p.name) || !["na", "eu", "ap", "kr", "br", "latam"].includes(String(p.region))) return null;
  const now = new Date().toISOString();
  const details: MatchDetail[] = list(data.matches, 40).map(raw => { const m = obj(raw); return { match: summary(m.match), players: list(m.players, 20).map(raw => { const p = obj(raw); return { id: text(p.id, 36), name: text(p.name), team: text(p.team, 20), agentId: text(p.agentId, 36), kills: num(p.kills, 500), deaths: num(p.deaths, 500), assists: num(p.assists, 500), acs: num(p.acs, 10000), ps: num(p.ps, 1000) }; }), rounds: list(m.rounds, 100).map(raw => { const r = obj(raw); return { number: num(r.number, 100) ?? 0, winner: text(r.winner, 20), reason: text(r.reason, 80) }; }), fetchedAt: now }; }).filter(m => /^[a-f0-9-]{36}$/.test(m.match.id));
  const matches = details.map(m => m.match);
  const s = data.store ? obj(data.store) : null;
  return { accountHash, dashboard: { profile: { name: text(p.name), tag: text(p.tag, 30), region: String(p.region), tier: num(p.tier, 27), rr: num(p.rr, 100000) }, performance: { sampleSize: num(perf.sampleSize, 30) ?? 0, wins: num(perf.wins, 30) ?? 0, winRate: num(perf.winRate, 100), actMatches: num(perf.actMatches, 10000), actWins: num(perf.actWins, 10000), kd: num(perf.kd, 500), acs: num(perf.acs, 10000), ps: num(perf.ps, 1000), from: num(perf.from), to: num(perf.to) }, matches: matches.filter(m => m.queue === "competitive").slice(0, 10), fetchedAt: now }, matches: details, store: s ? { daily: list(s.daily, 20).map(offer), nightMarket: list(s.nightMarket, 20).map(offer), expiresAt: num(s.expiresAt), nightExpiresAt: num(s.nightExpiresAt), fetchedAt: now } : null, receivedAt: now };
}
