import * as THREE from "three";

// VALSYNC's own opponents. Built from primitives so there are no model files
// to ship; each has a signature colour on the visor, shoulders and chest
// stripe so the kill feed and the body on screen match at a glance.

export type Part = "head" | "body" | "legs";

export type AgentDef = { id: string; name: string; color: number; suit: number };

export const AGENTS: Record<string, AgentDef> = {
  vesper: { id: "vesper", name: "Vesper", color: 0xb36bff, suit: 0x4a4f63 },
  kato: { id: "kato", name: "Kato", color: 0xff8a3d, suit: 0x55504a },
  rook: { id: "rook", name: "Rook", color: 0x3dd6ff, suit: 0x3f5160 },
  juno: { id: "juno", name: "Juno", color: 0xffd23d, suit: 0x5a5444 },
  brask: { id: "brask", name: "Brask", color: 0x5dff8a, suit: 0x45574b },
};

/**
 * A humanoid ~1.8 m tall with its feet at the origin, facing -Z.
 * Hittable meshes carry userData.part so a raycast knows where it landed.
 */
export function buildAgent(def: AgentDef) {
  const root = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: def.suit, roughness: 0.75 });
  const plate = new THREE.MeshStandardMaterial({ color: 0x5b6470, roughness: 0.5, metalness: 0.2 });
  const glow = new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x8a6a55, roughness: 0.8 });
  const helmet = new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.12, roughness: 0.55 });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, part?: Part) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    if (part) m.userData.part = part;
    root.add(m);
    return m;
  };

  // Legs and boots
  add(new THREE.BoxGeometry(0.17, 0.82, 0.2), suit, -0.11, 0.45, 0, "legs");
  add(new THREE.BoxGeometry(0.17, 0.82, 0.2), suit, 0.11, 0.45, 0, "legs");
  add(new THREE.BoxGeometry(0.19, 0.1, 0.28), plate, -0.11, 0.05, -0.03);
  add(new THREE.BoxGeometry(0.19, 0.1, 0.28), plate, 0.11, 0.05, -0.03);

  // Torso, chest plate and the signature stripe
  add(new THREE.BoxGeometry(0.46, 0.62, 0.26), suit, 0, 1.17, 0, "body");
  add(new THREE.BoxGeometry(0.4, 0.34, 0.06), plate, 0, 1.25, -0.15, "body");
  add(new THREE.BoxGeometry(0.06, 0.3, 0.02), glow, 0.1, 1.25, -0.185);
  add(new THREE.BoxGeometry(0.14, 0.12, 0.3), glow, -0.3, 1.43, 0);
  add(new THREE.BoxGeometry(0.14, 0.12, 0.3), glow, 0.3, 1.43, 0);

  // Arms brought forward to hold a sidearm
  const armL = add(new THREE.BoxGeometry(0.11, 0.11, 0.5), suit, -0.2, 1.3, -0.24, "body");
  armL.rotation.y = 0.35;
  const armR = add(new THREE.BoxGeometry(0.11, 0.11, 0.5), suit, 0.2, 1.3, -0.24, "body");
  armR.rotation.y = -0.35;
  add(new THREE.BoxGeometry(0.07, 0.12, 0.26), plate, 0, 1.33, -0.52);

  // Neck, head and visor
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), skin, 0, 1.52, 0);
  add(new THREE.SphereGeometry(0.135, 20, 14), skin, 0, 1.64, 0, "head");
  add(new THREE.SphereGeometry(0.145, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.1), helmet, 0, 1.66, 0.01, "head");
  const visor = add(new THREE.BoxGeometry(0.22, 0.05, 0.05), glow, 0, 1.65, -0.12, "head");
  visor.rotation.x = 0.1;

  return root;
}

export function disposeAgent(root: THREE.Object3D) {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
}
