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

export type PlayerPreview = {
  name: string;
  tag: string;
  region: Region;
  rank: Rank;
  agent: string;
  winRate: number;
};

export const POPULAR_PLAYERS: PlayerPreview[] = [
  { name: "TenZ", tag: "NA1", region: "NA", rank: "Radiant", agent: "Jett", winRate: 68 },
  { name: "aspas", tag: "BR1", region: "BR", rank: "Radiant", agent: "Raze", winRate: 71 },
  { name: "yay", tag: "NA1", region: "NA", rank: "Radiant", agent: "Chamber", winRate: 66 },
  { name: "Demon1", tag: "NA1", region: "NA", rank: "Immortal 3", agent: "Yoru", winRate: 63 },
  { name: "Derke", tag: "EU1", region: "EU", rank: "Radiant", agent: "Jett", winRate: 64 },
  { name: "Chronicle", tag: "EU1", region: "EU", rank: "Immortal 3", agent: "Fade", winRate: 61 },
];

export const RECENT_PLAYERS: PlayerPreview[] = [
  { name: "Sacy", tag: "BR1", region: "BR", rank: "Immortal 2", agent: "Sova", winRate: 58 },
  { name: "Zekken", tag: "NA1", region: "NA", rank: "Radiant", agent: "Raze", winRate: 65 },
  { name: "Less", tag: "BR1", region: "BR", rank: "Immortal 3", agent: "Killjoy", winRate: 60 },
];

export type LeaderboardEntry = {
  rank: number;
  name: string;
  tag: string;
  tier: Rank;
  winRate: number;
  region: Region;
};

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "yay",    tag: "NA1", tier: "Radiant", winRate: 98, region: "NA" },
  { rank: 2, name: "aspas",  tag: "BR1", tier: "Radiant", winRate: 97, region: "BR" },
  { rank: 3, name: "TenZ",   tag: "NA1", tier: "Radiant", winRate: 96, region: "NA" },
  { rank: 4, name: "Derke",  tag: "EU1", tier: "Radiant", winRate: 95, region: "EU" },
  { rank: 5, name: "Demon1", tag: "NA1", tier: "Radiant", winRate: 94, region: "NA" },
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

export type Stat = { value: number; suffix: string; label: string; decimals?: number };

export const SOCIAL_STATS: Stat[] = [
  { value: 2.8, suffix: "M+", label: "Matches Analyzed", decimals: 1 },
  { value: 500, suffix: "K+", label: "Players Tracked" },
  { value: 150, suffix: "+", label: "Countries" },
  { value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
  { value: 45, suffix: "M+", label: "Rounds Processed" },
];

export type UpdateEntry = { version: string; date: string; body: string; tag: "latest" | "shipped" };

// ponytail: real release history. v1.0.0–v1.0.9 from VALSYNC_BRIEF.md / PRODUCT.md;
// v1.1.2 from the Android app git log (build.gradle.kts + release commit).
// The first entry is the most recent (Latest); earlier ones are Shipped.
export const UPDATES: UpdateEntry[] = [
  { version: "v1.1.2", date: "2026-07-20", tag: "latest",
    body: "Friend opened-Valorant alerts, per-player match heat map, login terms & privacy links to surge.sh" },
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
