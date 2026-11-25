import * as THREE from "three";

// VALSYNC's own sidearm. Numbers are tuned for a pistol-round feel: a
// two-shot headshot window at range only if you take time, three body
// shots up close, and real penalties for shooting on the move.

export type WeaponDef = {
  id: string;
  name: string;
  mag: number;
  reserve: number;
  /** Minimum seconds between shots (semi-automatic). */
  interval: number;
  reload: number;
  damage: { head: number; body: number; legs: number };
  /** Spread in degrees. */
  spread: { base: number; perShot: number; recover: number; walk: number; run: number; air: number; crouchMul: number };
};

export const WASP: WeaponDef = {
  id: "wasp",
  name: "Wasp",
  mag: 12,
  reserve: 36,
  interval: 0.15,
  reload: 1.75,
  damage: { head: 78, body: 26, legs: 22 },
  spread: { base: 0.3, perShot: 1.1, recover: 7, walk: 1.2, run: 4.5, air: 7, crouchMul: 0.8 },
};

/** First-person pistol and gloved hands, built from boxes. Faces -Z. */
export function buildViewmodel() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x6b727c, roughness: 0.4, metalness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2e35, roughness: 0.7 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xff525d, emissive: 0xff525d, emissiveIntensity: 0.4 });
  const glove = new THREE.MeshStandardMaterial({ color: 0x3c4650, roughness: 0.85 });
  const cuff = new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: 0.7 });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    g.add(m);
    return m;
  };

  const slide = add(new THREE.BoxGeometry(0.045, 0.05, 0.22), metal, 0, 0.03, -0.06);
  add(new THREE.BoxGeometry(0.04, 0.035, 0.2), dark, 0, -0.01, -0.05);
  add(new THREE.BoxGeometry(0.008, 0.012, 0.16), accent, 0.024, 0.035, -0.06);
  add(new THREE.BoxGeometry(0.012, 0.012, 0.012), dark, 0, 0.06, -0.16); // front sight
  add(new THREE.BoxGeometry(0.04, 0.12, 0.055), dark, 0, -0.07, 0.02, -0.25); // grip
  add(new THREE.BoxGeometry(0.02, 0.02, 0.05), dark, 0, -0.03, -0.01); // trigger guard

  // Hands wrapped around the grip, sleeves running back out of frame.
  add(new THREE.BoxGeometry(0.075, 0.09, 0.09), glove, 0.005, -0.07, 0.03, -0.25);
  add(new THREE.BoxGeometry(0.07, 0.08, 0.085), glove, -0.04, -0.075, 0.0, -0.25);
  add(new THREE.BoxGeometry(0.085, 0.085, 0.3), cuff, 0.03, -0.12, 0.22, -0.15);
  add(new THREE.BoxGeometry(0.08, 0.08, 0.3), cuff, -0.09, -0.12, 0.2, -0.15).rotation.y = 0.35;

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  flash.position.set(0, 0.03, -0.2);
  g.add(flash);

  return { group: g, slide, flash };
}
