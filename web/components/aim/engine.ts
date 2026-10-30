import * as THREE from "three";
import { Sfx } from "./audio";
import { TARGET_HEX, VAL_YAW, type Settings } from "./settings";

// The first-person range. React owns the lobby and the HUD; this class owns
// the canvas, pointer lock, the clock and the scene, and reports up through
// a handful of callbacks. Modes (modes.ts) only talk to the engine API below.

// Valorant renders a fixed 103° horizontal FOV at 16:9, i.e. ~70.53°
// vertical. Holding the vertical angle keeps target sizes on screen the same
// as in game at 16:9 and widens the view on ultrawide, as the game does.
const V_FOV = (2 * Math.atan(Math.tan((103 / 2) * (Math.PI / 180)) * (9 / 16)) * 180) / Math.PI;
export const EYE = new THREE.Vector3(0, 1.6, 0);

export type Phase = "idle" | "countdown" | "live" | "paused" | "done";

export type Stats = {
  score: number;
  hits: number;
  shots: number;
  kills: number;
  headshots: number;
  times: number[];
  trackOn: number;
  trackHead: number;
  trackTotal: number;
  escaped: number;
  onTarget: boolean;
  progress: string;
};

export type Target = {
  root: THREE.Object3D;
  parts: THREE.Mesh[];
  head?: THREE.Mesh;
  born: number;
  hp: number;
  data: Record<string, number>;
  dying?: number;
};

export type Hit = { target: Target; head: boolean };

export interface Mode {
  /** Seconds on the clock, or null when the mode ends itself after N rounds. */
  duration: number | null;
  /** Tracking modes score time on target instead of clicks. */
  continuous?: boolean;
  start(e: Engine): void;
  update(e: Engine, dt: number): void;
  shoot?(e: Engine, hit: Hit | null): void;
}

export type EngineCallbacks = {
  onPhase(phase: Phase): void;
  onCountdown(n: number): void;
  onStats(stats: Stats, timeLeft: number | null, fps: number): void;
  onHit(kind: "hit" | "head" | "kill"): void;
  onEnd(stats: Stats): void;
  /** The browser refused pointer lock (embedded frames, some policies). */
  onLockError(): void;
};

const freshStats = (): Stats => ({
  score: 0,
  hits: 0,
  shots: 0,
  kills: 0,
  headshots: 0,
  times: [],
  trackOn: 0,
  trackHead: 0,
  trackTotal: 0,
  escaped: 0,
  onTarget: false,
  progress: "",
});

function gridTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#132230";
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "rgba(171,136,135,0.16)";
  g.lineWidth = 1;
  for (let i = 0; i <= size; i += 32) {
    g.beginPath();
    g.moveTo(i + 0.5, 0);
    g.lineTo(i + 0.5, size);
    g.moveTo(0, i + 0.5);
    g.lineTo(size, i + 0.5);
    g.stroke();
  }
  g.strokeStyle = "rgba(171,136,135,0.28)";
  g.strokeRect(0.5, 0.5, size - 1, size - 1);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export class Engine {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sfx = new Sfx();
  readonly targets = new Set<Target>();
  readonly occluders: THREE.Object3D[] = [];
  stats = freshStats();
  /** Seconds of live play — frozen while paused. */
  time = 0;
  phase: Phase = "idle";
  settings: Settings;

  private renderer: THREE.WebGLRenderer;
  private mode: Mode | null = null;
  private cover = new THREE.Group();
  private ray = new THREE.Raycaster();
  private yaw = 0;
  private pitch = 0;
  private raf = 0;
  private last = 0;
  private countdownLeft = 0;
  private emitAcc = 0;
  private fps = 0;
  private frames = 0;
  private fpsAcc = 0;
  private bodyMat: THREE.MeshStandardMaterial;
  private headMat: THREE.MeshStandardMaterial;
  private orbMat: THREE.MeshStandardMaterial;
  private ro: ResizeObserver;
  private disposed = false;

  constructor(
    private host: HTMLElement,
    settings: Settings,
    private cb: EngineCallbacks,
  ) {
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = "aim-canvas";

    this.camera = new THREE.PerspectiveCamera(V_FOV, 16 / 9, 0.05, 200);
    this.camera.rotation.order = "YXZ";
    this.camera.position.copy(EYE);

    const color = TARGET_HEX[settings.targetColor];
    this.orbMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.35 });
    this.headMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.4 });
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x2c3641, emissive: color, emissiveIntensity: 0.12, roughness: 0.7 });

    this.buildRoom();
    this.scene.add(this.cover);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();

    document.addEventListener("pointerlockchange", this.onLockChange);
    document.addEventListener("mousemove", this.onMouseMove);
    this.renderer.domElement.addEventListener("mousedown", this.onMouseDown);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ── public control (React) ────────────────────────────────────────────────

  get canvas() {
    return this.renderer.domElement;
  }

  applySettings(settings: Settings) {
    this.settings = settings;
    this.sfx.volume = settings.volume;
    const color = TARGET_HEX[settings.targetColor];
    for (const m of [this.orbMat, this.headMat]) {
      m.color.setHex(color);
      m.emissive.setHex(color);
    }
    this.bodyMat.emissive.setHex(color);
  }

  /** Must run inside a click handler: pointer lock and audio need a gesture. */
  lock() {
    this.sfx.unlock();
    const el = this.renderer.domElement;
    // Raw input where the browser offers it, so a Valorant sensitivity maps
    // 1:1 without the OS pointer-speed curve in the way.
    type Lock = (o?: { unadjustedMovement?: boolean }) => Promise<void> | void;
    const request = el.requestPointerLock as Lock;
    const fail = () => this.cb.onLockError();
    const plain = () => {
      try {
        const p = request.call(el);
        if (p && typeof p.catch === "function") p.catch(fail);
      } catch {
        fail();
      }
    };
    try {
      const p = request.call(el, { unadjustedMovement: true });
      if (p && typeof p.catch === "function") p.catch(plain);
    } catch {
      plain();
    }
  }

  begin(mode: Mode) {
    this.clearTargets();
    this.clearCover();
    this.stats = freshStats();
    this.time = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.mode = mode;
    mode.start(this);
    this.countdownLeft = 3;
    this.cb.onCountdown(3);
    this.setPhase(document.pointerLockElement === this.canvas ? "countdown" : "paused");
    if (this.phase === "countdown") this.sfx.play("tick");
    this.emit();
  }

  quit() {
    this.mode = null;
    this.clearTargets();
    this.clearCover();
    this.setPhase("idle");
    if (document.pointerLockElement) document.exitPointerLock();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    document.removeEventListener("pointerlockchange", this.onLockChange);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.renderer.domElement.removeEventListener("mousedown", this.onMouseDown);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          (m as THREE.MeshStandardMaterial).map?.dispose();
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ── mode API ──────────────────────────────────────────────────────────────

  rand(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  /** A point `dist` metres out from the eye along yaw/pitch (degrees). */
  aimPoint(yawDeg: number, pitchDeg: number, dist: number) {
    const y = THREE.MathUtils.degToRad(yawDeg);
    const p = THREE.MathUtils.degToRad(pitchDeg);
    return new THREE.Vector3(-Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p))
      .multiplyScalar(dist)
      .add(EYE);
  }

  addOrb(pos: THREE.Vector3, radius: number): Target {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * this.settings.targetScale, 32, 20), this.orbMat);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    const t: Target = { root: mesh, parts: [mesh], born: this.time, hp: 1, data: {} };
    this.targets.add(t);
    return t;
  }

  /** A humanoid dummy standing at `pos` (feet). Head sits at eye height. */
  addBot(pos: THREE.Vector3, hp = 2): Target {
    const s = this.settings.targetScale;
    const root = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3 * s, 0.82, 6, 16), this.bodyMat);
    body.position.y = 0.88;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15 * s, 24, 16), this.headMat);
    head.position.y = 1.6;
    root.add(body, head);
    root.position.copy(pos);
    this.scene.add(root);
    const t: Target = { root, parts: [body, head], head, born: this.time, hp, data: {} };
    this.targets.add(t);
    return t;
  }

  addCover(x: number, z: number, w: number, h: number, d = 1) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x212b35, roughness: 0.9 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    box.position.set(x, h / 2, z);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(box.geometry),
      new THREE.LineBasicMaterial({ color: 0xab8887, transparent: true, opacity: 0.35 }),
    );
    box.add(edges);
    this.cover.add(box);
    this.occluders.push(box);
  }

  remove(t: Target) {
    this.scene.remove(t.root);
    t.root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.targets.delete(t);
  }

  /** Kill with a short shrink so the hit reads, then drop it. */
  kill(t: Target) {
    t.dying = this.time;
  }

  /** What the crosshair is on right now, honouring cover. */
  aimHit(): Hit | null {
    this.ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const live = [...this.targets].filter((t) => t.dying === undefined);
    const parts = live.flatMap((t) => t.parts);
    const hits = this.ray.intersectObjects([...parts, ...this.occluders], false);
    const first = hits[0];
    if (!first) return null;
    const target = live.find((t) => t.parts.includes(first.object as THREE.Mesh));
    if (!target) return null;
    return { target, head: first.object === target.head };
  }

  scoreHit(points: number, ms: number | null, opts: { head?: boolean; kill?: boolean } = {}) {
    this.stats.hits++;
    this.stats.score += Math.round(points);
    if (opts.kill !== false) this.stats.kills++;
    if (opts.head) this.stats.headshots++;
    if (ms !== null) this.stats.times.push(ms);
    const kind = opts.kill === false ? (opts.head ? "head" : "hit") : opts.head ? "head" : "kill";
    this.sfx.play(kind);
    this.cb.onHit(kind);
  }

  scoreMiss(penalty: number) {
    this.stats.score = Math.max(0, this.stats.score - penalty);
    this.sfx.play("miss");
  }

  finish() {
    if (this.phase !== "live") return;
    this.stats.onTarget = false;
    this.emit();
    this.setPhase("done");
    this.clearTargets();
    this.cb.onEnd({ ...this.stats, times: [...this.stats.times] });
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private setPhase(p: Phase) {
    this.phase = p;
    this.cb.onPhase(p);
  }

  private buildRoom() {
    const tex = gridTexture();
    const floorTex = tex.clone();
    floorTex.needsUpdate = true;
    floorTex.repeat.set(30, 30);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const wallTex = tex.clone();
    wallTex.needsUpdate = true;
    wallTex.repeat.set(24, 5);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 1, side: THREE.BackSide });
    const room = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 10, 64, 1, true), wallMat);
    room.position.y = 5;
    this.scene.add(room);
    this.occluders.push(room);

    this.scene.background = new THREE.Color(0x070d14);
    this.scene.fog = new THREE.Fog(0x070d14, 26, 40);
    this.scene.add(new THREE.HemisphereLight(0xd9e3f2, 0x1a2633, 2.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(4, 10, 6);
    this.scene.add(sun);
  }

  private clearTargets() {
    for (const t of [...this.targets]) this.remove(t);
  }

  private clearCover() {
    for (const o of [...this.cover.children]) {
      this.cover.remove(o);
      o.traverse((c) => {
        if (c instanceof THREE.Mesh || c instanceof THREE.LineSegments) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      });
    }
    // Cover just left the scene graph; the room shell stays.
    const kept = this.occluders.filter((o) => o.parent !== null);
    this.occluders.splice(0, this.occluders.length, ...kept);
  }

  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private onLockChange = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (!locked && (this.phase === "live" || this.phase === "countdown")) this.setPhase("paused");
    else if (locked && this.phase === "paused" && this.mode) {
      this.countdownLeft = 3;
      this.cb.onCountdown(3);
      this.sfx.play("tick");
      this.setPhase("countdown");
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas) return;
    if (this.phase !== "live" && this.phase !== "countdown") return;
    const k = VAL_YAW * this.settings.sens;
    this.yaw -= e.movementX * k;
    this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * k, -89, 89);
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 || this.phase !== "live" || !this.mode || this.mode.continuous) return;
    this.stats.shots++;
    this.mode.shoot?.(this, this.aimHit());
    this.emit();
  };

  private emit() {
    const left = this.mode?.duration != null ? Math.max(0, this.mode.duration - this.time) : null;
    this.cb.onStats(this.stats, left, this.fps);
  }

  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    this.frames++;
    this.fpsAcc += dt;
    if (this.fpsAcc >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsAcc);
      this.frames = 0;
      this.fpsAcc = 0;
    }

    if (this.phase === "countdown") {
      const before = Math.ceil(this.countdownLeft);
      this.countdownLeft -= dt;
      const after = Math.ceil(this.countdownLeft);
      if (this.countdownLeft <= 0) {
        this.sfx.play("go");
        this.setPhase("live");
      } else if (after !== before) {
        this.sfx.play("tick");
        this.cb.onCountdown(after);
      }
    } else if (this.phase === "live" && this.mode) {
      this.time += dt;
      this.mode.update(this, dt);
      if (this.mode.duration != null && this.time >= this.mode.duration) this.finish();
      this.emitAcc += dt;
      if (this.emitAcc >= 0.1) {
        this.emitAcc = 0;
        this.emit();
      }
    }

    for (const t of [...this.targets]) {
      if (t.dying === undefined) continue;
      const k = 1 - (this.time - t.dying) / 0.09;
      if (k <= 0 || this.phase !== "live") this.remove(t);
      else t.root.scale.setScalar(k);
    }

    this.camera.rotation.set(THREE.MathUtils.degToRad(this.pitch), THREE.MathUtils.degToRad(this.yaw), 0);
    this.renderer.render(this.scene, this.camera);
  };
}
