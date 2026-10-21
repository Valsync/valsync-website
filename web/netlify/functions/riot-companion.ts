import { netlify } from "./_riot";
import { getBrowserPair, pairEnabled } from "./_pairing";
import { clientPlatform, configured, getSession, json, privateDataEnabled, readSession, request, shards, UpstreamError, type HandlerEvent, type Session } from "./_riot";
import type { CatalogData, CatalogItem, CatalogKind, DashboardData, MatchDetail, MatchesData, MatchSummary, SessionData, StatusData, StoreData, StoreOffer, TiersData } from "../../lib/companion-types";

type Player = { subject?: string; gameName?: string; tagLine?: string; teamId?: string; characterId?: string; stats?: { kills?: number; deaths?: number; assists?: number; score?: number; roundsPlayed?: number; performanceScore?: number }; scores?: { TempValueF?: number } };
type RiotMatch = { matchInfo?: { matchId?: string; mapId?: string; gameStartMillis?: number; queueID?: string }; players?: Player[]; teams?: { teamId?: string; won?: boolean; roundsWon?: number }[]; roundResults?: { roundNum?: number; winningTeam?: string; roundResult?: string }[] };
type PublicItem = { uuid: string; displayName?: string; displayIcon?: string; fullPortrait?: string; splash?: string; description?: string; mapUrl?: string; role?: { displayName?: string }; abilities?: { displayName?: string; description?: string }[]; weaponStats?: { fireRate?: number; magazineSize?: number }; gridName?: string; skins?: PublicItem[]; levels?: PublicItem[] };
const stamp = () => new Date().toISOString();
const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const publicCache = new Map<string, { until: number; value: unknown }>();
async function cached<T>(url: string, ttl = 300_000): Promise<T> {
  const previous = publicCache.get(url);
  if (previous && previous.until > Date.now()) return previous.value as T;
  const value = await request<T>(url);
  if (publicCache.size >= 32) publicCache.delete(publicCache.keys().next().value!);
  publicCache.set(url, { until: Date.now() + ttl, value });
  return value;
}
const languages: Record<string, string> = { en: "en-US", ar: "ar-AE", de: "de-DE", tr: "tr-TR" };
export async function catalog(kind: CatalogKind, lang: string): Promise<CatalogData> {
  const endpoint = kind === "skins" ? "weapons/skins" : kind;
  const body = await cached<{ data: PublicItem[] }>(`https://valorant-api.com/v1/${endpoint}?language=${languages[lang] ?? "en-US"}${kind === "agents" ? "&isPlayableCharacter=true" : ""}`);
  const items: CatalogItem[] = body.data.map(item => ({
    id: kind === "maps" ? item.mapUrl ?? item.uuid : item.uuid, uuid: item.uuid,
    // The app bleeds the map splash into the match card behind the stat
    // column (HistoryMatchRow), so the art has to travel with the map.
    art: kind === "maps" ? item.splash ?? null : null,
    name: item.displayName ?? item.uuid,
    image: item.displayIcon ?? item.fullPortrait ?? item.splash ?? item.levels?.[0]?.displayIcon ?? null,
    description: item.description ?? item.gridName ?? "",
    facts: [...(item.role?.displayName ? [item.role.displayName] : []), ...(item.abilities ?? []).map(a => `${a.displayName ?? ""}: ${a.description ?? ""}`), ...(item.weaponStats ? [`${item.weaponStats.fireRate ?? "—"} / s · ${item.weaponStats.magazineSize ?? "—"}`] : [])],
  }));
  return { items, fetchedAt: stamp() };
}
// The live competitive tier table carries the rank emblems. The newest table
// (highest tier index) is the one the game uses today: 0 unranked, 3 iron 1
// ... 27 radiant. Only the known Riot media host is allowed through.
export async function rankTiers(): Promise<TiersData> {
  const body = await cached<{ data?: { uuid: string; tiers?: { tier: number; tierName?: string; divisionName?: string; color?: string; largeIcon?: string }[] }[] }>("https://valorant-api.com/v1/competitivetiers", 21_600_000);
  const assets = body.data ?? [];
  const asset = assets.reduce<{ uuid: string; tiers?: { tier: number; tierName?: string; divisionName?: string; color?: string; largeIcon?: string }[] } | null>((best, candidate) => {
    const tiers = candidate.tiers ?? [];
    if (!tiers.length) return best;
    const last = Math.max(...tiers.map(t => t.tier));
    const bestLast = best?.tiers?.length ? Math.max(...best.tiers.map(t => t.tier)) : -1;
    return last > bestLast ? candidate : best;
  }, null);
  const tiers = (asset?.tiers ?? []).map(tier => ({
    tier: tier.tier,
    name: tier.tierName ?? "",
    division: tier.divisionName ?? "",
    color: tier.color ?? "",
    icon: tier.largeIcon && /^https:\/\/media\.valorant-api\.com\/competitivetiers\//.test(tier.largeIcon) ? tier.largeIcon : null,
  }));
  return { tiers, fetchedAt: stamp() };
}
export async function serviceStatus(lang: string): Promise<StatusData> {
  type Incident = { id?: number; updated_at?: string; titles?: { locale?: string; content?: string }[]; updates?: { created_at?: string; updated_at?: string; translations?: { locale?: string; content?: string }[] }[] };
  const locale = (languages[lang] ?? "en-US").replace("-", "_");
  const translate = (entries: { locale?: string; content?: string }[] = []) => entries.find(e => e.locale?.toLowerCase() === locale.toLowerCase())?.content ?? entries.find(e => e.locale?.toLowerCase() === "en_us")?.content ?? entries[0]?.content ?? "";
  const regions: StatusData["regions"] = await Promise.all(shards.map(async id => {
    try {
      const body = await cached<{ incidents?: Incident[]; maintenances?: Incident[] }>(`https://valorant.secure.dyn.riotcdn.net/channels/public/x/status/${id}.json`, 60_000);
      const incidents = body.incidents ?? []; const maintenances = body.maintenances ?? [];
      return { id, state: incidents.length ? "incident" as const : maintenances.length ? "maintenance" as const : "operational" as const, items: [...incidents, ...maintenances].map(item => ({ id: String(item.id), title: translate(item.titles), description: translate(item.updates?.[0]?.translations), updatedAt: item.updated_at ?? item.updates?.[0]?.created_at ?? null })) };
    } catch { return { id, state: "unknown" as const, items: [] }; }
  }));
  return { regions, fetchedAt: stamp() };
}
async function riotClient(session: Session) {
  const version = await cached<{ data?: { riotClientVersion?: string } }>("https://valorant-api.com/v1/version");
  if (!version.data?.riotClientVersion) throw new Error("client_version_unavailable");
  const origin = `https://pd.${session.shard}.a.pvp.net`;
  const headers = { Authorization: `Bearer ${session.accessToken}`, "X-Riot-Entitlements-JWT": session.entitlementsToken, "X-Riot-ClientPlatform": clientPlatform, "X-Riot-ClientVersion": version.data.riotClientVersion, "Content-Type": "application/json" };
  return <T>(path: string, init: RequestInit = {}) => request<T>(`${origin}${path}`, { ...init, headers });
}
// Riot's Performance Score (players[].scores, placeholder keys since 13.06); see the app's RiotPerformanceScores.kt.
export function performanceScore(p?: Player): number | null {
  const raw = number(p?.stats?.performanceScore) ?? number(p?.scores?.TempValueF);
  return raw === null ? null : Math.min(500, Math.max(0, Math.round(raw)));
}
export function summarize(match: RiotMatch, puuid: string, fallbackId = ""): MatchSummary {
  const me = match.players?.find(p => p.subject === puuid);
  const team = match.teams?.find(t => t.teamId === me?.teamId);
  const other = match.teams?.find(t => t.teamId !== me?.teamId);
  const tied = team?.roundsWon !== undefined && team.roundsWon === other?.roundsWon;
  return { id: match.matchInfo?.matchId ?? fallbackId, startedAt: number(match.matchInfo?.gameStartMillis), queue: match.matchInfo?.queueID ?? "", mapId: match.matchInfo?.mapId ?? "", agentId: me?.characterId ?? "", result: tied ? "draw" : team?.won === true ? "win" : team?.won === false ? "loss" : "unknown", score: team?.roundsWon !== undefined && other?.roundsWon !== undefined ? `${team.roundsWon} — ${other.roundsWon}` : null, kills: number(me?.stats?.kills), deaths: number(me?.stats?.deaths), assists: number(me?.stats?.assists) };
}
async function history(session: Session, start: number, queue: string) {
  const get = await riotClient(session);
  const data = await get<{ History?: { MatchID?: string }[]; Total?: number; EndIndex?: number }>(`/match-history/v1/history/${session.puuid}?startIndex=${start}&endIndex=${start + 10}${queue ? `&queue=${encodeURIComponent(queue)}` : ""}`);
  const entries = (data.History ?? []).filter((e): e is { MatchID: string } => Boolean(e.MatchID && uuid.test(e.MatchID)));
  const details = await Promise.all(entries.map(async entry => { const data = await get<RiotMatch>(`/match-details/v1/matches/${entry.MatchID}`); return { ...data, matchInfo: { ...data.matchInfo, matchId: entry.MatchID } }; }));
  const owned = details.filter(d => d.players?.some(p => p.subject === session.puuid));
  const next = data.Total !== undefined ? start + entries.length < data.Total && entries.length > 0 ? start + entries.length : null : entries.length === 10 ? start + 10 : null;
  return { details: owned, matches: owned.map(d => summarize(d, session.puuid)), next };
}
async function dashboard(session: Session): Promise<DashboardData> {
  const get = await riotClient(session);
  const [names, mmr, recent] = await Promise.all([
    get<{ GameName?: string; TagLine?: string }[]>("/name-service/v2/players", { method: "PUT", body: JSON.stringify([session.puuid]) }),
    get<{ LatestCompetitiveUpdate?: { SeasonID?: string; TierAfterUpdate?: number; RankedRatingAfterUpdate?: number }; QueueSkills?: { competitive?: { SeasonalInfoBySeasonID?: Record<string, { NumberOfGames?: number; NumberOfWins?: number }> } } }>(`/mmr/v1/players/${session.puuid}`),
    history(session, 0, "competitive"),
  ]);
  const stats = recent.details.map(d => d.players?.find(p => p.subject === session.puuid)?.stats).filter(s => s && number(s.kills) !== null && number(s.deaths) !== null && number(s.score) !== null && number(s.roundsPlayed) !== null);
  const kills = stats.reduce((n, s) => n + s!.kills!, 0); const deaths = stats.reduce((n, s) => n + s!.deaths!, 0);
  const score = stats.reduce((n, s) => n + s!.score!, 0); const rounds = stats.reduce((n, s) => n + s!.roundsPlayed!, 0);
  const dates = recent.matches.map(m => m.startedAt).filter((n): n is number => n !== null);
  const scores = recent.details.map(d => performanceScore(d.players?.find(p => p.subject === session.puuid))).filter((n): n is number => n !== null);
  // The act record, as the app's Current Act card reads it: the season block of the latest ranked update.
  const season = mmr.LatestCompetitiveUpdate?.SeasonID ? mmr.QueueSkills?.competitive?.SeasonalInfoBySeasonID?.[mmr.LatestCompetitiveUpdate.SeasonID] : undefined;
  const actMatches = number(season?.NumberOfGames); const actWins = number(season?.NumberOfWins);
  return { profile: { name: names[0]?.GameName ?? session.puuid.slice(0, 8), tag: names[0]?.TagLine ?? "", region: session.shard, tier: number(mmr.LatestCompetitiveUpdate?.TierAfterUpdate), rr: number(mmr.LatestCompetitiveUpdate?.RankedRatingAfterUpdate) }, performance: { sampleSize: recent.matches.length, wins: recent.matches.filter(m => m.result === "win").length, winRate: actMatches && actWins !== null ? Math.floor(actWins / actMatches * 100) : recent.matches.length && recent.matches.every(m => m.result !== "unknown") ? recent.matches.filter(m => m.result === "win").length / recent.matches.length * 100 : null, actMatches, actWins, kd: stats.length === recent.matches.length && stats.length && deaths ? kills / deaths : null, acs: stats.length === recent.matches.length && stats.length && rounds ? score / rounds : null, ps: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null, from: dates.length ? Math.min(...dates) : null, to: dates.length ? Math.max(...dates) : null }, matches: recent.matches, fetchedAt: stamp() };
}
async function matchDetail(session: Session, id: string): Promise<MatchDetail | null> {
  const get = await riotClient(session);
  const data = await get<RiotMatch>(`/match-details/v1/matches/${id}`);
  if (!data.players?.some(p => p.subject === session.puuid)) return null;
  const subjects = data.players.map(p => p.subject).filter((id): id is string => Boolean(id && uuid.test(id)));
  const names = await get<{ Subject?: string; GameName?: string; TagLine?: string }[]>("/name-service/v2/players", { method: "PUT", body: JSON.stringify(subjects) }).catch(() => []);
  const displayName = (p: Player) => {
    const identity = names.find(n => n.Subject === p.subject);
    const name = identity?.GameName ?? p.gameName; const tag = identity?.TagLine ?? p.tagLine;
    return name ? `${name}${tag ? `#${tag}` : ""}` : (p.subject ?? "").slice(0, 8);
  };
  return { match: summarize(data, session.puuid, id), players: data.players.map(p => ({ id: p.subject ?? "", name: displayName(p), team: p.teamId ?? "", agentId: p.characterId ?? "", kills: number(p.stats?.kills), deaths: number(p.stats?.deaths), assists: number(p.stats?.assists), acs: p.stats?.roundsPlayed && p.stats.score !== undefined ? p.stats.score / p.stats.roundsPlayed : null, ps: performanceScore(p) })), rounds: (data.roundResults ?? []).map(r => ({ number: (r.roundNum ?? 0) + 1, winner: r.winningTeam ?? "", reason: r.roundResult ?? "" })), fetchedAt: stamp() };
}
async function store(session: Session, lang: string): Promise<StoreData> {
  type Offer = { OfferID?: string; Cost?: Record<string, number>; Rewards?: { ItemID?: string }[] };
  type Storefront = { SkinsPanelLayout?: { SingleItemOffers?: string[]; SingleItemStoreOffers?: Offer[]; SingleItemOffersRemainingDurationInSeconds?: number }; BonusStore?: { BonusStoreRemainingDurationInSeconds?: number; BonusStoreOffers?: { Offer?: Offer; DiscountCosts?: Record<string, number>; DiscountPercent?: number }[] } };
  const get = await riotClient(session);
  const [data, skins] = await Promise.all([get<Storefront>(`/store/v3/storefront/${session.puuid}`, { method: "POST", body: "{}" }), catalog("skins", lang)]);
  // Currency UUID is VP; do not guess by taking the first cost entry.
  const vpId = "85ad13f7-3d1b-5128-9eb2-7cd8a5cfeae3";
  const raw = await cached<{ data: PublicItem[] }>(`https://valorant-api.com/v1/weapons/skins?language=${languages[lang] ?? "en-US"}`);
  const skinByLevel = new Map(raw.data.flatMap(s => (s.levels ?? []).map(l => [l.uuid, skins.items.find(i => i.id === s.uuid)!] as const)));
  const offer = (id: string, itemId: string, cost?: Record<string, number>, original?: Record<string, number>, discount?: number): StoreOffer => {
    const skin = skinByLevel.get(itemId);
    return { id, name: skin?.name ?? itemId, image: skin?.image ?? null, vp: number(cost?.[vpId]), originalVp: number(original?.[vpId]), discount: number(discount) };
  };
  const panel = data.SkinsPanelLayout;
  const offers = panel?.SingleItemStoreOffers ?? [];
  const daily = (panel?.SingleItemOffers ?? offers.map(o => o.OfferID ?? "")).map(id => { const o = offers.find(o => o.OfferID === id); return offer(id, o?.Rewards?.[0]?.ItemID ?? id, o?.Cost); });
  const expiry = (seconds: unknown) => number(seconds) !== null ? Date.now() + Math.max(0, seconds as number) * 1000 : null;
  return { daily, nightMarket: (data.BonusStore?.BonusStoreOffers ?? []).map(o => offer(o.Offer?.OfferID ?? "", o.Offer?.Rewards?.[0]?.ItemID ?? "", o.DiscountCosts, o.Offer?.Cost, o.DiscountPercent)), expiresAt: expiry(panel?.SingleItemOffersRemainingDurationInSeconds), nightExpiresAt: expiry(data.BonusStore?.BonusStoreRemainingDurationInSeconds), fetchedAt: stamp() };
}
export async function handler(event: HandlerEvent) {
  if (event.httpMethod && event.httpMethod !== "GET") return json(405, { error: "method_not_allowed" }, { Allow: "GET" });
  const query = event.queryStringParameters ?? {}; const action = query.action ?? "session"; const lang = query.lang ?? "en";
  let paired: Awaited<ReturnType<typeof getBrowserPair>> = null;
  try {
    if (pairEnabled() && ["session", "dashboard", "matches", "match", "store"].includes(action)) paired = await getBrowserPair(event.headers);
  } catch { return json(503, { error: "pairing_unavailable" }); }
  if (action === "session") {
    if (paired?.record.snapshot) return json(200, { state: "authenticated", refreshable: false, privateDataEnabled: true, source: "phone", pairingAvailable: true, expiresAt: paired.record.expiresAt } satisfies SessionData);
    const session = configured() ? readSession(event) : null;
    const data: SessionData = { state: !configured() ? "unavailable" : !session ? "anonymous" : session.expiresAt > Date.now() ? "authenticated" : "expired", refreshable: Boolean(session?.refreshToken), privateDataEnabled: privateDataEnabled(), pairingAvailable: pairEnabled(), source: "riot", ...(session ? { expiresAt: session.expiresAt } : {}) };
    return json(200, data);
  }
  try {
    if (action === "catalog") {
      if (!["agents", "weapons", "maps", "skins"].includes(query.kind ?? "")) return json(400, { error: "invalid_kind" });
      return json(200, await catalog(query.kind as CatalogKind, lang));
    }
    if (action === "status") return json(200, await serviceStatus(lang));
    if (action === "tiers") return json(200, await rankTiers());
    if (!["dashboard", "matches", "match", "store"].includes(action)) return json(400, { error: "invalid_action" });
    if (paired?.record.snapshot) {
      const snapshot = paired.record.snapshot;
      if (Date.now() - Date.parse(snapshot.receivedAt) > 86400000) return json(503, { error: "phone_sync_required" });
      if (action === "dashboard") return json(200, snapshot.dashboard);
      if (action === "store") return snapshot.store ? json(200, snapshot.store) : json(503, { error: "phone_sync_required" });
      if (action === "match") {
        if (!uuid.test(query.id ?? "")) return json(400, { error: "invalid_match" });
        const detail = snapshot.matches.find(m => m.match.id === query.id); return detail ? json(200, detail) : json(404, { error: "phone_match_unavailable" });
      }
      const start = Number(query.start ?? "0");
      if (!Number.isInteger(start) || start < 0 || start > 1000 || !["", "competitive", "unrated", "swiftplay", "spikerush", "deathmatch", "ggteam", "premier"].includes(query.queue ?? "")) return json(400, { error: "invalid_filter" });
      const matches = snapshot.matches.map(m => m.match).filter(m => !query.queue || m.queue === query.queue);
      return json(200, { matches: matches.slice(start, start + 10), next: start + 10 < matches.length ? start + 10 : null, fetchedAt: snapshot.receivedAt } satisfies MatchesData);
    }
    if (!configured() || !privateDataEnabled()) return json(503, { error: "private_access_unavailable" });
    const session = getSession(event);
    if (!session) return json(401, { error: "not_authenticated" });
    if (action === "dashboard") return json(200, await dashboard(session));
    if (action === "store") return json(200, await store(session, lang));
    if (action === "match") {
      if (!uuid.test(query.id ?? "")) return json(400, { error: "invalid_match" });
      const detail = await matchDetail(session, query.id!);
      return detail ? json(200, detail) : json(403, { error: "match_not_owned" });
    }
    const start = Number(query.start ?? "0"); const queue = query.queue ?? "";
    if (!Number.isInteger(start) || start < 0 || start > 1000 || !["", "competitive", "unrated", "swiftplay", "spikerush", "deathmatch", "ggteam", "premier"].includes(queue)) return json(400, { error: "invalid_filter" });
    const data = await history(session, start, queue);
    const result: MatchesData = { matches: data.matches, next: data.next !== null && data.next <= 1000 ? data.next : null, fetchedAt: stamp() };
    return json(200, result);
  } catch (error) {
    if (error instanceof UpstreamError) {
      if (error.status === 429) return json(429, { error: "rate_limited" }, { "Retry-After": error.retryAfter });
      if ([401, 403].includes(error.status)) return json(error.status, { error: error.status === 401 ? "session_expired" : "endpoint_access_unavailable" });
    }
    return json(502, { error: "upstream_unavailable" });
  }
}

export default netlify(handler);
