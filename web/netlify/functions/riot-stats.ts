import { clientPlatform, getSession, json } from "./_riot";

type Event = { headers: Record<string, string | undefined> };
type RiotMatch = { matchInfo?: { matchId?: string; mapId?: string; gameStartMillis?: number }; players?: Array<{ subject?: string; teamId?: string; characterId?: string; stats?: { kills?: number; deaths?: number; assists?: number; score?: number; roundsPlayed?: number } }>; teams?: Array<{ teamId?: string; won?: boolean; roundsWon?: number }> };
const RANKS = ["Unranked", "Unused", "Unused", "Iron 1", "Iron 2", "Iron 3", "Bronze 1", "Bronze 2", "Bronze 3", "Silver 1", "Silver 2", "Silver 3", "Gold 1", "Gold 2", "Gold 3", "Platinum 1", "Platinum 2", "Platinum 3", "Diamond 1", "Diamond 2", "Diamond 3", "Ascendant 1", "Ascendant 2", "Ascendant 3", "Immortal 1", "Immortal 2", "Immortal 3", "Radiant"];

async function clientVersion() {
  const response = await fetch("https://valorant-api.com/v1/version");
  const body = await response.json() as { data?: { riotClientVersion?: string } };
  return body.data?.riotClientVersion ?? process.env.RIOT_CLIENT_VERSION ?? "";
}

