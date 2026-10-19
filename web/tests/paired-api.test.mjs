import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { load } from "./register.mjs";
const pairing = load("../netlify/functions/_pairing.ts");
const { handler } = load("../netlify/functions/riot-companion.ts");
const original = pairing.getBrowserPair;
const env = { ...process.env };
let snapshot;
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const call = async (action, filters = {}) => { const result = await handler({ httpMethod: "GET", headers: {}, queryStringParameters: { action, ...filters } }); return { status: result.statusCode, data: JSON.parse(result.body) }; };
beforeEach(() => {
  process.env.WEB_PAIRING_ENABLED = "true"; process.env.WEB_PAIRING_SECRET = "test-only-secret-with-at-least-32-characters";
  snapshot = { receivedAt: new Date().toISOString(), dashboard: { profile: { name: "Fixture" } }, store: null, matches: Array.from({ length: 25 }, (_, n) => ({ match: { id: id(n), queue: n % 2 ? "unrated" : "competitive" }, players: [], rounds: [] })) };
  pairing.getBrowserPair = async () => ({ record: { snapshot, expiresAt: Date.now() + 60000 } });
});
after(() => { pairing.getBrowserPair = original; process.env = env; });
test("paired session exposes source and expiry without snapshot or credentials", async () => {
  const value = await call("session"); assert.equal(value.data.source, "phone"); assert.equal(value.data.state, "authenticated"); assert.ok(!JSON.stringify(value.data).includes("Fixture"));
});
test("paired history paginates the available window and filters queue before paging", async () => {
  const a = await call("matches", { queue: "competitive" }); assert.equal(a.data.matches.length, 10); assert.equal(a.data.next, 10);
  const b = await call("matches", { queue: "competitive", start: "10" }); assert.equal(b.data.matches.length, 3); assert.equal(b.data.next, null);
  assert.equal((await call("matches", { start: "-1" })).status, 400); assert.equal((await call("matches", { queue: "invalid" })).status, 400);
});
test("paired detail requires a valid ID within the shared window", async () => {
  assert.equal((await call("match", { id: id(0) })).status, 200); assert.equal((await call("match", { id: id(90) })).status, 404); assert.equal((await call("match", { id: "invalid" })).status, 400);
});
test("old snapshots and missing storefront stay explicitly unavailable", async () => {
  assert.equal((await call("store")).data.error, "phone_sync_required"); snapshot.receivedAt = new Date(Date.now() - 86400001).toISOString();
  assert.equal((await call("dashboard")).data.error, "phone_sync_required");
});
test("pairing storage failures return sanitized unavailable results", async () => {
  pairing.getBrowserPair = async () => { throw new Error("private upstream content"); };
  const value = await call("session"); assert.equal(value.status, 503); assert.deepEqual(value.data, { error: "pairing_unavailable" });
});
