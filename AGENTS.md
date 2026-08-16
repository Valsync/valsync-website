# AGENTS.md — VALSYNC website

## Layout
- `web/` — Next.js 16 static-export app. All runnable code lives here. `cd web` before any npm script.
- Root files (`index.html`, `404.html`, `_not-found.html`, `privacy.html`, `terms.html`, `mobile.html`, `app-ads.txt`, `robots.txt`, `_next/`, `img/`, the `valsync-*.png` and `mr7gmipd-playstore.png` assets) are a **generated** static mirror of the build, served by three hosts with different bases: GitHub Pages at `valsync.github.io/valsync-website/`, Surge/Netlify at the domain root. **Never copy `web/out/` to the root verbatim** — the Pages build bakes an absolute `/valsync-website` prefix that 404s on root-domain hosts. Regenerate with `npm run sync-mirror` (see Commands), which copies `web/out/` and rewrites the prefix to relative `./` paths that resolve under both bases.
- `web/out/`, `web/out-surge/`, `web/out-gh/` are build outputs. `out-surge/` and `out-gh/` are ad-hoc copy targets, not standard.
- `web/.next/`, `web/node_modules/`, `web/.opencode/node_modules/` — local.

## Commands (run inside `web/`)
- `npm run dev` — Next dev on :3000.
- `npm run build` — static export to `out/` (Pages-oriented, absolute `/valsync-website` paths).
- `GITHUB_PAGES=true npm run build && npm run sync-mirror` — the full release path: build, then regenerate the root static mirror. `sync-mirror` is `node scripts/sync-mirror.mjs`.
- `npm run lint` — only verification gate. There is no test, typecheck, or formatter script in `package.json`.
- `tsconfig.json` has `strict: true` and `@/*` → `./*` alias. Run `npx tsc --noEmit` manually if you want a typecheck.
- PostCSS uses the Tailwind v4 plugin (`@tailwindcss/postcss`); no `tailwind.config.js`.

## Hard rules
- **Base path.** `process.env.NEXT_PUBLIC_BASE_PATH` is `""` in dev, `/valsync-website` in prod. Asset `src`/`href` in app code must use the `const B = process.env.NEXT_PUBLIC_BASE_PATH;` pattern (see `web/components/Nav.tsx`). Hard-coded `/foo` breaks prod silently.
- **Never give `next/link` a `${B}`-prefixed href.** `next/link` re-applies `basePath` at runtime, producing `/valsync-website/valsync-website/...`. Use plain `<a>` for links that already carry `B` (Nav, Footer pattern), or give `Link` unprefixed hrefs.
- **Page links are `.html` in prod, `/route` in dev.** Next 16 exports flat `page.html` files and the mirror stays flat, so nav/footer links to privacy/terms/mobile must be `dev ? "/privacy" : "privacy.html"` (see `Nav.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`).
- **Next 16 is not the Next you know.** `web/AGENTS.md` has the standing warning; read `web/node_modules/next/dist/docs/` before writing Next-specific code.
- **No `next/image`.** `web/eslint.config.mjs` disables `@next/next/no-img-element`; the codebase uses plain `<img src={`${B}/...`}>` because the build is `output: "export"`.
- **Tailwind v4 only.** Tokens live in `web/app/globals.css` under `@theme inline` (colors, fonts, container). Add new tokens there, not in a config file.
- **i18n is in-house.** `web/lib/i18n.tsx` + `web/lang/{en,ar,de,tr}.json`. RTL is `ar` only; set `dir` via the provider, do not hand-write RTL CSS. Use `useI18n()` and `t("section.key")` — keys live in the JSON files.
- **Loader is intentional.** `web/app/layout.tsx:114-167` ships a "VALSYNC LINK" auth loader with an inline script that dismisses it on `window.load` (700ms min). The script string is fragile — edit carefully.
- **Unused UI components.** `web/components/ui/*` (be-ui, aceternity ports: `be-ui-bouncy-accordion`, `container-scroll-animation`, `spotlight-card`, `footer`, `table`) are not imported by `web/app/page.tsx`. Don't assume shadcn primitives are wired up; the page only uses the hand-written `web/components/*` and `lib/utils.ts` (`cn` from `clsx` + `tailwind-merge`).

## Page structure
`web/app/page.tsx` is the single home route. Section order: Hero → Ticker → Countdown → LiveMatch → Leaderboard → StatsGrid → Competitors → Updates → Faq → Pricing → FinalCta. Add a new section by creating `web/components/MySection.tsx` and importing it here. `web/app/mobile/`, `web/app/privacy/`, `web/app/terms/` are separate routes.

## Style tokens (web/app/globals.css)
- Fonts: `Barlow_Condensed` → `--font-display`, `JetBrains_Mono` → `--font-mono` (set in `app/layout.tsx:14-25`). To swap, edit those `next/font/google` calls; CSS vars propagate.
- Palette: `--ink` `#070A10`, `--ink-2` `#0D1119`, `--ink-3` `#141923`, `--bone` `#ECEEE6`, `--crimson` `#FF4655`, `--sky` `#7DD3FC`, `--amber` `#F5A524`, `--green` `#34D399`. Helpers: `text-crimson`, `text-amber`, `text-green`, `text-sky`, `text-mute`, `text-faint`, `text-bone`.
- Layout: `--container 1280px`, `--gutter clamp(20px, 4vw, 48px)`, `--nav-h 56px`. Section padding `clamp(72px, 9vw, 128px)`.
- Breakpoints actually used in CSS: 980px (hero / live-match grids), 860px (nav, grid-2-1, cta-final, legal-grid, stats-grid), 720px (leaderboard, sec-head, log-row). Stay inside these unless you have a reason.

## Conventions worth knowing
- Components are `"use client"` by default. Only `app/layout.tsx` and `app/page.tsx` stay server.
- The scoreboard / data-grid aesthetic is the brand — corner ticks, mono numerics, `1px` rules, crimson accent, no gradients on chrome. Don't add rounded card surfaces, shadows, or emoji.
- All data on the page is mocked in `web/lib/mock.ts` (players, leaderboard, live match, updates, etc.). Real Riot API integration is not wired up.
- `lib/i18n.tsx` reads `localStorage["valsync-lang"]` then `?lang=` then `navigator.language` — keep that order when adding locales.

## Repo-local skills
`T:\Code\VALSYNC-WEBSITE\.opencode\commands\speckit.*.md` — speckit workflow commands live here, not in the user's home `~/.config/opencode/`.

## Deploys
- GitHub Pages: `valsync.github.io/valsync-website`. Set `GITHUB_PAGES=true` so `web/next.config.ts` applies the `basePath`.
- Netlify + Surge: publish the repo root (the static mirror, not `web/out/`). Netlify's `netlify.toml` also sets CORS headers for `app-ads.txt` and `robots.txt`.
- The mirror is generated from `web/out/` by `npm run sync-mirror` — the rewrite makes it work at both the root domain and the `/valsync-website/` subpath. Build then sync; never copy `web/out/` to the root by hand.
