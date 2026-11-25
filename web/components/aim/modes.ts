import * as THREE from "three";
import type { Engine, Hit, Mode, Stats, Target } from "./engine";

// Six drills, each aimed at one skill a VALORANT duel actually tests. Scores
// reward speed as well as hits, and every drill maps to a rank tier so a
// number means something without a spreadsheet. Each `radiant` is modelled on
// a top player's pace through that drill's scoring: ~400 ms between Grid
// kills, ~550 ms per Micro target, ~600 ms flicks, ~380 ms reactions, ~85%
// tracking with a third of it on the head, and ~250 ms headshot peeks.

export type ModeId = "grid" | "micro" | "flick" | "reflex" | "track" | "peek";
export type Skill = "speed" | "precision" | "flicking" | "reaction" | "tracking" | "holding";

export type ModeMeta = {
  id: ModeId;
  skill: Skill;
  /** Shown on the card: seconds or rounds. */
  length: string;
  /** A score that earns Radiant; the other tiers scale from it. */
  radiant: number;
  make: () => Mode;
};

const MS = (e: Engine, t: Target) => (e.time - t.born) * 1000;
const clamp = THREE.MathUtils.clamp;
/** 100 points at `par` ms, up to 1.6× for faster, down to 0.5× for slower. */
const speedPoints = (ms: number, par: number) => 100 * clamp(1 + (par - ms) / 1000, 0.5, 1.6);

// ── Grid: three targets on a wall, always three ─────────────────────────────
function grid(): Mode {
  const COLS = 5;
  const ROWS = 4;
  const taken = new Set<number>();
  // Three targets are up at once, so a target's age overstates how long the
  // kill took. Time between kills is the honest pace.
  let lastKill = 0;
  const spawn = (e: Engine) => {
    let cell: number;
    do cell = Math.floor(Math.random() * COLS * ROWS);
    while (taken.has(cell));
    taken.add(cell);
    const x = ((cell % COLS) - (COLS - 1) / 2) * 1.5;
    const y = 1.8 + (Math.floor(cell / COLS) - (ROWS - 1) / 2) * 0.8;
    e.addOrb(new THREE.Vector3(x, y, -12), 0.42).data.cell = cell;
  };
  return {
    duration: 60,
    start(e) {
      taken.clear();
      lastKill = 0;
      for (let i = 0; i < 3; i++) spawn(e);
    },
    update() {},
    shoot(e, hit) {
      if (!hit) return e.scoreMiss(25);
      taken.delete(hit.target.data.cell);
      const ms = (e.time - lastKill) * 1000;
      lastKill = e.time;
      e.scoreHit(speedPoints(ms, 600), ms);
      e.kill(hit.target);
      spawn(e);
    },
  };
}

// ── Micro: one small target that hops a short distance ──────────────────────
function micro(): Mode {
  let last = new THREE.Vector3(0, 1.6, -10);
  const spawn = (e: Engine) => {
    const p = last.clone();
    p.x = clamp(p.x + e.rand(-2.2, 2.2), -3.2, 3.2);
    p.y = clamp(p.y + e.rand(-1.4, 1.4), 0.7, 2.7);
    last = p;
    e.addOrb(p, 0.17);
  };
  return {
    duration: 60,
    start(e) {
      last = new THREE.Vector3(0, 1.6, -10);
      spawn(e);
    },
    update() {},
    shoot(e, hit) {
      if (!hit) return e.scoreMiss(30);
      e.scoreHit(speedPoints(MS(e, hit.target), 700), MS(e, hit.target));
      e.kill(hit.target);
      spawn(e);
    },
  };
}

// ── Flick: wide angles, the target can be anywhere in front of you ──────────
function flick(): Mode {
  let side = 1;
  const spawn = (e: Engine) => {
    side = -side;
    const yaw = side * e.rand(12, 68);
    e.addOrb(e.aimPoint(yaw, e.rand(-7, 14), 14), 0.5);
  };
  return {
    duration: 60,
    start(e) {
      spawn(e);
    },
    update() {},
    shoot(e, hit) {
      if (!hit) return e.scoreMiss(20);
      e.scoreHit(speedPoints(MS(e, hit.target), 800), MS(e, hit.target));
      e.kill(hit.target);
      spawn(e);
    },
  };
}

