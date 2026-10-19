import { randomBytes, randomInt } from "node:crypto";
import { cookie } from "./_riot";
import { credential, decodePair, encodePair, equalHash, getBrowserPair, hash, PAIR_COOKIE, PAIR_LIFETIME_SECONDS, pairEnabled, pairStore, sanitizeSnapshot, type PairRecord, type PairStore } from "./_pairing";
const origins = ["https://www.valsync.website", "https://valsync.website", "https://valsync-companion.netlify.app"];
const response = (status: number, data: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });
export function browserPost(req: Request) { return req.method === "POST" && origins.includes(req.headers.get("origin") ?? "") && req.headers.get("x-valsync-request") === "1"; }
async function readBody(req: Request) {
  if (!req.headers.get("content-type")?.startsWith("application/json")) throw new Error("invalid_body");
  const reader = req.body?.getReader(); let size = 0; const chunks: Uint8Array[] = [];
  if (!reader) throw new Error("invalid_body");
  while (true) { const item = await reader.read(); if (item.done) break; size += item.value.byteLength; if (size > 262144) { await reader.cancel(); throw new Error("body_too_large"); } chunks.push(item.value); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}
export function createPairHandler(storage: () => PairStore = pairStore) {
  return async (req: Request, context?: { ip?: string }) => {
    if (!pairEnabled()) return response(503, { error: "pairing_unavailable" });
    const action = new URL(req.url).searchParams.get("action");
    try {
      const store = storage();
      if (action === "start") {
        if (!browserPost(req)) return response(403, { error: "invalid_origin" });
        const headers = Object.fromEntries(req.headers); const previous = await getBrowserPair(headers, store);
        if (previous?.record.snapshot) return response(409, { error: "already_paired" });
        if (previous && /^\d{6}$/.test(previous.record.code) && !previous.record.snapshot && previous.record.pendingUntil > Date.now()) return response(200, { code: previous.record.code, expiresAt: previous.record.pendingUntil });
        // Atomic, hourly IP-hash budget limits unauthenticated storage creation.
        const limitKey = `limits/${Math.floor(Date.now() / 3600000)}/${hash(context?.ip ?? "unknown")}`;
        const limit = await store.getWithMetadata(limitKey, { type: "text" });
        const count = limit ? Number(limit.data) : 0;
        if (count >= 10) return response(429, { error: "rate_limited" });
        const limited = await store.set(limitKey, String(count + 1), { ...(limit ? { onlyIfMatch: limit.etag } : { onlyIfNew: true }), metadata: { expiresAt: Date.now() + 7200000 } });
        if (!limited.modified) return response(429, { error: "rate_limited" });
        const pendingUntil = Date.now() + 10 * 60000;
        for (let attempt = 0; attempt < 5; attempt++) {
          const code = String(randomInt(1000000)).padStart(6, "0"); const id = hash(code); const secret = randomBytes(32).toString("base64url");
          const record: PairRecord = { code, browserHash: hash(secret), pendingUntil, expiresAt: Date.now() + PAIR_LIFETIME_SECONDS * 1000 };
          const created = await store.set(`pairs/${id}`, encodePair(record), { onlyIfNew: true, metadata: { expiresAt: pendingUntil } });
          if (created.modified) return response(200, { code, expiresAt: pendingUntil }, { "Set-Cookie": cookie(PAIR_COOKIE, `${id}.${secret}`, PAIR_LIFETIME_SECONDS) });
        }
        return response(409, { error: "pair_changed" });
      }
      if (action === "status") {
        if (req.method !== "GET") return response(405, { error: "method_not_allowed" });
        const pair = await getBrowserPair(Object.fromEntries(req.headers), store);
        return response(200, { state: !pair ? "anonymous" : pair.record.snapshot ? "paired" : pair.record.pendingUntil > Date.now() ? "pending" : "expired", expiresAt: pair?.record.snapshot ? pair.record.expiresAt : pair?.record.pendingUntil, receivedAt: pair?.record.snapshot?.receivedAt });
      }
      if (req.method !== "POST") return response(405, { error: "method_not_allowed" });
      const token = credential(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null);
      if (action === "disconnect" && !token) {
        if (!browserPost(req)) return response(403, { error: "invalid_origin" });
        const pair = await getBrowserPair(Object.fromEntries(req.headers), store);
        if (pair) { const changed = await store.set(`pairs/${pair.cred.id}`, encodePair({ ...pair.record, revoked: true, snapshot: undefined }), { onlyIfMatch: pair.etag, metadata: { expiresAt: pair.record.expiresAt } }); if (!changed.modified) return response(409, { error: "retry_disconnect" }); }
        return response(200, { ok: true }, { "Set-Cookie": cookie(PAIR_COOKIE, "", 0) });
      }
      if (!["approve", "sync", "disconnect"].includes(action ?? "")) return response(400, { error: "invalid_action" });
      if (action === "approve") {
        // Six-digit approval codes have a separate, strict guessing budget.
        const limitKey = `limits/approve/${Math.floor(Date.now() / 600000)}/${hash(context?.ip ?? "unknown")}`;
        const limit = await store.getWithMetadata(limitKey, { type: "text" });
        const count = limit ? Number(limit.data) : 0;
        if (count >= 10) return response(429, { error: "rate_limited" }, { "Retry-After": "600" });
        const result = await store.set(limitKey, String(count + 1), { ...(limit ? { onlyIfMatch: limit.etag } : { onlyIfNew: true }), metadata: { expiresAt: Date.now() + 7200000 } });
        if (!result.modified) return response(429, { error: "rate_limited" }, { "Retry-After": "600" });
      }
      const data = action === "disconnect" ? {} : await readBody(req);
      const code = typeof data.code === "string" ? data.code.replace(/[\s-]/g, "").toUpperCase() : "";
      const id = action === "approve" && /^\d{6}$/.test(code) ? hash(code) : token?.id;
      if (!id) return response(401, { error: "invalid_pair" });
      const entry = await store.getWithMetadata(`pairs/${id}`, { type: "text" });
      const record = entry ? decodePair<PairRecord>(entry.data) : null;
      if (!record || record.revoked || record.expiresAt <= Date.now()) return response(401, { error: "pair_expired" });
      if (action === "approve" && (record.phoneHash || record.pendingUntil <= Date.now())) return response(409, { error: "pair_already_used_or_expired" });
      if (action !== "approve" && (!token || !equalHash(token.secret, record.phoneHash))) return response(401, { error: "invalid_pair" });
      if (action === "disconnect") { const result = await store.set(`pairs/${id}`, encodePair({ ...record, revoked: true, snapshot: undefined }), { onlyIfMatch: entry!.etag, metadata: { expiresAt: record.expiresAt } }); return response(result.modified ? 200 : 409, { ok: result.modified }); }
      const snapshot = sanitizeSnapshot(data.snapshot);
      if (!snapshot || (record.accountHash && record.accountHash !== snapshot.accountHash)) return response(400, { error: "invalid_snapshot_or_account" });
      if (action === "sync" && record.snapshot && Date.now() - Date.parse(record.snapshot.receivedAt) < 15000) return response(429, { error: "sync_too_frequent" });
      const secret = action === "approve" ? randomBytes(32).toString("base64url") : token!.secret;
      const result = await store.set(`pairs/${id}`, encodePair({ ...record, phoneHash: hash(secret), accountHash: snapshot.accountHash, snapshot }), { onlyIfMatch: entry!.etag, metadata: { expiresAt: record.expiresAt } });
      if (!result.modified) return response(409, { error: "pair_changed" });
      return response(200, { ok: true, ...(action === "approve" ? { writerToken: `${id}.${secret}` } : {}), expiresAt: record.expiresAt, receivedAt: snapshot.receivedAt });
    } catch (error) { return response(error instanceof SyntaxError || (error instanceof Error && ["invalid_body", "body_too_large"].includes(error.message)) ? 400 : 503, { error: "pair_request_failed" }); }
  };
}
export default createPairHandler();
