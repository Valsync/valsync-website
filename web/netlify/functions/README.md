# VALSYNC web companion

The static `/play` route exports to `play.html` and is account-first: Riot sign-in and one-time Android pairing are the only ways in, and a signed-in session unlocks nothing but the player's own stats and match history. Public wiki/status and the storefront endpoint still exist in the API surface but are not part of the companion UI. Private features are read-only. The primary domain `www.valsync.website` is hosted on Netlify. Static mirror links point to `https://www.valsync.website/play.html`. Pairing is a one-time approval: the browser cookie and the pair record live for 90 days, and the site's Disconnect action revokes both; see `web/docs/phone-pairing.md`.

## Production setup

Register a VALSYNC-owned Riot web RSO client and approve the exact callback. The Android public client and its WebView redirect interception cannot be reused unchanged. No approved web credentials were available during implementation.

Configure secrets in Netlify, never in committed environment files (see `web/.env.example`):

- `RIOT_RSO_CLIENT_ID` and `RIOT_RSO_CLIENT_SECRET`: the approved website client.
- `RIOT_RSO_REDIRECT_URI`: `https://www.valsync.website/.netlify/functions/riot-auth-callback`.
- `RIOT_SESSION_SECRET`: at least 32 random characters; rotation invalidates sessions.
- `RIOT_RSO_SCOPE`: only approved scopes, default `openid`.
- `RIOT_PRIVATE_API_ENABLED`: keep `false` until profile, region/entitlements, rank, history, match details and storefront access have been permitted and verified for the website client. RSO alone does not establish private endpoint access.

Do not enable private features on previews with unapproved callback domains. Public wiki/status need no Riot secrets. The old `NEXT_PUBLIC_RIOT_STATS_ENABLED` flag serves only unused legacy landing components; the web app discovers availability through its session endpoint.

## Interfaces

`GET /.netlify/functions/riot-companion` accepts:

- `action=session`: authenticated/anonymous/expired/unavailable state, refresh capability, private-data capability, optional expiry; no tokens or player identifiers.
- `action=dashboard`: current identity, available rank/RR, up to ten recent competitive matches, measured performance and sample period.
- `action=matches&start=0&queue=competitive`: ten upstream history entries, next cursor, summaries and fetch timestamp. Queue filtering runs upstream; agent/map/local-date filters apply to the displayed page, as stated in the UI. Maximum start is 1000.
- `action=match&id=<uuid>`: scoreboard and supplied round summaries, restricted to matches the session player participated in.
- `action=store&lang=en`: daily and active Night Market offers, supplied VP costs, images and expiry times. No purchasing.
- `action=catalog&kind=agents|weapons|maps|skins&lang=en|ar|de|tr`: public names, images, descriptions and facts. Other locales use English companion copy/content.
- `action=status&lang=en|ar|de|tr`: public regional incidents/maintenance; failed requests produce unknown, never operational.
- `action=tiers`: the live competitive tier table (index, name, division, colour, rank emblem URL) taken from the public tier asset; the newest table is used, and only emblems from the known Riot media host are returned.

## Sessions and failure handling

Auth uses PKCE S256, a ten-minute encrypted transaction cookie and state validation. Access/entitlements and optional refresh tokens are encrypted across at most three HttpOnly/Secure/SameSite=Lax cookies, bounded at 7500 encrypted characters. Oversized sessions fail explicitly. Tokens never reach frontend JavaScript. Refresh requires the approved client to issue refresh and ID tokens. Refresh lifetime is capped at seven days; without refresh it ends at access-token expiry.

`POST riot-auth-refresh` and `POST riot-auth-logout` require an Origin matching the configured callback plus `X-ValSync-Request: 1`. Logout clears current and legacy cookies. Private responses are `no-store`. Only public catalogs, client version and service feeds use bounded in-memory caches. Private data never enters localStorage; old synthetic sessions are removed. Previous results are marked stale; authorization failures clear displayed private results.

Upstream requests time out after twelve seconds. Rate limits return sanitized `429` with `Retry-After`. Missing fields stay unavailable. Error responses exclude upstream bodies, credentials and account data. No request-payload logging or new analytics is added. Android pairing uses encrypted Netlify Blobs records with revocation and expiration.

## Verification and release

From `web/`, run `node --import ./tests/register.mjs --test tests/companion.test.mjs tests/pairing.test.mjs tests/paired-api.test.mjs`, `npm run lint`, `npx tsc --noEmit` and `npm run build`.

For full Netlify emulation use `npx netlify dev` with uncommitted local environment settings. For exported-file browser QA, build/sync the mirror, run `node tests/dev-bridge.mjs --static`, then open `http://localhost:8888/play`. This lightweight bridge exercises native functions, but does not emulate the whole Netlify platform. Its development proxy mode requires Next on port 3000 and does not support development WebSocket upgrades; prefer static mode.

Before enabling production private access, complete a Netlify smoke check and compare a consenting account against Android: identity, shard, rank/RR, match IDs, scoreboard, daily offers and VP prices. Test cancellation, refresh and logout in isolated browser contexts. Unsupported access is a release blocker; do not substitute mock data or silently reuse Android credentials.

Build with `GITHUB_PAGES=true npm run build`, then run `npm run sync-mirror`. The script includes `play.html` and preserves `support/`. Never copy `out/` directly. Android fonts in `app/fonts` keep builds independent of Google downloads; attribution is in `app/fonts/OFL.txt`.
