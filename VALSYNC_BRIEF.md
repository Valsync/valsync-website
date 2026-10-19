# VALSYNC — Product Brief

## Overview

VALSYNC is a **privacy-first, zero-ads tactical companion for Valorant players**. It surfaces stats, store, party, social, wiki, and replay in a single app — calm, fast, and quietly competent. No hype, no banners, no tracking.

**Status**: Early access (v1.0.9) — waitlist open.  
**Platform**: Android (`com.valsync.app`) — Web app coming.  
**Contact**: abdullaheltiby@tutamail.com  
**Support**: Liberapay donations.

---

## Brand

| Attribute | Description |
|-----------|-------------|
| **Personality** | Tactical. Understated. Earnest. |
| **Design North Star** | "The Tactical Readout" — a HUD that earns its place mid-match. |
| **Anti-references** | No esports neon (BLITZ.gg), no corporate SaaS cream (Monday.com), no glassmorphism, no AD-heavy trackers. |
| **Voice** | Player-native language. Privacy is visible immediately. Trust before conversion. |

---

## Product Philosophy

1. **Readout, not billboard** — information first, decoration never competes.
2. **Privacy is visible** — the no-ads/no-tracking promise is surfaced immediately and repeatedly.
3. **Tactical restraint** — every color, line, and animation earns its place in a mid-match context.
4. **Player-native language** — copy feels made by people who play Valorant.
5. **Trust before conversion** — credibility signals sit beside the download CTA.
6. **Dark-first** — never light-by-default. A Radiant player checks their companion app late at night.

---

## Design System (Signal Palette)

| Token | oklch | Role |
|-------|-------|------|
| Void Navy | `0.127 0.033 254` | App canvas, body bg |
| Surface Steel | `0.162 0.031 253` | Cards, panels, feature items |
| Surface Elevated | `0.208 0.028 253` | Hover states, lifted containers |
| Signal Red | `0.628 0.223 22` | CTAs, hero accent, primary buttons |
| Telemetry Cyan | `0.779 0.187 171` | Information, focus rings, hover states |
| Telemetry Gold | `0.804 0.143 85` | Highlights, trust signals |
| Telemetry Green | `0.65 0.17 145` | Positive/trust signals, success |
| Ink Primary | `0.919 0.012 255` | Body text, headings |
| Ink Muted | `0.65 0.01 255` | Secondary text, meta |
| Border Divider | `0.30 0.02 255` | Dividers, card borders |

**Typography**: Saira (variable 100-900 weight, 75-125 width). Single family, no second font.

**Elevation**: Tonal layering (lightness shifts), **zero box-shadows**.

**Texture**: Subtle scanline overlay (2.5% opacity, `repeating-linear-gradient`, CRT nod).

**Accessibility**: WCAG 2.1 AA, `prefers-reduced-motion`, color-blind-safe encoding, Signal Red not used for passive elements.

---

## App Features (Android)

| Module | Description |
|--------|-------------|
| **Store Checker** | Valorant daily shop, Night Market, skin watchlist — one surface, no tab chaos. |
| **Party Status** | Online status, mid-match detection, missing role in stack. |
| **Match Review** | Per-player clutch %, double/triple/quadra/ACE counts, first-blood detection, HS%, map tendencies, extended stats (ACS, KDA, K-D). |
| **Loadout Deck** | Collection, presets, favorites, VP pricing with per-region FX rates. |
| **Social View** | Friends list, party context, online status. |
| **Live Match Panel** | Dodge dialog, enemy intel, telemetry probe (embedded in Party). |
| **Notifications** | Foreground service — friends online, store/Night Market skin restocks. |
| **Watchlist Alerts** | Skin watchlist notifications for store and Night Market. |
| **History** | Animated analytics card, filters, date-bucket grouping. |
| **Settings** | Language switch, app info, theme preferences. |

### Auth & Security

- Riot RSO sign-in via OAuth PKCE flow.
- Encrypted token storage (Android Keystore-backed AES).
- Full-screen WebView for Riot auth with system back + close button.
- R8 minification, debug-only cleartext traffic.

### Tech Stack

- **Language**: Kotlin
- **Architecture**: Unspecified (likely MVVM/standard Android patterns)
- **API**: Riot Games API (async/awaitAll for parallel player builds)
- **Auth**: Riot RSO WebView, standalone Activity

