import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { load } from "./register.mjs";
const pairing = load("../netlify/functions/_pairing.ts");
const { createPairHandler } = load("../netlify/functions/web-pair.ts");
const originalEnv = { ...process.env };
let store, handler;
class MemoryStore {
  values = new Map(); version = 0;
  async getWithMetadata(key) { const value = this.values.get(key); return value ? { data: value.data, etag: value.etag } : null; }
  async set(key, data, options = {}) {
    const old = this.values.get(key);
    if ((options.onlyIfNew && old) || (options.onlyIfMatch && old?.etag !== options.onlyIfMatch)) return { modified: false };
    this.values.set(key, { data, etag: String(++this.version), metadata: options.metadata }); return { modified: true };
  }
  async delete(key) { this.values.delete(key); }
}
const request = (action, body, options = {}) => new Request(`https://www.valsync.website/.netlify/functions/web-pair?action=${action}`, { method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", "Origin": "https://www.valsync.website", "X-ValSync-Request": "1", ...options }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const snapshot = () => ({ accountHash: "a".repeat(64), dashboard: { profile: { name: "Test Player", tag: "EU", region: "eu", tier: 21, rr: 74 }, performance: { sampleSize: 0, wins: 0, winRate: null, kd: null, acs: null, from: null, to: null } }, matches: [], store: null, accessToken: "must-not-store", refreshToken: "must-not-store" });
async function start() { const result = await handler(request("start", {})); assert.equal(result.status, 200); return { ...await result.json(), cookie: result.headers.get("set-cookie").split(";")[0] }; }
beforeEach(() => { process.env.WEB_PAIRING_ENABLED = "true"; process.env.WEB_PAIRING_SECRET = "test-only-pairing-secret-at-least-32-characters"; store = new MemoryStore(); handler = createPairHandler(() => store); });
after(() => { process.env = originalEnv; });
test("start is same-origin protected and returns a secure opaque cookie", async () => {
  assert.equal((await handler(request("start", {}, { Origin: "https://evil.example" }))).status, 403);
  assert.equal((await handler(request("start"))).status, 403);
  const result = await handler(request("start", {})); const data = await result.json();
  assert.match(data.code, /^\d{6}$/); assert.ok(data.expiresAt > Date.now());
  assert.match(result.headers.get("set-cookie"), /HttpOnly; Secure; SameSite=Lax/);
});
test("pending status is scoped to the initiating browser", async () => {
  const pair = await start();
  assert.equal((await (await handler(request("status", undefined, { Cookie: pair.cookie }))).json()).state, "pending");
  assert.equal((await (await handler(request("status"))).json()).state, "anonymous");
  const reused = await (await handler(request("start", {}, { Cookie: pair.cookie }))).json();
  assert.equal(reused.code, pair.code);
});
test("approval is single-use and snapshots exclude credentials", async () => {
  const pair = await start();
  const approved = await handler(request("approve", { code: pair.code, snapshot: snapshot() }));
  assert.equal(approved.status, 200); const data = await approved.json(); assert.ok(data.writerToken);
  assert.equal((await handler(request("approve", { code: pair.code, snapshot: snapshot() }))).status, 409);
  const browser = await pairing.getBrowserPair({ cookie: pair.cookie }, store);
  assert.equal(browser.record.snapshot.dashboard.profile.rr, 74);
  assert.ok(!JSON.stringify(browser.record).includes("must-not-store"));
  assert.ok([...store.values.values()].every(v => !v.data.includes("Test Player")));
});
test("concurrent approvals cannot replace the first phone", async () => {
  const pair = await start();
  const results = await Promise.all([handler(request("approve", { code: pair.code, snapshot: snapshot() })), handler(request("approve", { code: pair.code, snapshot: snapshot() }))]);
  assert.equal(results.filter(r => r.status === 200).length, 1);
  assert.ok(results.filter(r => r.status !== 200).every(r => [409, 429].includes(r.status)));
});
test("approved pairing survives backend restart and later browser visits without a new code", async () => {
  const result = await handler(request("start", {}));
  assert.match(result.headers.get("set-cookie"), /Max-Age=7776000/);
  const pair = { ...await result.json(), cookie: result.headers.get("set-cookie").split(";")[0] };
  await handler(request("approve", { code: pair.code, snapshot: snapshot() }));
  handler = createPairHandler(() => store);
  const now = Date.now;
  try {
    Date.now = () => now() + 8 * 86400000;
    assert.equal((await (await handler(request("status", undefined, { Cookie: pair.cookie }))).json()).state, "paired");
    assert.equal((await handler(request("start", {}, { Cookie: pair.cookie }))).status, 409);
    Date.now = () => now() + 91 * 86400000;
    assert.equal((await (await handler(request("status", undefined, { Cookie: pair.cookie }))).json()).state, "anonymous");
  } finally { Date.now = now; }
});
test("expired codes and wrong browser credentials are rejected", async () => {
  const pair = await start(); const id = pairing.hash(pair.code); const entry = await store.getWithMetadata(`pairs/${id}`);
  const record = pairing.decodePair(entry.data); record.pendingUntil = Date.now() - 1000;
  await store.set(`pairs/${id}`, pairing.encodePair(record));
  assert.equal((await handler(request("approve", { code: pair.code, snapshot: snapshot() }))).status, 409);
  const wrong = pair.cookie.slice(0, -1) + (pair.cookie.endsWith("a") ? "b" : "a");
  assert.equal(await pairing.getBrowserPair({ cookie: wrong }, store), null);
});
test("sync is writer-authenticated, rate limited and account bound", async () => {
  const pair = await start(); const approved = await (await handler(request("approve", { code: pair.code, snapshot: snapshot() }))).json();
  assert.equal((await handler(request("sync", { snapshot: snapshot() }))).status, 401);
  const headers = { Authorization: `Bearer ${approved.writerToken}` };
  assert.equal((await handler(request("sync", { snapshot: snapshot() }, headers))).status, 429);
  assert.equal((await handler(request("sync", { snapshot: { ...snapshot(), accountHash: "b".repeat(64) } }, headers))).status, 400);
});
test("browser disconnect revokes the phone and clears display access", async () => {
  const pair = await start(); const approved = await (await handler(request("approve", { code: pair.code, snapshot: snapshot() }))).json();
  const result = await handler(request("disconnect", {}, { Cookie: pair.cookie }));
  assert.equal(result.status, 200); assert.match(result.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(await pairing.getBrowserPair({ cookie: pair.cookie }, store), null);
  assert.equal((await handler(request("sync", { snapshot: snapshot() }, { Authorization: `Bearer ${approved.writerToken}` }))).status, 401);
});
test("invalid bodies, invalid codes and mismatched media URLs are bounded", async () => {
  assert.equal((await handler(request("approve", { code: "guess", snapshot: snapshot() }))).status, 401);
  const pair = await start();
  assert.equal((await handler(request("approve", { code: pair.code, snapshot: { accountHash: "bad" } }))).status, 400);
  const safe = pairing.sanitizeSnapshot({ ...snapshot(), store: { daily: [{ id: "x", name: "Skin", image: "https://evil.example/track", vp: -100 }], nightMarket: [] } });
  assert.equal(safe.store.daily[0].image, null); assert.equal(safe.store.daily[0].vp, null);
  const huge = request("approve", { code: pair.code, snapshot: snapshot(), padding: "x".repeat(400000) });
  assert.equal((await handler(huge)).status, 400);
});
test("anonymous pairing creation is capped per IP hash", async () => {
  for (let i = 0; i < 10; i++) await start();
  assert.equal((await handler(request("start", {}))).status, 429);
});
test("disabled pairing never opens storage", async () => {
  process.env.WEB_PAIRING_ENABLED = "false";
  assert.equal((await createPairHandler(() => { throw new Error("must-not-open"); })(request("start", {}))).status, 503);
});
test("six-digit approval guessing is capped independently of code creation", async () => {
  for (let i = 0; i < 10; i++) assert.equal((await handler(request("approve", { code: "guess", snapshot: snapshot() }))).status, 401);
  const blocked = await handler(request("approve", { code: "123456", snapshot: snapshot() }));
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get("retry-after"), "600");
});

test("phone snapshots keep the act record and performance score", () => {
  const base = snapshot();
  const safe = pairing.sanitizeSnapshot({ ...base, dashboard: { ...base.dashboard, performance: { sampleSize: 10, wins: 6, winRate: 54, actMatches: 41, actWins: 22, kd: 1.12, acs: 230, ps: 271, from: null, to: null } } });
  assert.equal(safe.dashboard.performance.actMatches, 41); assert.equal(safe.dashboard.performance.actWins, 22);
  assert.equal(safe.dashboard.performance.ps, 271); assert.equal(safe.dashboard.performance.winRate, 54);
});
