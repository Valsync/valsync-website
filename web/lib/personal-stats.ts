"use client";

import { useEffect, useState } from "react";

export type PersonalStatsData = {
  profile: { name: string; tag: string; region: string; rank: string; rr: number; rrToNext: number; season: string; lastSync: string };
  stats: Array<{ label: string; value: string; detail: string; tone: "cyan" | "red" | "gold" }>;
  agents: Array<{ agent: string; played: number; winRate: number; acs: number }>;
  matches: Array<{ result: "Victory" | "Defeat"; score: string; map: string; agent: string; kda: string; rr: string; time: string }>;
};

type State = { status: "loading" | "anonymous" | "ready" | "error"; data: PersonalStatsData | null };
let cached: State | null = null;
let pending: Promise<State> | null = null;

async function load(): Promise<State> {
  if (cached) return cached;
  pending ??= fetch("/.netlify/functions/riot-stats", { credentials: "same-origin" })
    .then(async (response) => {
      if (response.status === 401) return { status: "anonymous", data: null } as State;
      if (!response.ok) return { status: "error", data: null } as State;
      return { status: "ready", data: await response.json() as PersonalStatsData } as State;
    })
    .catch(() => ({ status: "error", data: null } as State))
    .then((state) => { cached = state; return state; });
  return pending;
}

export function usePersonalStats() {
  const [state, setState] = useState<State>(cached ?? { status: "loading", data: null });
  useEffect(() => { void load().then(setState); }, []);
  return state;
}

export function beginRiotSignIn() { window.location.assign("/.netlify/functions/riot-auth-start"); }
