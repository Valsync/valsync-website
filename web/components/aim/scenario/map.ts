import * as THREE from "three";

// Cinder — an original VALSYNC map: a spawn lane opening into a plaza, an
// alcove on the left, and an arched site to the north with a raised ledge.
// Everything is axis-aligned boxes, so the same data drives rendering,
// player collision, bullet occlusion and the minimap.
//
// Coordinates are metres. -Z is "north" (away from spawn), +X is east.

export type Mat = "wall" | "accent" | "stone" | "crate" | "pillar" | "beam";
export type Box = { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number; mat: Mat };
export type Callout = { name: string; x: number; z: number };
export type MapDef = {
  id: string;
  name: string;
  bounds: { x0: number; x1: number; z0: number; z1: number };
  boxes: Box[];
  callouts: Callout[];
};

const b = (x0: number, x1: number, z0: number, z1: number, y1: number, mat: Mat = "wall", y0 = 0): Box => ({
  x0, x1, z0, z1, y0, y1, mat,
});

export const CINDER: MapDef = {
  id: "cinder",
  name: "Cinder",
  bounds: { x0: -16, x1: 16, z0: -26, z1: 22 },
  callouts: [
    { name: "Lane", x: 0, z: 16 },
    { name: "Alcove", x: -9, z: 10.5 },
    { name: "Plaza", x: 0, z: 3 },
    { name: "Arch", x: 0, z: -6.3 },
    { name: "Side Door", x: 10.5, z: -6.3 },
    { name: "Site", x: 0, z: -18 },
    { name: "Ledge", x: -12.5, z: -23 },
    { name: "Kiln", x: 8, z: -21 },
  ],
  boxes: [
    // Perimeter
    b(-16.6, 16.6, -26.6, -26, 7),
    b(-16.6, 16.6, 22, 22.6, 7),
    b(-16.6, -16, -26.6, 22.6, 7),
    b(16, 16.6, -26.6, 22.6, 7),

    // Spawn lane and the buildings either side of it
    b(-3.1, -2.5, 9, 22, 5, "accent"),
    b(2.5, 3.1, 9, 22, 5, "accent"),
    b(-16, -3.1, 12, 22, 6),
    b(3.1, 16, 12, 22, 6),
    b(3.1, 16, 9, 12, 6),

    // Plaza
    b(4, 6, 1, 3, 1.4, "crate"),
    b(4.4, 5.6, 1.4, 2.6, 2.4, "crate", 1.4),
    b(-7, -3, -1, -0.2, 1.0, "stone"),
    b(-0.5, 0.5, -1.5, -0.5, 5, "pillar"),
    b(-11, -9, 3, 5, 1.6, "crate"),
    b(10, 11.6, 4, 5.6, 1.2, "crate"),

    // Site wall: main arch (x -2..2) and the side door (x 9..12)
    b(-16, -2, -6.6, -6, 6),
    b(2, 9, -6.6, -6, 6),
    b(12, 16, -6.6, -6, 6),
    b(-2, 2, -6.6, -6, 6, "beam", 3.4),
    b(9, 12, -6.6, -6, 6, "beam", 3),

    // Site
    b(-2, 2, -16, -13, 1.8, "crate"),
    b(-1.2, 1.2, -15.4, -13.6, 3.0, "crate", 1.8),
    b(-16, -9, -26, -20, 1.3, "stone"),
    b(-9, -8.2, -23.5, -21, 0.9, "stone"),
    b(-8.2, -7.4, -23.5, -21, 0.45, "stone"),
    b(7, 9, -22, -20, 6, "pillar"),
    b(10, 12, -14, -12, 1.4, "crate"),
    b(-16, -12, -14, -13.4, 4),
  ],
};

// ── geometry ────────────────────────────────────────────────────────────────

const TEX_M = 2; // one texture tile per 2 m of surface

