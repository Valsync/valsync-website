import { CINDER, type MapDef } from "./map";
import { WASP, type WeaponDef } from "./weapons";

// A scenario is pure data: a map, a loadout, where you start, and where each
// opponent stands, what angle they hold and how sharp they are. New
// scenarios need no engine changes.

export type BotSpot = {
  agent: string;
  at: [number, number];
  y?: number;
  /** Point the bot holds its crosshair on. */
  face: [number, number];
  /** Optional wide peek: swing out to `to` when you come within `trigger` m. */
  peek?: { to: [number, number]; trigger: number };
  /** Seconds from first sight to first shot. */
  react: [number, number];
  /** Aim error, degrees (1 sigma). */
  aimErr: number;
};

export type ScenarioDef = {
  id: string;
  map: MapDef;
  weapon: WeaponDef;
  spawn: { x: number; z: number; yaw: number };
  /** Round clock, seconds. */
  duration: number;
  /** Clear time for the second star. */
  par: number;
  bots: BotSpot[];
};

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "cinder-pistol-retake",
    map: CINDER,
    weapon: WASP,
    spawn: { x: 0, z: 19.5, yaw: 0 },
    duration: 40,
    par: 22,
    bots: [
      { agent: "vesper", at: [-9, 10.6], face: [-2, 9.4], react: [0.42, 0.62], aimErr: 2.8 },
      { agent: "kato", at: [5.6, 0.2], face: [0, 9], peek: { to: [3.2, 0.2], trigger: 12 }, react: [0.38, 0.55], aimErr: 2.6 },
      { agent: "rook", at: [-4.2, -8.6], face: [0, -6.3], react: [0.36, 0.52], aimErr: 2.5 },
      { agent: "juno", at: [-12.5, -22.5], y: 1.3, face: [0, -6.4], react: [0.45, 0.65], aimErr: 3.0 },
      { agent: "brask", at: [8, -23.2], face: [0, -6.4], peek: { to: [5.6, -23.2], trigger: 15 }, react: [0.4, 0.6], aimErr: 2.7 },
    ],
  },
];
