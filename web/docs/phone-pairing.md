# Android web pairing

Production: https://www.valsync.website/play.html. No browser extension or Riot credentials are required on the website.

Install an Android build containing Settings > Pair web companion, sign into Riot on the phone, create a six-digit numeric code in the browser, and approve that code in Android. Approval shares a read-only snapshot of identity, rank, up to 30 matches and store offers. Keep the app foregrounded for automatic sync, or choose Sync now. The browser shows the receipt timestamp rather than claiming a live Riot connection. Disconnect from either side to revoke access.

Netlify functions require WEB_PAIRING_ENABLED=true and a random WEB_PAIRING_SECRET of at least 32 characters. Preserve the existing production secret across deployments. The current Free Netlify account applies variables to all scopes; enhanced secret marking and granular scopes were rejected. The key stays in private Netlify environment configuration and is never exposed through public build variables or API responses. Snapshot records in Netlify Blobs are AES-GCM encrypted; browser cookies and phone writer credentials have separate secrets. Connections expire after 90 days, pending codes after ten minutes, and hourly cleanup removes revoked/expired records. Snapshots over 24 hours old are unavailable.

Run npm run deploy from web/ to build and publish the root-domain app and functions. This also stages public support replies. For the GitHub Pages mirror, separately build with GITHUB_PAGES=true and regenerate only through npm run sync-mirror. Static hosts direct account features to the canonical domain.

The debug APK installs alongside the Play build and requires its own Riot sign-in. Publishing an Android store update and comparing real-account output with Android remain release checks; fixture tests do not establish real upstream data access.

An approved connection is remembered in the same browser profile across tab closures and PC restarts. Clearing cookies, private browsing, signing out, stopping sharing, or reaching the 90-day expiry requires pairing again. The ten-minute code is used only for initial approval.

Approval attempts are capped at ten per IP hash per ten-minute window. Codes are generated cryptographically, allocated atomically without overwriting existing connections, and expire after ten minutes. Session and writer credentials remain independent random secrets.
