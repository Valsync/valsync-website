import { netlify } from "./_riot";
import { handler as companion } from "./riot-companion";
import { json, type HandlerEvent } from "./_riot";
import type { DashboardData } from "../../lib/companion-types";
const ranks = ["Unranked", "Unused", "Unused", "Iron 1", "Iron 2", "Iron 3", "Bronze 1", "Bronze 2", "Bronze 3", "Silver 1", "Silver 2", "Silver 3", "Gold 1", "Gold 2", "Gold 3", "Platinum 1", "Platinum 2", "Platinum 3", "Diamond 1", "Diamond 2", "Diamond 3", "Ascendant 1", "Ascendant 2", "Ascendant 3", "Immortal 1", "Immortal 2", "Immortal 3", "Radiant"];
export async function handler(event: HandlerEvent) {
  const result = await companion({ ...event, queryStringParameters: { action: "dashboard" } });
  if (result.statusCode !== 200) return result;
  const data = JSON.parse(result.body) as DashboardData;
  return json(200, { profile: { name: data.profile.name, tag: data.profile.tag, region: data.profile.region, rank: data.profile.tier === null ? "Unavailable" : ranks[data.profile.tier] ?? "Unavailable", rr: data.profile.rr, rrToNext: null, season: "", lastSync: data.fetchedAt }, stats: [], matches: [] });
}

export default netlify(handler);
