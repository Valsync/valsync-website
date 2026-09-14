import { clearCookie, json } from "./_riot";

export default async function handler() {
  return json(200, { ok: true }, {
    "Set-Cookie": clearCookie("valsync_rso_session"),
  });
}
