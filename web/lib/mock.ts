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
