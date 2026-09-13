# Riot stats bridge

These functions let the static site show only the currently authenticated
player's VALORANT data. Tokens are held in an encrypted, HttpOnly, short-lived
cookie; they are never returned to browser JavaScript.

Configure these values in Netlify, not in `.env` committed to the repository:

- `RIOT_RSO_CLIENT_ID`
- `RIOT_RSO_CLIENT_SECRET`
- `RIOT_RSO_REDIRECT_URI` — exactly `https://<production-domain>/.netlify/functions/riot-auth-callback`
- `RIOT_SESSION_SECRET` — a random string at least 32 characters long
- `RIOT_RSO_SCOPE` — optional; use the scopes approved by Riot for VALSYNC
- `NEXT_PUBLIC_RIOT_STATS_ENABLED=true` — enables the website’s sign-in button

Riot must approve the RSO client and the redirect URI before sign-in will work.
The deployed site calls `/.netlify/functions/riot-auth-start` and
`/.netlify/functions/riot-stats` on its own origin, so no Riot credential is
ever included in the static export.
