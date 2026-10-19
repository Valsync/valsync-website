"use client";

import { useEffect, useState } from "react";

export type PersonalStatsData = {
  profile: {
    name: string;
    tag: string;
    region: string;
    rank: string;
    rr: number;
    rrToNext: number;
    season: string;
    lastSync: string;
  };
  stats: Array<{
    label: string;
    value: string;
    detail: string;
    tone: "cyan" | "red" | "gold";
  }>;
  matches: Array<{
    result: "Victory" | "Defeat";
    score: string;
    map: string;
    agent: string;
    kda: string;
    rr: string;
    time: string;
  }>;
  authMethod?: "rso" | "riot-id";
};

export const VALORANT_RANKS = [
  "Unranked",
  "Iron 1", "Iron 2", "Iron 3",
  "Bronze 1", "Bronze 2", "Bronze 3",
  "Silver 1", "Silver 2", "Silver 3",
  "Gold 1", "Gold 2", "Gold 3",
  "Platinum 1", "Platinum 2", "Platinum 3",
  "Diamond 1", "Diamond 2", "Diamond 3",
  "Ascendant 1", "Ascendant 2", "Ascendant 3",
  "Immortal 1", "Immortal 2", "Immortal 3",
  "Radiant",
] as const;

export function getNextRank(currentRank: string): string {
  const index = VALORANT_RANKS.indexOf(currentRank as (typeof VALORANT_RANKS)[number]);
  if (index === -1 || index >= VALORANT_RANKS.length - 1) return "Radiant";
  return VALORANT_RANKS[index + 1];
}

export function getRankColor(rank: string): string {
  const r = rank.toLowerCase();
  if (r.includes("iron")) return "var(--rank-iron)";
  if (r.includes("bronze")) return "var(--rank-bronze)";
  if (r.includes("silver")) return "var(--rank-silver)";
  if (r.includes("gold")) return "var(--rank-gold)";
  if (r.includes("platinum")) return "var(--rank-platinum)";
  if (r.includes("diamond")) return "var(--rank-diamond)";
  if (r.includes("ascendant")) return "var(--rank-ascendant)";
  if (r.includes("immortal")) return "var(--rank-immortal)";
  if (r.includes("radiant")) return "var(--rank-radiant)";
  return "var(--cyan)";
}

type State = { status: "loading" | "anonymous" | "ready" | "error" | "unavailable"; data: PersonalStatsData | null; isLive: boolean };
export const riotSignInEnabled = process.env.NEXT_PUBLIC_RIOT_STATS_ENABLED === "true";
export function usePersonalStats() {
  const [state, setState] = useState<State>({ status: "loading", data: null, isLive: false });
  useEffect(() => {
    const controller = new AbortController();
    localStorage.removeItem("valsync_player_session");
    if (!riotSignInEnabled) {
      Promise.resolve().then(() => setState({ status: "unavailable", data: null, isLive: false }));
      return;
    }
    fetch("/.netlify/functions/riot-stats", { credentials: "same-origin", signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) { setState({ status: response.status === 401 ? "anonymous" : "unavailable", data: null, isLive: false }); return; }
        setState({ status: "ready", data: await response.json(), isLive: true });
      }).catch(() => { if (!controller.signal.aborted) setState({ status: "error", data: null, isLive: false }); });
    return () => controller.abort();
  }, []);
  return state;
}
export function beginRiotSignIn() { window.location.assign("/.netlify/functions/riot-auth-start"); }
export async function signOut() {
  const response = await fetch("/.netlify/functions/riot-auth-logout", { method: "POST", credentials: "same-origin", headers: { "X-ValSync-Request": "1" } });
  if (response.ok) { localStorage.removeItem("valsync_player_session"); window.location.reload(); }
}