### Release History Highlight

| Version | Date | Notable |
|---------|------|---------|
| v1.0.0 | 2026-06-13 | Early-access launch: store, party, matches, wiki, social |
| v1.0.2 | 2026-06-23 | Rebrand from ValPaw → VALSYNC, PKCE auth, i18n (EN/AR/TR/DE) |
| v1.0.4 | 2026-07-04 | Watchlist alerts, match trends/advisor, lineup details |
| v1.0.5 | 2026-07-05 | Clutch %, multi-kill counters, first-blood detection |
| v1.0.6 | 2026-07-06 | Live match panel, dodge dialog, enemy intel |
| v1.0.9 | 2026-07-09 | Background notifications, login consent gate, VP pricing, filters |

---

## Website (Marketing + Legal Presence)

**URLs**:  
- GitHub Pages: `valsync.github.io/valsync-website/`  
- Surge: `www.valsync.website`  
- Terms: `/terms.html`  
- Privacy: `/privacy.html`  
- Phone Demo: `/mobile.html`  

### Website Tech Stack

- Pure HTML/CSS/JS — **zero dependencies, zero npm packages**.
- CSS custom properties with OKLCH color space.
- Custom i18n system (`data-i18n` attributes, JSON translation files, localStorage persistence, URL `?lang=` param).
- Languages: English, Arabic (RTL), Turkish, German.
- Dark mode only (`color-scheme: dark`).
- IntersectionObserver for scroll-reveal animations.
- `clamp()`-based fluid typography.
- Schema.org JSON-LD structured data (WebSite, Organization, MobileApplication, FAQPage).
- Sitemap + robots.txt.

### Website Pages

| Page | Content |
|------|---------|
| **index.html** | Hero, HUD mockup, features (store/party/review), demo, privacy posture, release timeline, web app teaser, comparisons, FAQ, CTA waitlist, footer |
| **privacy.html** | Privacy Policy with AI explainer (one-click AI assistant buttons) |
| **terms.html** | Terms of Use with AI explainer |
| **mobile.html** | Standalone interactive phone demo (swipeable app screenshots) |

### Site Features

- **AI Explainer**: On legal pages, buttons for ChatGPT/Claude/Gemini/Grok/Mistral/Perplexity/DeepSeek/Qwen. Copies page text + opens prompt. Toast for providers that ignore `?q=` prefill (DeepSeek, Gemini, Qwen).
- **Language Switcher**: 4 languages (EN/AR/TR/DE) via nav buttons, persisted to localStorage.
- **Phone Carousel**: Interactive phone mockup with swipeable screenshots (Home, Store, Party, Matches, Loadout, Social).
- **Gaza Banner**: Fixed-position solidarity banner with conditional display.
- **Back-to-Top**: Fixed scroll-to-top button after 400px scroll.
- **Scroll Reveal**: Sections animate in via IntersectionObserver with staggered delays.
- **Privacy Panel**: 4-column grid: 0 ads, no tracking, Riot handoff, flat surfaces.

---

## Deployment

| Target | URL | Method |
|--------|-----|--------|
| GitHub | `github.com/AbdullahElTiby/valsync-website` | `git push origin main` |
| GitHub Pages | `valsync.github.io/valsync-website/` | Auto-deploys from `main /` root |
| Surge | `www.valsync.website` | `surge . www.valsync.website` |

No CI/CD pipeline — manual deploys to both.

---

## Current Development Focus

- **Web App** — Bringing the companion to the browser (in-progress, waitlist for notification).
- **Game Responsiveness** — Improving mobile layout and touch interaction for game-facing views (spec in `specs/001-fix-game-responsiveness/`).
- **i18n** — Expanding translation coverage.
- **Privacy Hardening** — Ongoing.

---

## Competitive Positioning

VALSYNC differentiates from:
- **BLITZ.gg / Porofessor.gg** — No esports neon, no glow gradients, no ad inventory.
- **OP.GG** — No table-heavy stat sprawl, no banner ads.
- **Generic SaaS** — No pastel cream/blue, no corporate rhythm.
- **Ad-first "free" apps** — Zero banners, zero tracking, zero data brokerage.

**Core differentiator**: Privacy is the product, not a compliance page.
