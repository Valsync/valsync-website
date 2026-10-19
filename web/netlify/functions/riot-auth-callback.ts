import { netlify } from "./_riot";
import { clearCookie, configured, getTransaction, makeSessionCookies, sameValue, setupSession, tokenRequest, transactionCookieName, type HandlerEvent, type HandlerResponse } from "./_riot";
type Transaction = { state: string; verifier: string; expiresAt: number };
export async function handler(event: HandlerEvent): Promise<HandlerResponse> {
  const query = event.queryStringParameters ?? {};
  const fail = (reason: string): HandlerResponse => ({ statusCode: 302, headers: { Location: `/play.html?auth=${reason}`, "Cache-Control": "no-store", "Set-Cookie": clearCookie(transactionCookieName) }, body: "" });
  if (!configured()) return fail("unavailable");
  const transaction = getTransaction<Transaction>(event);
  if (!transaction || transaction.expiresAt < Date.now() || !query.state || !sameValue(transaction.state, query.state)) return fail("invalid");
  if (query.error) return fail("cancelled");
  if (!query.code) return fail("invalid");
  try {
    const tokens = await tokenRequest(new URLSearchParams({ grant_type: "authorization_code", code: query.code, redirect_uri: process.env.RIOT_RSO_REDIRECT_URI!, code_verifier: transaction.verifier }));
    const session = await setupSession(tokens);
    return { statusCode: 302, headers: { Location: "/play.html", "Cache-Control": "no-store" }, multiValueHeaders: { "Set-Cookie": [...makeSessionCookies(session), clearCookie(transactionCookieName)] }, body: "" };
  } catch { return fail("failed"); }
}

export default netlify(handler);
