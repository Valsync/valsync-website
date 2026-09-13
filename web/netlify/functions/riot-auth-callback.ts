import { clearCookie, configured, getTransaction, json, makeSessionCookie, sameValue, transactionCookieName } from "./_riot";

type Event = { headers: Record<string, string | undefined>; queryStringParameters?: Record<string, string | undefined> };
type Transaction = { state: string; verifier: string; expiresAt: number };

export default async function handler(event: Event) {
  const query = event.queryStringParameters ?? {};
  const fail = (reason: string) => json(400, { error: reason }, { "Set-Cookie": clearCookie(transactionCookieName) });
  if (!configured()) return fail("riot_rso_not_configured");
  const transaction = getTransaction<Transaction>(event);
  if (!transaction || transaction.expiresAt < Date.now() || !query.state || !sameValue(transaction.state, query.state) || !query.code) return fail("invalid_authorization_response");
  try {
    const tokenResponse = await fetch("https://auth.riotgames.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${process.env.RIOT_RSO_CLIENT_ID}:${process.env.RIOT_RSO_CLIENT_SECRET}`).toString("base64")}` },
      body: new URLSearchParams({ grant_type: "authorization_code", code: query.code, redirect_uri: process.env.RIOT_RSO_REDIRECT_URI!, code_verifier: transaction.verifier }),
    });
    if (!tokenResponse.ok) return fail("token_exchange_failed");
    const tokens = await tokenResponse.json() as { access_token?: string; id_token?: string; expires_in?: number };
    if (!tokens.access_token || !tokens.id_token) return fail("token_response_incomplete");
    const [entitlementsResponse, userResponse, regionResponse] = await Promise.all([
      fetch("https://entitlements.auth.riotgames.com/api/token/v1", { method: "POST", headers: { Authorization: `Bearer ${tokens.access_token}` } }),
      fetch("https://auth.riotgames.com/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } }),
      fetch("https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant", { method: "PUT", headers: { Authorization: `Bearer ${tokens.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id_token: tokens.id_token }) }),
    ]);
    if (!entitlementsResponse.ok || !userResponse.ok || !regionResponse.ok) return fail("riot_session_setup_failed");
    const entitlement = await entitlementsResponse.json() as { entitlements_token?: string };
    const user = await userResponse.json() as { sub?: string };
    const region = await regionResponse.json() as { affinities?: { live?: string } };
    if (!entitlement.entitlements_token || !user.sub || !region.affinities?.live) return fail("riot_session_incomplete");
    // The one encrypted HttpOnly cookie contains the short-lived Riot session.
    // Keeping the expired transaction cookie is harmless and avoids relying on
    // host-specific multi-Set-Cookie header behavior.
    const headers = { "Set-Cookie": makeSessionCookie({ accessToken: tokens.access_token, entitlementsToken: entitlement.entitlements_token, puuid: user.sub, shard: region.affinities.live, expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000 }) };
    return { statusCode: 302, headers: { Location: "/#dashboard", ...headers }, body: "" };
  } catch { return fail("riot_session_setup_failed"); }
}
