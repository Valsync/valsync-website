import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load } from "./register.mjs";
const auth = load("../netlify/functions/_riot.ts");
const api = load("../netlify/functions/riot-companion.ts");
const callback = load("../netlify/functions/riot-auth-callback.ts");
const logout = load("../netlify/functions/riot-auth-logout.ts");
const refresh = load("../netlify/functions/riot-auth-refresh.ts");
const start = load("../netlify/functions/riot-auth-start.ts");
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const player = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const matchId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const session = (overrides = {}) => ({ accessToken: "secret-access", entitlementsToken: "secret-entitlements", refreshToken: "secret-refresh", puuid: player, shard: "eu", expiresAt: Date.now() + 60000, refreshUntil: Date.now() + 86400000, ...overrides });
const jar = cookies => cookies.map(c => c.split(";")[0]).join("; ");
const event = (query = {}, active = session()) => ({ httpMethod: "GET", headers: { cookie: jar(auth.makeSessionCookies(active)) }, queryStringParameters: query });
const post = active => ({ ...event({}, active), httpMethod: "POST", headers: { ...event({}, active).headers, origin: "https://www.valsync.website", "x-valsync-request": "1" } });
const body = response => JSON.parse(response.body);
const reply = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", ...headers } });
const match = (overrides = {}) => ({ matchInfo: { matchId, mapId: "/Game/Maps/Ascent/Ascent", gameStartMillis: 1710000000000, queueID: "competitive" }, players: [{ subject: player, teamId: "Blue", characterId: player, stats: { kills: 20, deaths: 10, assists: 5, score: 4000, roundsPlayed: 20 } }], teams: [{ teamId: "Blue", won: true, roundsWon: 13 }, { teamId: "Red", won: false, roundsWon: 7 }], ...overrides });
beforeEach(() => {
  process.env.RIOT_RSO_CLIENT_ID = "valsync-owned-test-client";
  process.env.RIOT_RSO_CLIENT_SECRET = "test-secret";
  process.env.RIOT_SESSION_SECRET = "test-only-session-secret-at-least-32-characters";
  process.env.RIOT_RSO_REDIRECT_URI = "https://www.valsync.website/.netlify/functions/riot-auth-callback";
  process.env.RIOT_PRIVATE_API_ENABLED = "true";
  globalThis.fetch = async url => {
    if (String(url).endsWith("/version")) return reply({ data: { riotClientVersion: "test-version" } });
    throw new Error("Unexpected request");
  };
});
after(() => { globalThis.fetch = originalFetch; process.env = originalEnv; });
test("encrypted chunked cookies are HttpOnly and isolate accounts", () => {
  const a = session(); const b = session({ puuid: matchId });
  const cookies = auth.makeSessionCookies(a);
  assert.equal(auth.getSession({ headers: { cookie: jar(cookies) } }).puuid, player);
  assert.equal(auth.getSession(event({}, b)).puuid, matchId);
  assert.ok(cookies.every(c => c.includes("HttpOnly; Secure; SameSite=Lax")));
  assert.ok(cookies.every(c => !c.includes("secret-access")));
});
test("tampered, oversized and invalid-shard sessions are rejected", () => {
  const cookie = jar(auth.makeSessionCookies(session())).replace("session_0=", "session_0=x");
  assert.equal(auth.readSession({ headers: { cookie } }), null);
  assert.equal(auth.readSession(event({}, session({ shard: "invalid" }))), null);
  assert.throws(() => auth.makeSessionCookies(session({ accessToken: "x".repeat(9000) })), /session_too_large/);
});
test("expired access cannot fetch private data but may refresh", async () => {
  const expired = session({ expiresAt: Date.now() - 1000 });
  assert.equal(auth.getSession(event({}, expired)), null);
  const data = body(await api.handler(event({ action: "session" }, expired)));
  assert.equal(data.state, "expired"); assert.equal(data.refreshable, true);
  assert.equal((await api.handler(event({ action: "dashboard" }, expired))).statusCode, 401);
});
test("missing credentials and explicit private access gate remain unavailable", async () => {
  delete process.env.RIOT_RSO_CLIENT_ID;
  assert.equal(body(await api.handler({ headers: {}, queryStringParameters: { action: "session" } })).state, "unavailable");
  process.env.RIOT_RSO_CLIENT_ID = "test"; delete process.env.RIOT_PRIVATE_API_ENABLED;
  assert.equal((await api.handler(event({ action: "store" }))).statusCode, 503);
});
test("session endpoint exposes no tokens or identifiers", async () => {
  const response = await api.handler(event({ action: "session" }));
  assert.equal(body(response).state, "authenticated");
  assert.ok(!/secret|aaaaaaaa|puuid/.test(response.body));
  assert.equal(response.headers["Cache-Control"], "no-store");
});
test("OAuth start uses a fresh state and S256 PKCE", async () => {
  const response = await start.handler(); const url = new URL(response.headers.Location);
  assert.equal(url.searchParams.get("client_id"), "valsync-owned-test-client");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("state"));
  assert.ok(!url.searchParams.has("code_verifier"));
});
test("OAuth callback rejects absent, expired, mismatched state and cancellation", async () => {
  const tx = auth.transactionCookie({ state: "expected", verifier: "test", expiresAt: Date.now() + 1000 });
  const call = q => callback.handler({ headers: { cookie: jar([tx]) }, queryStringParameters: q });
  assert.match((await call({ state: "wrong", code: "test" })).headers.Location, /auth=invalid/);
  assert.match((await call({ state: "expected", error: "access_denied" })).headers.Location, /auth=cancelled/);
  assert.match((await callback.handler({ headers: {}, queryStringParameters: { code: "test" } })).headers.Location, /auth=invalid/);
  const old = auth.transactionCookie({ state: "expected", verifier: "test", expiresAt: Date.now() - 1000 });
  assert.match((await callback.handler({ headers: { cookie: jar([old]) }, queryStringParameters: { state: "expected", code: "test" } })).headers.Location, /auth=invalid/);
});
test("successful callback stores tokens only in encrypted cookies", async () => {
  globalThis.fetch = async url => String(url).endsWith("/token") ? reply({ access_token: "secret-access", id_token: "id", refresh_token: "secret-refresh", expires_in: 3600 }) : String(url).includes("entitlements") ? reply({ entitlements_token: "secret-entitlements" }) : String(url).endsWith("/userinfo") ? reply({ sub: player }) : reply({ affinities: { live: "eu" } });
  const tx = auth.transactionCookie({ state: "expected", verifier: "test", expiresAt: Date.now() + 1000 });
  const response = await callback.handler({ headers: { cookie: jar([tx]) }, queryStringParameters: { state: "expected", code: "test" } });
  assert.equal(response.headers.Location, "/play.html");
  assert.equal(auth.getSession({ headers: { cookie: jar(response.multiValueHeaders["Set-Cookie"]) } }).puuid, player);
  assert.equal(response.body, "");
});
test("logout requires same-origin POST and clears every session cookie", async () => {
  assert.equal((await logout.handler(event())).statusCode, 405);
  assert.equal((await logout.handler({ ...post(), headers: { origin: "https://evil.example" } })).statusCode, 403);
  const result = await logout.handler(post());
  assert.equal(result.statusCode, 200);
  assert.equal(result.multiValueHeaders["Set-Cookie"].length, 4);
  assert.ok(result.multiValueHeaders["Set-Cookie"].every(c => c.includes("Max-Age=0")));
});
test("refresh rejection clears session but temporary failure preserves it", async () => {
  globalThis.fetch = async () => reply({}, 400);
  const rejected = await refresh.handler(post());
  assert.equal(rejected.statusCode, 401); assert.ok(rejected.multiValueHeaders);
  globalThis.fetch = async () => reply({}, 503);
  const temporary = await refresh.handler(post());
  assert.equal(temporary.statusCode, 503); assert.equal(temporary.multiValueHeaders, undefined);
});
test("refresh rotates tokens and retains the original maximum lifetime", async () => {
  const previous = session();
  globalThis.fetch = async url => String(url).endsWith("/token") ? reply({ access_token: "rotated-access", id_token: "id", refresh_token: "rotated-refresh", expires_in: 3600 }) : String(url).includes("entitlements") ? reply({ entitlements_token: "rotated-entitlement" }) : String(url).endsWith("/userinfo") ? reply({ sub: player }) : reply({ affinities: { live: "eu" } });
  const result = await refresh.handler(post(previous));
  assert.equal(result.statusCode, 200);
  const next = auth.getSession({ headers: { cookie: jar(result.multiValueHeaders["Set-Cookie"]) } });
  assert.equal(next.refreshToken, "rotated-refresh"); assert.equal(next.refreshUntil, previous.refreshUntil);
});
test("an incomplete dashboard never reports partial stats as the full sample", async () => {
  const baseFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("name-service") ? reply([]) : String(url).includes("/mmr/") ? reply({}) : String(url).includes("match-history") ? reply({ History: [{ MatchID: matchId }], Total: 1 }) : String(url).includes("match-details") ? reply({ players: [{ subject: player }] }) : baseFetch(url);
  const result = body(await api.handler(event({ action: "dashboard" })));
  assert.equal(result.performance.kd, null); assert.equal(result.performance.acs, null); assert.equal(result.performance.winRate, null);
  assert.equal(result.matches[0].id, matchId);
});
test("native Netlify adapter preserves individual Set-Cookie headers", async () => {
  const response = await logout.default(new Request("https://www.valsync.website/.netlify/functions/riot-auth-logout", { method: "POST", headers: { Origin: "https://www.valsync.website", "X-ValSync-Request": "1" } }));
  assert.equal(response.status, 200); assert.equal(response.headers.getSetCookie().length, 4);
});
test("match summaries preserve unknowns, missing stats and draws", () => {
  const unknown = api.summarize({ players: [{ subject: player }] }, player);
  assert.equal(unknown.result, "unknown"); assert.equal(unknown.kills, null); assert.equal(unknown.startedAt, null);
  assert.equal(api.summarize(match({ teams: [{ teamId: "Blue", roundsWon: 12 }, { teamId: "Red", roundsWon: 12 }] }), player).result, "draw");
});
test("pagination uses upstream totals and queue filter", async () => {
  const baseFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("match-history") ? (assert.match(String(url), /queue=competitive/), reply({ History: [{ MatchID: matchId }], Total: 11 })) : String(url).includes("match-details") ? reply(match()) : baseFetch(url);
  const result = body(await api.handler(event({ action: "matches", start: "0", queue: "competitive" })));
  assert.equal(result.matches[0].id, matchId); assert.equal(result.next, 1);
});
test("empty match history has no synthetic matches or next page", async () => {
  const baseFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("match-history") ? reply({ History: [], Total: 0 }) : baseFetch(url);
  const result = body(await api.handler(event({ action: "matches" })));
  assert.deepEqual(result.matches, []); assert.equal(result.next, null);
});
test("match details belonging to another account are denied", async () => {
  const baseFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("match-details") ? reply(match({ players: [{ subject: matchId }] })) : baseFetch(url);
  assert.equal((await api.handler(event({ action: "match", id: matchId }))).statusCode, 403);
});
test("owned scoreboards resolve Riot IDs after verifying participation", async () => {
  const baseFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("match-details") ? reply(match({ roundResults: [{ roundNum: 0, winningTeam: "Blue", roundResult: "Eliminated" }] })) : String(url).includes("name-service") ? reply([{ Subject: player, GameName: "Player", TagLine: "EU" }]) : baseFetch(url);
  const result = body(await api.handler(event({ action: "match", id: matchId })));
  assert.equal(result.players[0].name, "Player#EU"); assert.equal(result.players[0].acs, 200);
  assert.equal(result.rounds[0].number, 1);
});
test("invalid IDs, actions, queue and page inputs never call Riot", async () => {
  for (const q of [{ action: "match", id: "../secrets" }, { action: "matches", start: "-1" }, { action: "matches", start: "NaN" }, { action: "matches", queue: "invalid" }, { action: "catalog", kind: "invalid" }, { action: "unknown" }]) assert.equal((await api.handler(event(q))).statusCode, 400);
});
test("rate limits are returned with Retry-After without leaking upstream bodies", async () => {
  globalThis.fetch = async () => reply({ secret: "never-return-this" }, 429, { "Retry-After": "17" });
  const result = await api.handler(event({ action: "matches" }));
  assert.equal(result.statusCode, 429); assert.equal(result.headers["Retry-After"], "17"); assert.ok(!result.body.includes("never-return-this"));
});
test("dashboard uses valid samples and does not invent rank or RR", async () => {
  const baseFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("name-service") ? reply([{ GameName: "Test", TagLine: "EU" }]) : String(url).includes("/mmr/") ? reply({}) : String(url).includes("match-history") ? reply({ History: [{ MatchID: matchId }], Total: 1 }) : String(url).includes("match-details") ? reply(match()) : baseFetch(url);
  const result = body(await api.handler(event({ action: "dashboard" })));
  assert.equal(result.profile.tier, null); assert.equal(result.profile.rr, null);
  assert.equal(result.performance.acs, 200); assert.equal(result.performance.kd, 2); assert.equal(result.performance.sampleSize, 1);
});
test("store resolves level IDs and VP, including absent Night Market", async () => {
  const baseFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("weapons/skins") ? reply({ data: [{ uuid: player, displayName: "Test skin", displayIcon: "https://example.test/skin.png", levels: [{ uuid: matchId }] }] }) : String(url).includes("storefront") ? reply({ SkinsPanelLayout: { SingleItemOffers: [matchId], SingleItemStoreOffers: [{ OfferID: matchId, Rewards: [{ ItemID: matchId }], Cost: { "85ad13f7-3d1b-5128-9eb2-7cd8a5cfeae3": 1775 } }], SingleItemOffersRemainingDurationInSeconds: 600 } }) : baseFetch(url);
  const result = body(await api.handler(event({ action: "store", lang: "tr" })));
  assert.equal(result.daily[0].name, "Test skin"); assert.equal(result.daily[0].vp, 1775); assert.deepEqual(result.nightMarket, []); assert.ok(result.expiresAt > Date.now());
});
test("status distinguishes outage from an operational region", async () => {
  globalThis.fetch = async url => String(url).includes("/eu.json") ? reply({ incidents: [{ id: 1, titles: [{ locale: "en_US", content: "Incident" }], updates: [{ translations: [{ locale: "en_US", content: "Investigating" }] }] }] }) : String(url).includes("/kr.json") ? reply({}, 503) : reply({ incidents: [], maintenances: [] });
  const result = body(await api.handler({ headers: {}, queryStringParameters: { action: "status" } }));
  assert.equal(result.regions.find(r => r.id === "eu").state, "incident"); assert.equal(result.regions.find(r => r.id === "kr").state, "unknown"); assert.equal(result.regions.find(r => r.id === "na").state, "operational");
});
test("all companion copy keys exist in the four required locales", () => {
  const en = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url), "utf8")).companion;
  for (const locale of ["ar", "de", "tr"]) {
    const dict = JSON.parse(readFileSync(new URL(`../lang/${locale}.json`, import.meta.url), "utf8")).companion;
    for (const key of Object.keys(en)) {
      assert.equal(typeof dict[key], "string", `${locale}.${key}`);
      assert.ok(!dict[key].includes("?"), `${locale}.${key}: corrupted copy`);
    }
    if (locale === "ar") assert.match(dict.dashboard, /[\u0600-\u06ff]/);
  }
});
