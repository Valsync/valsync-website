// Agent palette, ported from the Android app's theme layer
// (app/src/main/java/com/valsync/app/theme/AgentTheme.kt).
//
// The app draws the agent portrait in the match card with a ring in that
// agent's own kit color, so every row in the list reads differently. The web
// companion draws the same portrait but had no per-agent color to use, so the
// ring was generic. These are the primary swatches only — the ring is the one
// place the web uses them.
//
// Keys are lowercase agent names; lookups normalize the same way the app's
// `agentThemeSpec` does (lowercase, then strip "/", "-" and spaces) so both a
// Riot character id and a display name resolve.

export const AGENT_PRIMARY: Record<string, string> = {
  astra: "#c919ff",
  breach: "#e05c1b",
  brimstone: "#a03a07",
  chamber: "#d9a54e",
  clove: "#6116fb",
  cypher: "#62ebfd",
  deadlock: "#4aa9fb",
  fade: "#ff2a4a",
  gekko: "#a8e03a",
  harbor: "#b07b2a",
  hush: "#eb20a3",
  iso: "#8a6bff",
  jett: "#3fe0d6",
  "kay/o": "#9b5cff",
  killjoy: "#f7dc58",
  miks: "#ffb93e",
  neon: "#56e0ff",
  omen: "#2df6ff",
  phoenix: "#ed6133",
  raze: "#ff6a2b",
  reyna: "#e91bc3",
  sage: "#09d6a5",
  skye: "#6ccb3c",
  sova: "#3d7bff",
  tejo: "#b86744",
  veto: "#4fd8ff",
  viper: "#049333",
  vyse: "#a56bff",
  waylay: "#4f26fd",
  yoru: "#4cc6ee",
};

/**
 * The agent's primary color, or null when the agent is unknown.
 * Mirrors the app's normalization: exact lowercase key first, then a key with
 * separators stripped.
 */
export function agentPrimary(name: string | null | undefined): string | null {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  const stripped = normalized.replace(/\//g, "").replace(/-/g, "").replace(/ /g, "");
  return AGENT_PRIMARY[normalized] ?? AGENT_PRIMARY[stripped] ?? null;
}
