import { createHash, randomBytes } from "node:crypto";
import { configured, json, oauth, transactionCookie } from "./_riot";

export default async function handler() {
  if (!configured()) return json(503, { error: "riot_rso_not_configured" });
  const verifier = randomBytes(48).toString("base64url");
  const state = randomBytes(24).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const clientId = process.env.RIOT_RSO_CLIENT_ID!;
  const redirect = process.env.RIOT_RSO_REDIRECT_URI!;
  const scope = process.env.RIOT_RSO_SCOPE ?? "openid";
  const url = new URL(`${oauth.origin}/authorize`);
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirect, response_type: "code", scope, state, code_challenge: challenge, code_challenge_method: "S256" }).toString();
  return { statusCode: 302, headers: { Location: url.toString(), "Set-Cookie": transactionCookie({ state, verifier, expiresAt: Date.now() + 600_000 }) }, body: "" };
}
