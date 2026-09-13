export type Region = "NA" | "EU" | "AP" | "KR" | "BR" | "LATAM";

export const REGIONS: Region[] = ["NA", "EU", "AP", "KR", "BR", "LATAM"];

export type Rank =
  | "Radiant"
  | "Immortal 3"
  | "Immortal 2"
  | "Immortal 1"
  | "Ascendant 3"
  | "Ascendant 2"
  | "Ascendant 1"
  | "Diamond 3";

export type LeaderboardEntry = {
  rank: number;
  name: string;
  tag: string;
  tier: Rank;
  winRate: number;
  region: Region;
};

// Placeholder handles, not real players: the ladder is not live yet, so the
// rows must not read as real rankings or attribute invented win rates to
// anyone. Swap this for the API once the app ships a leaderboard.
export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Player One",   tag: "NA1", tier: "Radiant", winRate: 71, region: "NA" },
  { rank: 2, name: "Player Two",   tag: "BR1", tier: "Radiant", winRate: 69, region: "BR" },
  { rank: 3, name: "Player Three", tag: "NA1", tier: "Radiant", winRate: 68, region: "NA" },
  { rank: 4, name: "Player Four",  tag: "EU1", tier: "Radiant", winRate: 66, region: "EU" },
  { rank: 5, name: "Player Five",  tag: "NA1", tier: "Radiant", winRate: 65, region: "NA" },
];

export type EnemyPlayer = { rank: Rank; agent: string; acs: number; threat: boolean };

export const ENEMY_TEAM: EnemyPlayer[] = [
  { rank: "Radiant", agent: "Jett", acs: 312, threat: true },
  { rank: "Immortal 3", agent: "Raze", acs: 268, threat: false },
  { rank: "Ascendant 2", agent: "Omen", acs: 214, threat: false },
  { rank: "Immortal 1", agent: "Killjoy", acs: 231, threat: false },
  { rank: "Diamond 3", agent: "Sova", acs: 198, threat: false },
];

export const MATCH_PREDICTION = {
  winChance: 67,
  mvp: "Jett",
  highestThreat: "Radiant",
  avgAcs: 244,
  avgHs: 27,
};

export type Stat = { value: number; prefix?: string; suffix: string; label: string; decimals?: number };

// Every figure here has to be a real countable fact, because CountUp renders
// "{prefix}{number}{suffix}" — a slogan cannot go in this slot. Each one is
// checkable against something else in the repo: the locale files, UPDATES
// below, the app's tab bar, and the Play listing price.
export const SOCIAL_STATS: Stat[] = [
  { value: 6, suffix: "", label: "App surfaces (Home/Store/Matches/Loadout/Party/Social)" },
  { value: 4, suffix: "", label: "Languages supported (EN/AR/TR/DE)" },
  { value: 7, suffix: "", label: "Releases shipped since early access" },
  { value: 0, prefix: "$", suffix: "", label: "Cost to download" },
];

export type UpdateEntry = { version: string; date: string; body: string; tag: "latest" | "shipped" };

