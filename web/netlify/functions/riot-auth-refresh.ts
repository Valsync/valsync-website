import { netlify } from "./_riot";
import { clearSessionCookies, configured, json, makeSessionCookies, readSession, requirePost, setupSession, tokenRequest, UpstreamError, type HandlerEvent } from "./_riot";
export async function handler(event: HandlerEvent) {
  const rejected = requirePost(event);
  if (rejected) return rejected;
  if (!configured()) return json(503, { error: "riot_rso_not_configured" });
  const previous = readSession(event);
  if (!previous?.refreshToken) return json(401, { error: "not_authenticated" });
  try {
    const tokens = await tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: previous.refreshToken }));
    tokens.refresh_token ??= previous.refreshToken;
    const session = await setupSession(tokens, previous.refreshUntil);
    if (session.puuid !== previous.puuid) throw new Error("account_mismatch");
    return { ...json(200, { ok: true }), multiValueHeaders: { "Set-Cookie": makeSessionCookies(session) } };
  } catch (error) {
    if (error instanceof UpstreamError && [400, 401, 403].includes(error.status)) return { ...json(401, { error: "session_expired" }), multiValueHeaders: { "Set-Cookie": clearSessionCookies() } };
    return json(503, { error: "refresh_unavailable" });
  }
}

export default netlify(handler);
