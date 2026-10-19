import { netlify } from "./_riot";
import { clearSessionCookies, json, requirePost, type HandlerEvent } from "./_riot";
export async function handler(event: HandlerEvent) {
  const rejected = requirePost(event);
  if (rejected) return rejected;
  return { ...json(200, { ok: true }), multiValueHeaders: { "Set-Cookie": clearSessionCookies() } };
}

export default netlify(handler);