export default async function handler(event: Event) {
  const session = getSession(event);
  if (!session) return json(401, { error: "not_authenticated" });
  try {
    const version = await clientVersion();
    if (!version) return json(503, { error: "client_version_unavailable" });
    const headers = { Authorization: `Bearer ${session.accessToken}`, "X-Riot-Entitlements-JWT": session.entitlementsToken, "X-Riot-ClientPlatform": clientPlatform, "X-Riot-ClientVersion": version, "Content-Type": "application/json" };
    const pd = `https://pd.${session.shard}.a.pvp.net`;
    const [nameResponse, mmrResponse, historyResponse, agentsResponse, mapsResponse] = await Promise.all([
      fetch(`${pd}/name-service/v2/players`, { method: "PUT", headers, body: JSON.stringify([session.puuid]) }),
      fetch(`${pd}/mmr/v1/players/${session.puuid}`, { headers }),
      fetch(`${pd}/match-history/v1/history/${session.puuid}?startIndex=0&endIndex=12&queue=competitive`, { headers }),
      fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true"),
      fetch("https://valorant-api.com/v1/maps"),
    ]);
    if (!historyResponse.ok || !mmrResponse.ok) return json(502, { error: "riot_stats_unavailable" });
    const names = nameResponse.ok ? await nameResponse.json() as Array<{ GameName?: string; TagLine?: string }> : [];
    const mmr = await mmrResponse.json() as { LatestCompetitiveUpdate?: { TierAfterUpdate?: number; RankedRatingAfterUpdate?: number }; QueueSkills?: Record<string, { SeasonalInfoBySeasonID?: Record<string, { CompetitiveTier?: number; Rank?: number; RankedRating?: number; NumberOfWins?: number; NumberOfGames?: number }> }> };
    const history = await historyResponse.json() as { History?: Array<{ MatchID?: string; GameStartTime?: number }> };
    const agents = agentsResponse.ok ? await agentsResponse.json() as { data?: Array<{ uuid: string; displayName: string }> } : { data: [] };
    const maps = mapsResponse.ok ? await mapsResponse.json() as { data?: Array<{ mapUrl: string; displayName: string }> } : { data: [] };
    const agentNames = new Map((agents.data ?? []).map((agent) => [agent.uuid.toLowerCase(), agent.displayName]));
    const mapNames = new Map((maps.data ?? []).map((map) => [map.mapUrl.toLowerCase(), map.displayName]));
    const entries = (history.History ?? []).filter((entry) => entry.MatchID).slice(0, 10);
    const details = await Promise.all(entries.map(async (entry) => {
      const response = await fetch(`${pd}/match-details/v1/matches/${entry.MatchID}`, { headers });
      return response.ok ? await response.json() as RiotMatch : null;
    }));
    const complete = details.filter((detail): detail is RiotMatch => Boolean(detail));
    const latest = mmr.LatestCompetitiveUpdate;
    const seasonal = Object.values(mmr.QueueSkills?.competitive?.SeasonalInfoBySeasonID ?? {}).sort((a, b) => (b.NumberOfGames ?? 0) - (a.NumberOfGames ?? 0))[0];
    const tier = seasonal?.CompetitiveTier || seasonal?.Rank || latest?.TierAfterUpdate || 0;
    const rr = seasonal?.RankedRating || latest?.RankedRatingAfterUpdate || 0;
    let wins = 0, kills = 0, deaths = 0, assists = 0, score = 0, rounds = 0;
    const byAgent = new Map<string, { played: number; wins: number; score: number; rounds: number }>();
    const matches = complete.map((match, index) => {
      const me = match.players?.find((player) => player.subject === session.puuid);
      const team = match.teams?.find((item) => item.teamId === me?.teamId);
      const opponent = match.teams?.find((item) => item.teamId !== me?.teamId);
      const victory = team?.won === true;
      const stats = me?.stats ?? {};
      kills += stats.kills ?? 0; deaths += stats.deaths ?? 0; assists += stats.assists ?? 0; score += stats.score ?? 0; rounds += stats.roundsPlayed ?? 0;
      if (victory) wins += 1;
      const agent = agentNames.get(me?.characterId?.toLowerCase() ?? "") ?? "Unknown agent";
      const current = byAgent.get(agent) ?? { played: 0, wins: 0, score: 0, rounds: 0 };
      current.played += 1; current.wins += victory ? 1 : 0; current.score += stats.score ?? 0; current.rounds += stats.roundsPlayed ?? 0; byAgent.set(agent, current);
      return { result: victory ? "Victory" : "Defeat", score: `${team?.roundsWon ?? 0} — ${opponent?.roundsWon ?? 0}`, map: mapNames.get(match.matchInfo?.mapId?.toLowerCase() ?? "") ?? "Unknown map", agent, kda: `${stats.kills ?? 0} / ${stats.deaths ?? 0} / ${stats.assists ?? 0}`, rr: "", time: index === 0 ? "Most recent" : `${index + 1} matches ago` };
    });
    const total = complete.length || 1;
    return json(200, {
      profile: { name: names[0]?.GameName || "VALORANT Player", tag: names[0]?.TagLine ? `#${names[0].TagLine}` : "", region: session.shard.toUpperCase(), rank: RANKS[tier] ?? "Unranked", rr, rrToNext: tier >= 27 ? 0 : Math.max(0, 100 - rr), season: "CURRENT ACT", lastSync: "Synced just now" },
      stats: [
        { label: "Win rate", value: `${((wins / total) * 100).toFixed(1)}%`, detail: `${wins} wins from ${complete.length} recent matches`, tone: "cyan" },
        { label: "K / D", value: deaths ? (kills / deaths).toFixed(2) : kills.toFixed(2), detail: `${kills} kills · ${deaths} deaths`, tone: "red" },
        { label: "Average combat score", value: rounds ? Math.round(score / rounds).toString() : "—", detail: "Across recent competitive matches", tone: "gold" },
        { label: "Assists / game", value: (assists / total).toFixed(1), detail: `${assists} assists in recent matches`, tone: "cyan" },
      ],
      agents: [...byAgent.entries()].map(([agent, data]) => ({ agent, played: data.played, winRate: Math.round((data.wins / data.played) * 100), acs: data.rounds ? Math.round(data.score / data.rounds) : 0 })).sort((a, b) => b.played - a.played).slice(0, 3),
      matches,
    });
  } catch { return json(502, { error: "riot_stats_unavailable" }); }
}