// ── Reaction: wait for it… then flick. Early clicks cost you ────────────────
function reflex(): Mode {
  const ROUNDS = 15;
  const TTL = 1.2;
  let round = 0;
  let nextAt = 0;
  let current: Target | null = null;
  const schedule = (e: Engine) => {
    current = null;
    nextAt = e.time + e.rand(0.8, 2.4);
    e.stats.progress = `${Math.min(round + 1, ROUNDS)}/${ROUNDS}`;
  };
  const advance = (e: Engine) => {
    round++;
    if (round >= ROUNDS) e.finish();
    else schedule(e);
  };
  return {
    duration: null,
    start(e) {
      round = 0;
      schedule(e);
    },
    update(e) {
      if (!current && e.time >= nextAt) {
        current = e.addOrb(e.aimPoint(e.rand(-28, 28), e.rand(-4, 12), 12), 0.5);
      } else if (current && e.time - current.born > TTL) {
        e.remove(current);
        e.stats.escaped++;
        advance(e);
      }
    },
    shoot(e, hit) {
      if (!current) {
        // Jumping the gun resets the wait, like a false start.
        e.scoreMiss(60);
        nextAt = e.time + e.rand(0.8, 2.4);
        return;
      }
      if (!hit) return e.scoreMiss(20);
      const ms = MS(e, hit.target);
      e.scoreHit(Math.max(0, (1000 - ms) / 4), ms);
      e.kill(hit.target);
      advance(e);
    },
  };
}

// ── Strafe track: a dummy that A-D strafes at run speed ─────────────────────
function track(): Mode {
  const RUN = 5.4; // VALORANT run speed, m/s
  const ACCEL = 34;
  let bot: Target | null = null;
  let vel = 0;
  let want = RUN;
  let switchAt = 0;
  return {
    duration: 40,
    continuous: true,
    start(e) {
      vel = 0;
      want = RUN;
      switchAt = 0;
      bot = e.addBot(new THREE.Vector3(0, 0, -11));
    },
    update(e, dt) {
      if (!bot) return;
      const x = bot.root.position.x;
      if (e.time >= switchAt || (x > 4.5 && want > 0) || (x < -4.5 && want < 0)) {
        // Mostly hard direction changes, sometimes a dead stop — the
        // counter-strafe moments where a real duel gets decided.
        const stop = Math.random() < 0.18;
        want = stop ? 0 : x > 3 ? -RUN : x < -3 ? RUN : Math.random() < 0.5 ? RUN : -RUN;
        switchAt = e.time + (stop ? e.rand(0.15, 0.35) : e.rand(0.3, 1.0));
      }
      vel += clamp(want - vel, -ACCEL * dt, ACCEL * dt);
      bot.root.position.x = x + vel * dt;

      const hit = e.aimHit();
      e.stats.trackTotal += dt;
      e.stats.onTarget = !!hit;
      if (hit) {
        e.stats.trackOn += dt;
        if (hit.head) e.stats.trackHead += dt;
      }
      // Staying on the body is the easy part; head time is where it's earned.
      e.stats.score = Math.round(e.stats.trackOn * 60 + e.stats.trackHead * 140);
    },
  };
}

