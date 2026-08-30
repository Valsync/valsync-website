# Support replies

Each file here is one reply to one in-app bug report or feature/language request. The VALSYNC
Android app polls `https://valsync.surge.sh/support/<ticket-id>.json` for the ticket ids it
minted, and shows the reply under **Settings → My reports**.

`*.md` is in `.surgeignore`, so this README stays out of the deploy. The `.json` files ship.

## Replying

The report arrives by email with the ticket id in the subject: `Bug Report - ValSync [vs-1a2b…]`.

```
cd web
npm run reply -- vs-1a2b3c4d5e6f708192a3b4c5 "Fixed in 1.7.1 — thanks for the screenshot." fixed
```

Then deploy the site. The app rechecks every 6 hours, and immediately when the user opens
My Reports.

The script validates the ticket id against the same pattern the app uses. That matters: a typo'd
id writes a file nothing ever requests, and there is no error anywhere — it just looks to the
user like you never replied.

## Status values

| value | badge in app |
|---|---|
| `fixed`, `done`, `released` | FIXED |
| `planned`, `queued`, `accepted` | PLANNED |
| `wontfix`, `wont_fix`, `declined`, `rejected` | WON'T FIX |
| `need_info`, `needinfo`, `question` | NEED INFO |
| omitted or unrecognised | REPLIED |

An unrecognised value degrades to REPLIED rather than dropping the reply, so a typo never
silently loses an answer.

## Format

Only `message` is required.

```json
{
  "message": "Fixed in 1.7.1 — the heat map was drawing rotated.",
  "status": "fixed"
}
```

## Privacy

**These files are public to anyone holding the ticket id.** The id is 96 bits of `SecureRandom`,
so replies are *unlisted*, not *private* — nobody can enumerate them (there is no index, and a
wrong id just 404s), but treat one as something a link holder could read:

- no personal data, no account details, no Riot IDs
- nothing you would not put on a public issue tracker

Anything sensitive goes by email instead. The reporter's address is required at submission and
lands in `Reply-To`, so hitting Reply in your mail client works.

## Retention

The app stops polling a ticket 30 days after it was filed. A reply published later still shows
if the user opens My Reports, but no notification fires. Old files can be deleted once the
tickets they answer are well past that window.

## Deploy note

`support/` is not in the `COPY` allowlist in `web/scripts/sync-mirror.mjs`, so
`npm run sync-mirror` leaves it alone. Regenerating the static mirror will not wipe your replies.
