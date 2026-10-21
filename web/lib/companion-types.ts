export type SessionData = { state: "authenticated" | "anonymous" | "expired" | "unavailable"; refreshable: boolean; privateDataEnabled: boolean; expiresAt?: number; pairingAvailable?: boolean; source?: "phone" | "riot" };
export type CatalogKind = "agents" | "weapons" | "maps" | "skins";
export type CatalogItem = { id: string; name: string; image: string | null; description: string; facts: string[]; uuid?: string; art?: string | null };
export type CatalogData = { items: CatalogItem[]; fetchedAt: string };
export type RankTier = { tier: number; name: string; division: string; color: string; icon: string | null };
export type TiersData = { tiers: RankTier[]; fetchedAt: string };
export type MatchSummary = {
  id: string; startedAt: number | null; queue: string; mapId: string; agentId: string;
  result: "win" | "loss" | "draw" | "unknown";
  score: string | null; kills: number | null; deaths: number | null; assists: number | null;
};
export type MatchDetail = {
  match: MatchSummary;
  players: { id: string; name: string; team: string; agentId: string; kills: number | null; deaths: number | null; assists: number | null; acs: number | null; ps?: number | null }[];
  rounds: { number: number; winner: string; reason: string }[]; fetchedAt: string;
};
export type MatchesData = { matches: MatchSummary[]; next: number | null; fetchedAt: string };
export type DashboardData = {
  profile: { name: string; tag: string; region: string; tier: number | null; rr: number | null };
  // Win rate and actMatches are the current act's record (Riot's season block); kd and ps
  // come from the latest ranked sample (sampleSize matches), same as the app's Current Act card.
  performance: { sampleSize: number; wins: number; winRate: number | null; actMatches?: number | null; actWins?: number | null; kd: number | null; acs: number | null; ps?: number | null; from: number | null; to: number | null };
  matches: MatchSummary[]; fetchedAt: string;
};
export type StoreOffer = { id: string; name: string; image: string | null; vp: number | null; originalVp: number | null; discount: number | null };
export type StoreData = { daily: StoreOffer[]; nightMarket: StoreOffer[]; expiresAt: number | null; nightExpiresAt: number | null; fetchedAt: string };
export type StatusData = { regions: { id: string; state: "operational" | "incident" | "maintenance" | "unknown"; items: { id: string; title: string; description: string; updatedAt: string | null }[] }[]; fetchedAt: string };