function canvasTex(draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  draw(c.getContext("2d")!, s);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function speckle(g: CanvasRenderingContext2D, s: number, n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * alpha})`;
    g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

function plaster(base: string) {
  return canvasTex((g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    speckle(g, s, 2600, 0.08);
    g.fillStyle = "rgba(0,0,0,0.07)";
    g.fillRect(0, s - 18, s, 18); // grime line at the base of each tile
  });
}

const TEXTURES = (() => {
  let cache: Record<Mat, THREE.Texture> | null = null;
  return () =>
    (cache ??= {
      wall: plaster("#d9b48c"),
      accent: plaster("#c4704c"),
      pillar: plaster("#bfa98d"),
      beam: plaster("#8f5a3f"),
      stone: canvasTex((g, s) => {
        g.fillStyle = "#9c8e7f";
        g.fillRect(0, 0, s, s);
        const n = 4;
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            const l = 52 + Math.random() * 10;
            g.fillStyle = `hsl(28 14% ${l}%)`;
            g.fillRect(i * (s / n) + 2, j * (s / n) + 2, s / n - 4, s / n - 4);
          }
        speckle(g, s, 1500, 0.08);
      }),
      crate: canvasTex((g, s) => {
        g.fillStyle = "#8b5b36";
        g.fillRect(0, 0, s, s);
        g.strokeStyle = "rgba(0,0,0,0.25)";
        g.lineWidth = 2;
        for (let y = 0; y < s; y += 32) {
          g.beginPath();
          g.moveTo(0, y + 0.5);
          g.lineTo(s, y + 0.5);
          g.stroke();
        }
        g.strokeStyle = "#5e3a20";
        g.lineWidth = 16;
        g.strokeRect(8, 8, s - 16, s - 16);
        g.beginPath();
        g.moveTo(16, 16);
        g.lineTo(s - 16, s - 16);
        g.stroke();
        speckle(g, s, 1200, 0.1);
      }),
    });
})();

/** Scale a BoxGeometry's UVs so textures keep world-space density. */
function worldUV(geo: THREE.BoxGeometry, w: number, h: number, d: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const faces: [number, number][] = [
    [d, h], [d, h], [w, d], [w, d], [w, h], [w, h],
  ];
  faces.forEach(([su, sv], f) => {
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, (uv.getX(i) * su) / TEX_M, (uv.getY(i) * sv) / TEX_M);
  });
  uv.needsUpdate = true;
}

export function buildMap(map: MapDef) {
  const group = new THREE.Group();
  const tex = TEXTURES();
  const mats = Object.fromEntries(
    (Object.keys(tex) as Mat[]).map((k) => [k, new THREE.MeshStandardMaterial({ map: tex[k], roughness: 0.92 })]),
  ) as Record<Mat, THREE.MeshStandardMaterial>;

  const { x0, x1, z0, z1 } = map.bounds;
  const fw = x1 - x0;
  const fd = z1 - z0;
  const floorTex = tex.stone.clone();
  floorTex.needsUpdate = true;
  floorTex.repeat.set(fw / TEX_M, fd / TEX_M);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(fw, fd),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  floor.receiveShadow = true;
  group.add(floor);

  const solids: THREE.Mesh[] = [floor];
  for (const box of map.boxes) {
    const w = box.x1 - box.x0;
    const h = box.y1 - box.y0;
    const d = box.z1 - box.z0;
    const geo = new THREE.BoxGeometry(w, h, d);
    worldUV(geo, w, h, d);
    const mesh = new THREE.Mesh(geo, mats[box.mat]);
    mesh.position.set((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, (box.z0 + box.z1) / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    solids.push(mesh);
  }
  return { group, solids };
}

// ── collision ───────────────────────────────────────────────────────────────

export const PLAYER_R = 0.32;
export const STEP = 0.5;

/** Highest walkable top under a circle at (x, z) that the feet can step onto. */
export function groundAt(map: MapDef, x: number, z: number, feet: number, r = PLAYER_R) {
  let g = 0;
  for (const bx of map.boxes) {
    if (x + r <= bx.x0 || x - r >= bx.x1 || z + r <= bx.z0 || z - r >= bx.z1) continue;
    if (bx.y1 <= feet + STEP && bx.y1 > g) g = bx.y1;
  }
  return g;
}

/** Push a circle out of every box that blocks it at this height. */
export function resolve(map: MapDef, p: THREE.Vector3, height: number, r = PLAYER_R) {
  for (let pass = 0; pass < 2; pass++) {
    for (const bx of map.boxes) {
      if (bx.y1 <= p.y + STEP || bx.y0 >= p.y + height) continue;
      const cx = Math.max(bx.x0, Math.min(p.x, bx.x1));
      const cz = Math.max(bx.z0, Math.min(p.z, bx.z1));
      const dx = p.x - cx;
      const dz = p.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        p.x = cx + (dx / d) * r;
        p.z = cz + (dz / d) * r;
      } else {
        // Centre inside the box: leave by the nearest face.
        const out = [p.x - bx.x0, bx.x1 - p.x, p.z - bx.z0, bx.z1 - p.z];
        const m = Math.min(...out);
        if (m === out[0]) p.x = bx.x0 - r;
        else if (m === out[1]) p.x = bx.x1 + r;
        else if (m === out[2]) p.z = bx.z0 - r;
        else p.z = bx.z1 + r;
      }
    }
  }
}

// ── minimap ─────────────────────────────────────────────────────────────────

export type Pin = { x: number; z: number; kind: "enemy" | "dead" | "you"; yaw?: number };

export function drawMinimap(ctx: CanvasRenderingContext2D, map: MapDef, pins: Pin[], labels = false) {
  const { width: W, height: H } = ctx.canvas;
  const { x0, x1, z0, z1 } = map.bounds;
  const k = Math.min(W / (x1 - x0), H / (z1 - z0)) * 0.94;
  const ox = W / 2 - ((x0 + x1) / 2) * k;
  const oz = H / 2 - ((z0 + z1) / 2) * k;
  const X = (x: number) => ox + x * k;
  const Z = (z: number) => oz + z * k;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(5,15,25,0.78)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(217,227,242,0.16)";
  ctx.fillRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k);
  for (const bx of map.boxes) {
    ctx.fillStyle = bx.y1 >= 2.5 && bx.y0 < 2 ? "rgba(5,15,25,0.95)" : bx.y0 >= 2 ? "rgba(217,227,242,0.08)" : "rgba(217,227,242,0.32)";
    ctx.fillRect(X(bx.x0), Z(bx.z0), (bx.x1 - bx.x0) * k, (bx.z1 - bx.z0) * k);
  }
  if (labels) {
    ctx.font = `600 ${Math.max(9, k * 1.1)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(217,227,242,0.55)";
    for (const c of map.callouts) ctx.fillText(c.name.toUpperCase(), X(c.x), Z(c.z));
  }
  for (const p of pins) {
    const x = X(p.x);
    const z = Z(p.z);
    if (p.kind === "dead") {
      ctx.strokeStyle = "rgba(171,136,135,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, z - 4);
      ctx.lineTo(x + 4, z + 4);
      ctx.moveTo(x + 4, z - 4);
      ctx.lineTo(x - 4, z + 4);
      ctx.stroke();
    } else if (p.kind === "enemy") {
      ctx.fillStyle = "#ff525d";
      ctx.beginPath();
      ctx.arc(x, z, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Facing arrow: yaw 0 looks toward -Z (up on the map).
      const a = -(p.yaw ?? 0);
      ctx.fillStyle = "#00eab8";
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(a) * 8, z - Math.cos(a) * 8);
      ctx.lineTo(x + Math.sin(a + 2.5) * 6, z - Math.cos(a + 2.5) * 6);
      ctx.lineTo(x + Math.sin(a - 2.5) * 6, z - Math.cos(a - 2.5) * 6);
      ctx.closePath();
      ctx.fill();
    }
  }
}