// Real release history, taken from versionName bumps in the Android app's
// build.gradle.kts git log plus the shipped release notes. The first entry is
// the most recent (Latest); earlier ones are Shipped. Keep this in step with
// the app — a stale changelog reads as an abandoned project.
export const UPDATES: UpdateEntry[] = [
  { version: "v1.8.1", date: "2026-08-30", tag: "latest",
    body: "In-app support inbox with reply notifications, match share cards and party invites, lobby equipped skins, agent-select signal analysis" },
  { version: "v1.7.0", date: "2026-08-21", tag: "shipped",
    body: "Language and feature requests from Settings, party invites with alerts, ad-free days for watching an ad, redesigned tactical HUD" },
  { version: "v1.5.1", date: "2026-08-16", tag: "shipped",
    body: "In-app bug reports with screenshot attachment, localization completion" },
  { version: "v1.5.0", date: "2026-08-16", tag: "shipped",
    body: "Server Status screen, Riot and Cloudflare connectivity diagnostics, 27-locale translation sweep" },
  { version: "v1.4.0", date: "2026-08-11", tag: "shipped",
    body: "Ad monetization with native ad cards, battle pass card rebuild" },
  { version: "v1.3.9", date: "2026-08-05", tag: "shipped",
    body: "Live session fixes and login stability" },
  { version: "v1.3.4", date: "2026-08-02", tag: "shipped",
    body: "Settings UI polish, account name backfilled on login" },
  { version: "v1.3.3", date: "2026-07-31", tag: "shipped",
    body: "Match history filters, synergy cards, advisor updates" },
  { version: "v1.1.2", date: "2026-07-20", tag: "shipped",
    body: "Friend opened-Valorant alerts, per-player match heat map, login terms & privacy links" },
  { version: "v1.0.9", date: "2026-07-09", tag: "shipped",
    body: "Background notifications, login consent gate, VALSYNC Plus pricing, filters" },
  { version: "v1.0.6", date: "2026-07-06", tag: "shipped",
    body: "Live match panel, dodge dialog, enemy intel" },
  { version: "v1.0.5", date: "2026-07-05", tag: "shipped",
    body: "Clutch %, multi-kill counters, first-blood detection" },
  { version: "v1.0.4", date: "2026-07-04", tag: "shipped",
    body: "Watchlist alerts, match trends, advisor, lineup details" },
  { version: "v1.0.2", date: "2026-06-23", tag: "shipped",
    body: "Rebrand from ValPaw to VALSYNC, PKCE auth, i18n (EN/AR/TR/DE)" },
  { version: "v1.0.0", date: "2026-06-13", tag: "shipped",
    body: "Early-access launch: store, party, matches, wiki, social" },
];

export const FLOATING_STATS = [
  "+28 RR",
  "92% HS",
  "5 Win Streak",
  "Radiant #74",
  "68% Win Rate",
  "ACS 312",
  "K/D 1.48",
];

// The public landing page must never pretend to expose a real ladder or
// someone else's account. This is an intentionally anonymous demo profile
// that shows the exact shape a signed-in player's personal dashboard takes.
export const PERSONAL_PROFILE = {
  name: "Your VALORANT ID",
  tag: "#0000",
  region: "EU",
  rank: "Ascendant 2" as Rank,
  rr: 74,
  rrToNext: 26,
  season: "EP9 // ACT 3",
  lastSync: "Synced just now",
};

export const PERSONAL_STATS = [
  { label: "Win rate", value: "58.3%", detail: "+4.1% this act", tone: "cyan" },
  { label: "K / D", value: "1.21", detail: "Above your average", tone: "red" },
  { label: "Average combat score", value: "236", detail: "+18 over last 10", tone: "gold" },
  { label: "Headshot rate", value: "28.6%", detail: "Top 32% of your rank", tone: "cyan" },
] as const;

export const PERSONAL_MATCHES = [
  { result: "Victory", score: "13 — 9", map: "Sunset", agent: "Omen", kda: "21 / 14 / 8", rr: "+19", time: "42 min ago" },
  { result: "Defeat", score: "11 — 13", map: "Haven", agent: "Sova", kda: "17 / 18 / 6", rr: "−16", time: "3 hr ago" },
  { result: "Victory", score: "13 — 7", map: "Lotus", agent: "Killjoy", kda: "19 / 11 / 5", rr: "+22", time: "Yesterday" },
  { result: "Victory", score: "13 — 10", map: "Ascent", agent: "Jett", kda: "24 / 16 / 3", rr: "+18", time: "Yesterday" },
] as const;

export const PERSONAL_AGENTS = [
  { agent: "Omen", played: 24, winRate: 63, acs: 228 },
  { agent: "Killjoy", played: 18, winRate: 61, acs: 217 },
  { agent: "Sova", played: 12, winRate: 58, acs: 221 },
] as const;