// ── Angle hold: dummies peek from cover; hold the angle and take the head ───
function peek(): Mode {
  const ROUNDS = 20;
  const RUN = 5.4;
  const COVERS = [
    { x: -4.2, z: -10, w: 2.4 },
    { x: 0.6, z: -16, w: 3 },
    { x: 4.6, z: -12, w: 2.2 },
  ];
  type Peek = { bot: Target; edge: number; dir: number; out: number; holdUntil: number; state: "out" | "hold" | "back"; seen: boolean };
  let round = 0;
  let nextAt = 0;
  let p: Peek | null = null;

  const schedule = (e: Engine) => {
    p = null;
    nextAt = e.time + e.rand(0.5, 1.8);
    e.stats.progress = `${Math.min(round + 1, ROUNDS)}/${ROUNDS}`;
  };
  const advance = (e: Engine) => {
    round++;
    if (round >= ROUNDS) e.finish();
    else schedule(e);
  };

  return {
    duration: null,
    start(e) {
      round = 0;
      for (const c of COVERS) e.addCover(c.x, c.z, c.w, 2.6);
      schedule(e);
    },
    update(e, dt) {
      if (!p) {
        if (e.time < nextAt) return;
        const c = COVERS[Math.floor(Math.random() * COVERS.length)];
        const dir = Math.random() < 0.5 ? -1 : 1;
        const edge = c.x + (dir * c.w) / 2;
        const bot = e.addBot(new THREE.Vector3(edge - dir * 0.45, 0, c.z - 0.9), 2);
        p = { bot, edge, dir, out: e.rand(0.8, 1.6), holdUntil: 0, state: "out", seen: false };
        return;
      }
      const pos = p.bot.root.position;
      const past = (pos.x - p.edge) * p.dir; // >0 once clear of the edge
      if (!p.seen && past > -0.3) {
        // The clock starts when the first sliver of the dummy is exposed.
        p.seen = true;
        p.bot.born = e.time;
      }
      if (p.state === "out") {
        pos.x += p.dir * RUN * dt;
        if (past >= p.out) {
          p.state = "hold";
          p.holdUntil = e.time + e.rand(0.25, 0.65);
        }
      } else if (p.state === "hold") {
        if (e.time >= p.holdUntil) p.state = "back";
      } else {
        pos.x -= p.dir * RUN * dt;
        if (past < -0.5) {
          e.remove(p.bot);
          e.stats.escaped++;
          advance(e);
        }
      }
    },
    shoot(e, hit: Hit | null) {
      if (!hit || !p || hit.target !== p.bot) return e.scoreMiss(15);
      const ms = MS(e, hit.target);
      hit.target.hp -= hit.head ? 2 : 1;
      if (hit.target.hp > 0) {
        e.scoreHit(20, null, { kill: false });
        return;
      }
      e.scoreHit((hit.head ? 150 : 80) + Math.max(0, (600 - ms) / 4), ms, { head: hit.head });
      e.kill(hit.target);
      advance(e);
    },
  };
}

export const MODES: ModeMeta[] = [
  { id: "grid", skill: "speed", length: "60s", radiant: 16000, make: grid },
  { id: "micro", skill: "precision", length: "60s", radiant: 11000, make: micro },
  { id: "flick", skill: "flicking", length: "60s", radiant: 12000, make: flick },
  { id: "reflex", skill: "reaction", length: "15", radiant: 2300, make: reflex },
  { id: "track", skill: "tracking", length: "40s", radiant: 4000, make: track },
  { id: "peek", skill: "holding", length: "20", radiant: 4500, make: peek },
];

export const TIERS = [
  { name: "Iron", at: 0, color: "var(--rank-iron)" },
  { name: "Bronze", at: 0.2, color: "var(--rank-bronze)" },
  { name: "Silver", at: 0.32, color: "var(--rank-silver)" },
  { name: "Gold", at: 0.44, color: "var(--rank-gold)" },
  { name: "Platinum", at: 0.56, color: "var(--rank-platinum)" },
  { name: "Diamond", at: 0.67, color: "var(--rank-diamond)" },
  { name: "Ascendant", at: 0.78, color: "var(--rank-ascendant)" },
  { name: "Immortal", at: 0.89, color: "var(--rank-immortal)" },
  { name: "Radiant", at: 1, color: "var(--rank-radiant)" },
] as const;

export function tierFor(meta: ModeMeta, score: number) {
  const f = score / meta.radiant;
  let tier: (typeof TIERS)[number] = TIERS[0];
  for (const t of TIERS) if (f >= t.at) tier = t;
  return tier;
}

/** Collapse live stats into the record we keep and show. */
export function summarize(meta: ModeMeta, s: Stats) {
  const tracking = meta.id === "track";
  const accuracy = tracking ? (s.trackTotal ? s.trackOn / s.trackTotal : 0) : s.shots ? s.hits / s.shots : 0;
  const avgMs = s.times.length ? s.times.reduce((a, b) => a + b, 0) / s.times.length : 0;
  const headshotPct = tracking
    ? s.trackOn ? s.trackHead / s.trackOn : 0
    : s.kills ? s.headshots / s.kills : 0;
  return {
    score: s.score,
    accuracy,
    hits: s.hits,
    shots: s.shots,
    avgMs,
    headshotPct,
    at: Date.now(),
  };
}
