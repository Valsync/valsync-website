// Settings, persistence and Valorant crosshair-code parsing for the aim
// trainer. Everything lives in one localStorage record so a cleared or
// blocked store just means defaults; nothing here is ever sent anywhere.

export type CrosshairLines = {
  show: boolean;
  length: number;
  thickness: number;
  offset: number;
  alpha: number;
};

export type Crosshair = {
  color: string;
  outline: boolean;
  outlineThickness: number;
  outlineAlpha: number;
  dot: boolean;
  dotThickness: number;
  dotAlpha: number;
  inner: CrosshairLines;
  outer: CrosshairLines;
};

export type TargetColor = "red" | "yellow" | "purple" | "cyan";

export type Settings = {
  sens: number;
  dpi: number;
  targetScale: number;
  targetColor: TargetColor;
  volume: number;
  crosshair: Crosshair;
};

export type RunRecord = {
  score: number;
  accuracy: number;
  hits: number;
  shots: number;
  avgMs: number;
  headshotPct: number;
  at: number;
};

type Store = { settings: Settings; history: Record<string, RunRecord[]> };

const KEY = "valsync-aim-v1";
const HISTORY_CAP = 40;

// Valorant's own defaults, so a fresh visitor sees the crosshair they know.
export const DEFAULT_CROSSHAIR: Crosshair = {
  color: "#ffffff",
  outline: true,
  outlineThickness: 1,
  outlineAlpha: 0.5,
  dot: false,
  dotThickness: 2,
  dotAlpha: 1,
  inner: { show: true, length: 6, thickness: 2, offset: 3, alpha: 0.8 },
  outer: { show: true, length: 2, thickness: 2, offset: 10, alpha: 0.35 },
};

export const DEFAULT_SETTINGS: Settings = {
  sens: 0.35,
  dpi: 800,
  targetScale: 1,
  targetColor: "red",
  volume: 0.5,
  crosshair: DEFAULT_CROSSHAIR,
};

export const TARGET_HEX: Record<TargetColor, number> = {
  red: 0xff525d,
  yellow: 0xf6ff3d,
  purple: 0xc04dff,
  cyan: 0x00eab8,
};

/** Valorant turns 0.07° per mouse count at sensitivity 1. */
export const VAL_YAW = 0.07;

export function cmPer360(sens: number, dpi: number) {
  if (sens <= 0 || dpi <= 0) return 0;
  return (2.54 * 360) / (VAL_YAW * sens * dpi);
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Store>;
      return {
        settings: {
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
          crosshair: { ...DEFAULT_CROSSHAIR, ...parsed.settings?.crosshair },
        },
        history: parsed.history ?? {},
      };
    }
  } catch {
    // Private windows and blocked storage fall through to defaults.
  }
  return { settings: DEFAULT_SETTINGS, history: {} };
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storage can be full or blocked; the session still works without it.
  }
}

export const loadSettings = () => read().settings;
export const loadHistory = () => read().history;

export function saveSettings(settings: Settings) {
  write({ ...read(), settings });
}

export function pushRun(mode: string, run: RunRecord) {
  const store = read();
  const list = [...(store.history[mode] ?? []), run].slice(-HISTORY_CAP);
  write({ ...store, history: { ...store.history, [mode]: list } });
  return store.history;
}

// ── Valorant crosshair codes ────────────────────────────────────────────────
// A code is a flat `key;value` list, e.g. "0;P;c;5;h;0;0l;4;0o;2;0a;1;1b;0".
// Only the primary (P) profile is read; unknown keys are ignored so newer
// game versions don't break the import.

const PALETTE = ["#ffffff", "#00ff00", "#7fff00", "#dfff00", "#ffff00", "#00ffff", "#ff00ff", "#ff0000"];

export function parseCrosshairCode(code: string): Crosshair | null {
  const parts = code.trim().split(";").map((p) => p.trim());
  if (parts.length < 2 || parts[0] !== "0") return null;
  const start = parts.indexOf("P");
  if (start < 0) return null;

  const values: Record<string, string> = {};
  for (let i = start + 1; i + 1 < parts.length; i += 2) {
    if (parts[i] === "A" || parts[i] === "S") break; // next profile
    values[parts[i]] = parts[i + 1];
  }

  const num = (k: string, fallback: number) => {
    const v = Number(values[k]);
    return Number.isFinite(v) ? v : fallback;
  };
  const flag = (k: string, fallback: boolean) => (k in values ? values[k] === "1" : fallback);

  const d = DEFAULT_CROSSHAIR;
  let color = PALETTE[num("c", 0)] ?? d.color;
  if (values.c === "8" && /^[0-9a-f]{6,8}$/i.test(values.u ?? "")) color = `#${values.u.slice(0, 6)}`;

  const lines = (prefix: "0" | "1", base: CrosshairLines): CrosshairLines => ({
    show: flag(`${prefix}b`, base.show),
    length: num(`${prefix}l`, base.length),
    thickness: num(`${prefix}t`, base.thickness),
    offset: num(`${prefix}o`, base.offset),
    alpha: num(`${prefix}a`, base.alpha),
  });

  return {
    color,
    outline: flag("h", d.outline),
    outlineThickness: num("t", d.outlineThickness),
    outlineAlpha: num("o", d.outlineAlpha),
    dot: flag("d", d.dot),
    dotThickness: num("z", d.dotThickness),
    dotAlpha: num("a", d.dotAlpha),
    inner: lines("0", d.inner),
    outer: lines("1", d.outer),
  };
}
