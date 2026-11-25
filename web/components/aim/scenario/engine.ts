import * as THREE from "three";
import { VAL_YAW, type Settings } from "../settings";
import { AGENTS, buildAgent, disposeAgent, type AgentDef, type Part } from "./agents";
import { ScenarioAudio } from "./audio";
import { buildMap, drawMinimap, groundAt, resolve, type Pin } from "./map";
import type { BotSpot, ScenarioDef } from "./scenarios";
import { buildViewmodel } from "./weapons";

// First-person scenario rounds: walk the map with a sidearm against
// opponents who hold angles, wide-peek and shoot back. Same contract as the
// drill engine: React owns the overlays, this owns canvas, input and clock.

const V_FOV = (2 * Math.atan(Math.tan((103 / 2) * (Math.PI / 180)) * (9 / 16)) * 180) / Math.PI;
const RUN = 5.4;
const WALK = 2.9;
const CROUCH = 2.0;
const GRAVITY = 16;
const JUMP_V = 4.6;
const EYE = 1.62;
const EYE_CROUCH = 1.15;
const BOT_FOV = 75; // half-angle, degrees
const BOT_RATE = 0.42; // seconds between enemy shots

export type ScnPhase = "ready" | "live" | "paused" | "done";

export type Kill = { name: string; t: number; head: boolean };

export type Hud = {
  health: number;
  mag: number;
  reserve: number;
  reloading: boolean;
  left: number;
  shots: number;
  hits: number;
  kills: number;
  total: number;
};

export type ScenarioResult = {
  outcome: "win" | "dead" | "time";
  kills: Kill[];
  total: number;
  killedBy: string | null;
  time: number;
  health: number;
  shots: number;
  hits: number;
  headshots: number;
  stars: [boolean, boolean, boolean];
  score: number;
  survivors: Pin[];
};

export type ScnCallbacks = {
  onPhase(p: ScnPhase): void;
  onHud(h: Hud): void;
  onFeed(k: { killer: string; victim: string; head: boolean; id: number }): void;
  onHit(kind: "body" | "head" | "kill"): void;
  onHurt(fromAngle: number): void;
  onEnd(r: ScenarioResult): void;
  onLockError(): void;
};

type Bot = {
  spot: BotSpot;
  agent: AgentDef;
  root: THREE.Group;
  parts: THREE.Mesh[];
  flash: THREE.Mesh;
  hp: number;
  alive: boolean;
  home: THREE.Vector3;
  peekTo: THREE.Vector3 | null;
  yaw: number;
  peekState: "idle" | "hidden" | "out" | "hold" | "back";
  stateUntil: number;
  seenAt: number | null;
  lostAt: number;
  fireAt: number;
  alerted: boolean;
  spottedUntil: number;
  diedAt: number;
  fallDir: number;
};

const yawTo = (from: THREE.Vector3, x: number, z: number) => Math.atan2(-(x - from.x), -(z - from.z));
const angDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const gauss = () => {
  const u = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
};

export class ScenarioEngine {
  readonly audio = new ScenarioAudio();
  phase: ScnPhase = "ready";

  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private vmScene = new THREE.Scene();
  private vmCam = new THREE.PerspectiveCamera(55, 16 / 9, 0.01, 10);
  private vm: ReturnType<typeof buildViewmodel>;
  private renderer: THREE.WebGLRenderer;
  private solids: THREE.Mesh[];
  private bots: Bot[] = [];
  private decals: THREE.Mesh[] = [];
  private decalGeo = new THREE.CircleGeometry(0.035, 10);
  private decalMat = new THREE.MeshBasicMaterial({ color: 0x1a1410, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  private ray = new THREE.Raycaster();
  private minimap: CanvasRenderingContext2D | null = null;
  private ro: ResizeObserver;

  // player
  private pos = new THREE.Vector3();
  private vel = new THREE.Vector2();
  private vy = 0;
  private onGround = true;
  private crouchT = 0;
  private yaw = 0;
  private pitch = 0;
  private recoil = 0;
  private health = 100;
  private keys = new Set<string>();
  private stepAcc = 0;
  private bloom = 0;
  private mag = 0;
  private reserve = 0;
  private reloadUntil = 0;
  private lastShot = -1;
  private kick = 0;
  private flashT = 0;

  // round
  private time = 0;
  private shots = 0;
  private hits = 0;
  private headshots = 0;
  private kills: Kill[] = [];
  private killedBy: string | null = null;
  private feedId = 0;
  private raf = 0;
  private last = 0;
  private hudAcc = 0;
  private mapAcc = 0;
  private disposed = false;

  constructor(
    private host: HTMLElement,
    private def: ScenarioDef,
    private settings: Settings,
    private cb: ScnCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = false;
    this.renderer.domElement.className = "aim-canvas";
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(V_FOV, 16 / 9, 0.05, 200);
    this.camera.rotation.order = "YXZ";
    this.vmCam.fov = 55;

    this.scene.background = new THREE.Color(0xb7c4cf);
    this.scene.fog = new THREE.Fog(0xc9ccd0, 35, 90);
    this.scene.add(new THREE.HemisphereLight(0xfff1dd, 0x6b5a4a, 1.6));
    const sun = new THREE.DirectionalLight(0xffe2bd, 2.4);
    sun.position.set(14, 24, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -32;
    sc.right = 32;
    sc.top = 32;
    sc.bottom = -32;
    sc.far = 80;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    const built = buildMap(def.map);
    this.scene.add(built.group);
    this.solids = built.solids;

    this.vm = buildViewmodel();
    this.vm.group.scale.setScalar(0.75);
    this.vmScene.add(this.vm.group, new THREE.HemisphereLight(0xfff1dd, 0x3a3530, 2.2));
    const vmSun = new THREE.DirectionalLight(0xffffff, 1.2);
    vmSun.position.set(1, 2, 1);
    this.vmScene.add(vmSun);

    this.audio.volume = settings.volume;
    this.reset();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    document.addEventListener("pointerlockchange", this.onLockChange);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("keydown", this.onKey);
    document.addEventListener("keyup", this.onKey);
    this.renderer.domElement.addEventListener("mousedown", this.onMouseDown);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ── control ───────────────────────────────────────────────────────────────

  get canvas() {
    return this.renderer.domElement;
  }

  setMinimap(c: HTMLCanvasElement | null) {
    this.minimap = c?.getContext("2d") ?? null;
  }

  lock() {
    this.audio.unlock();
    const el = this.canvas;
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

  /** Put everyone back on their marks and wait for the click. */
  reset() {
    for (const b of this.bots) {
      this.scene.remove(b.root);
      disposeAgent(b.root);
    }
    this.bots = this.def.bots.map((spot) => this.spawnBot(spot));
    for (const d of this.decals) this.scene.remove(d);
    this.decals = [];

    const s = this.def.spawn;
    this.pos.set(s.x, 0, s.z);
    this.vel.set(0, 0);
    this.vy = 0;
    this.onGround = true;
    this.crouchT = 0;
    this.yaw = s.yaw;
    this.pitch = 0;
    this.recoil = 0;
    this.health = 100;
    this.bloom = 0;
    this.mag = this.def.weapon.mag;
    this.reserve = this.def.weapon.reserve;
    this.reloadUntil = 0;
    this.lastShot = -1;
    this.time = 0;
    this.shots = 0;
    this.hits = 0;
    this.headshots = 0;
    this.kills = [];
    this.killedBy = null;
    this.keys.clear();
    this.setPhase(document.pointerLockElement === this.canvas ? "live" : "ready");
    this.emitHud();
  }

  quit() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    document.removeEventListener("pointerlockchange", this.onLockChange);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("keydown", this.onKey);
    document.removeEventListener("keyup", this.onKey);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    for (const sc of [this.scene, this.vmScene])
      sc.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.MeshStandardMaterial;
          m.map?.dispose();
          m.dispose();
        }
      });
    this.audio.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  // ── setup ─────────────────────────────────────────────────────────────────

  private spawnBot(spot: BotSpot): Bot {
    const agent = AGENTS[spot.agent];
    const root = buildAgent(agent);
    const home = new THREE.Vector3(spot.at[0], spot.y ?? 0, spot.at[1]);
    root.position.copy(home);
    const yaw = yawTo(home, spot.face[0], spot.face[1]);
    root.rotation.y = yaw;
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0 }),
    );
    flash.position.set(0, 1.34, -0.68);
    root.add(flash);
    this.scene.add(root);
    const parts: THREE.Mesh[] = [];
    root.traverse((o) => {
      if (o instanceof THREE.Mesh && o.userData.part) parts.push(o);
    });
    return {
      spot, agent, root, parts, flash,
      hp: 100,
      alive: true,
      home,
      peekTo: spot.peek ? new THREE.Vector3(spot.peek.to[0], home.y, spot.peek.to[1]) : null,
      yaw,
      peekState: "idle",
      stateUntil: 0,
      seenAt: null,
      lostAt: -1,
      fireAt: 0,
      alerted: false,
      spottedUntil: -1,
      diedAt: 0,
      fallDir: 1,
    };
  }

  private setPhase(p: ScnPhase) {
    this.phase = p;
    this.cb.onPhase(p);
  }

  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.vmCam.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.vmCam.updateProjectionMatrix();
  }

  // ── input ─────────────────────────────────────────────────────────────────

  private onLockChange = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (!locked) {
      this.keys.clear();
      if (this.phase === "live") this.setPhase("paused");
    } else if (this.phase === "ready" || this.phase === "paused") {
      this.setPhase("live");
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.phase !== "live") return;
    const k = VAL_YAW * this.settings.sens * (Math.PI / 180);
    this.yaw -= e.movementX * k;
    this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * k, -1.5, 1.5);
  };

  private onKey = (e: KeyboardEvent) => {
    if (this.phase !== "live") return;
    if (e.type === "keydown") {
      if (e.code === "KeyR" && !e.repeat) this.startReload();
      if (e.code === "Space" && !e.repeat && this.onGround) {
        this.vy = JUMP_V;
        this.onGround = false;
      }
      this.keys.add(e.code);
      if (["Space", "ControlLeft", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    } else {
      this.keys.delete(e.code);
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0 && this.phase === "live") this.fire();
  };

  // ── weapon ────────────────────────────────────────────────────────────────

  private startReload() {
    const w = this.def.weapon;
    if (this.reloadUntil > this.time || this.mag === w.mag || this.reserve <= 0) return;
    this.reloadUntil = this.time + w.reload;
    this.audio.reload();
  }

  private spreadDeg() {
    const s = this.def.weapon.spread;
    const speed = this.vel.length();
    let move = 0;
    if (!this.onGround) move = s.air;
    else if (speed > WALK + 0.3) move = s.run * Math.min(1, (speed - WALK) / (RUN - WALK) + 0.4);
    else if (speed > 0.6) move = s.walk;
    const crouch = this.crouchT > 0.5 ? s.crouchMul : 1;
    return (s.base + this.bloom + move) * crouch;
  }

  private fire() {
    const w = this.def.weapon;
    if (this.reloadUntil > this.time) return;
    if (this.time - this.lastShot < w.interval) return;
    if (this.mag <= 0) {
      this.audio.empty();
      this.startReload();
      return;
    }
    this.lastShot = this.time;
    this.mag--;
    this.shots++;
    this.kick = 1;
    this.flashT = 0.05;
    this.audio.shot();

    // Random point in the spread cone around the view direction.
    const sp = THREE.MathUtils.degToRad(this.spreadDeg());
    const r = sp * Math.sqrt(Math.random());
    const th = Math.random() * Math.PI * 2;
    const dir = new THREE.Vector3(Math.tan(r) * Math.cos(th), Math.tan(r) * Math.sin(th), -1)
      .normalize()
      .applyQuaternion(this.camera.quaternion);
    this.bloom = Math.min(6, this.bloom + w.spread.perShot);
    this.recoil = Math.min(0.06, this.recoil + 0.012);

    // Every shot is heard by everyone nearby.
    for (const b of this.bots) if (b.alive && b.home.distanceTo(this.pos) < 22) b.alerted = true;

    this.ray.set(this.camera.position, dir);
    this.ray.far = 150;
    const live = this.bots.filter((b) => b.alive);
    const hits = this.ray.intersectObjects([...live.flatMap((b) => b.parts), ...this.solids], false);
    const first = hits[0];
    if (!first) return;
    const bot = live.find((b) => b.parts.includes(first.object as THREE.Mesh));
    if (!bot) {
      this.decal(first.point, first.face?.normal, first.object);
      return;
    }
    const part = first.object.userData.part as Part;
    const dmg = w.damage[part];
    this.hits++;
    bot.hp -= dmg;
    bot.alerted = true;
    if (bot.hp <= 0) {
      this.killBot(bot, part === "head");
      this.cb.onHit("kill");
      this.audio.hit(part === "head" ? "head" : "kill");
    } else {
      this.cb.onHit(part === "head" ? "head" : "body");
      this.audio.hit(part === "head" ? "head" : "body");
    }
    this.emitHud();
  }

  private decal(point: THREE.Vector3, normal: THREE.Vector3 | undefined, obj: THREE.Object3D) {
    if (!normal) return;
    const n = normal.clone().transformDirection(obj.matrixWorld);
    const d = new THREE.Mesh(this.decalGeo, this.decalMat);
    d.position.copy(point).addScaledVector(n, 0.005);
    d.lookAt(point.clone().add(n));
    this.scene.add(d);
    this.decals.push(d);
    if (this.decals.length > 60) this.scene.remove(this.decals.shift()!);
  }

  private killBot(bot: Bot, head: boolean) {
    bot.alive = false;
    bot.diedAt = this.time;
    bot.fallDir = Math.random() < 0.5 ? -1 : 1;
    if (head) this.headshots++;
    this.kills.push({ name: bot.agent.name, t: this.time, head });
    this.cb.onFeed({ killer: "You", victim: bot.agent.name, head, id: ++this.feedId });
    if (this.bots.every((b) => !b.alive)) this.finish("win");
  }

  // ── bots ──────────────────────────────────────────────────────────────────

  private eye() {
    return this.pos.y + THREE.MathUtils.lerp(EYE, EYE_CROUCH, this.crouchT);
  }

  /** Clear sight line between two points, ignoring the end points. */
  private clear(a: THREE.Vector3, b: THREE.Vector3) {
    const dir = b.clone().sub(a);
    const len = dir.length();
    this.ray.set(a, dir.divideScalar(len));
    this.ray.far = len - 0.05;
    return this.ray.intersectObjects(this.solids, false).length === 0;
  }

  private updateBot(b: Bot, dt: number) {
    if (!b.alive) {
      const k = Math.min(1, (this.time - b.diedAt) / 0.35);
      b.root.rotation.z = (k * k * Math.PI * b.fallDir) / 2;
      b.root.position.y = b.home.y + Math.sin(k * Math.PI) * 0.1;
      return;
    }
    const p = b.root.position;
    const head = new THREE.Vector3(p.x, p.y + 1.62, p.z);
    const eye = this.eye();
    const you = new THREE.Vector3(this.pos.x, eye, this.pos.z);
    const chest = new THREE.Vector3(this.pos.x, eye - 0.45, this.pos.z);
    const dist = head.distanceTo(you);

    // Can it see you? Holding an angle narrows its view until it's alerted.
    const toYou = yawTo(p, this.pos.x, this.pos.z);
    const inView = b.alerted || Math.abs(angDiff(toYou, b.yaw)) < THREE.MathUtils.degToRad(BOT_FOV);
    const headClear = inView && this.clear(head, you);
    const chestClear = inView && this.clear(head, chest);
    const sees = headClear || chestClear;

    // And can you see it? (minimap spotting)
    const fromYou = yawTo(you, p.x, p.z);
    if (Math.abs(angDiff(fromYou, this.yaw)) < 1.1 && this.clear(you, head)) b.spottedUntil = this.time + 1.5;

    if (sees) {
      if (b.seenAt === null) {
        b.seenAt = this.time;
        b.fireAt = this.time + THREE.MathUtils.lerp(b.spot.react[0], b.spot.react[1], Math.random());
      }
      b.lostAt = this.time;
      b.alerted = true;
    } else if (b.seenAt !== null && this.time - b.lostAt > 0.25) {
      b.seenAt = null;
    }

    // Wide peek: swing out, hold, fall back — but never retreat mid-fight.
    if (b.peekTo) {
      const trig = b.spot.peek!.trigger;
      if (b.peekState === "idle" && (dist < trig || b.alerted)) {
        b.peekState = "hidden";
        b.stateUntil = this.time + 0.3 + Math.random() * 0.8;
      }
      const target = b.peekState === "out" || b.peekState === "hold" ? b.peekTo : b.home;
      if (b.peekState === "hidden" && this.time > b.stateUntil) b.peekState = "out";
      if (b.peekState === "out" && p.distanceTo(b.peekTo) < 0.05) {
        b.peekState = "hold";
        b.stateUntil = this.time + 1.0 + Math.random() * 1.2;
      }
      if (b.peekState === "hold" && this.time > b.stateUntil && b.seenAt === null) b.peekState = "back";
      if (b.peekState === "back" && p.distanceTo(b.home) < 0.05) {
        b.peekState = "hidden";
        b.stateUntil = this.time + 0.8 + Math.random() * 1.4;
      }
      // Stop to shoot once engaged, like a counter-strafe.
      const moving = b.peekState === "out" || b.peekState === "back";
      if (moving && !(b.seenAt !== null && this.time >= b.fireAt - 0.1)) {
        const d = target.clone().sub(p);
        const step = Math.min(d.length(), 4.6 * dt);
        if (d.length() > 1e-4) p.addScaledVector(d.normalize(), step);
      }
    }

    // Turn: track you when engaged, otherwise settle back on the held angle.
    const want = b.seenAt !== null ? toYou : yawTo(p, b.spot.face[0], b.spot.face[1]);
    const diff = angDiff(want, b.yaw);
    b.yaw += Math.sign(diff) * Math.min(Math.abs(diff), 9 * dt);
    b.root.rotation.y = b.yaw;

    // Fire.
    (b.flash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (b.flash.material as THREE.MeshBasicMaterial).opacity - dt * 20);
    if (b.seenAt !== null && sees && this.time >= b.fireAt && Math.abs(diff) < 0.12) {
      b.fireAt = this.time + BOT_RATE * (0.85 + Math.random() * 0.3);
      this.botShot(b, dist, headClear, chestClear);
    }
  }

  private botShot(b: Bot, dist: number, headClear: boolean, chestClear: boolean) {
    (b.flash.material as THREE.MeshBasicMaterial).opacity = 1;
    const rel = angDiff(yawTo(this.pos, b.root.position.x, b.root.position.z), this.yaw);
    this.audio.enemyShot(-Math.sin(rel), dist);

    // Angular error around the visible aim point; behind cover only the head counts.
    const sigma = THREE.MathUtils.degToRad(b.spot.aimErr);
    const ox = Math.tan(gauss() * sigma) * dist;
    const oy = Math.tan(gauss() * sigma) * dist;
    let part: Part | null = null;
    if (chestClear) {
      if (Math.abs(ox) < 0.27 && oy > -0.9 && oy < 0.3) part = oy < -0.45 ? "legs" : "body";
      else if (Math.abs(ox) < 0.13 && oy >= 0.3 && oy < 0.6) part = "head";
    } else if (headClear && Math.abs(ox) < 0.13 && Math.abs(oy) < 0.15) {
      part = "head";
    }
    if (!part) return;
    const dmg = this.def.weapon.damage[part];
    this.health = Math.max(0, this.health - dmg);
    this.audio.hurt();
    this.cb.onHurt(rel);
    if (this.health <= 0) {
      this.killedBy = b.agent.name;
      this.cb.onFeed({ killer: b.agent.name, victim: "You", head: part === "head", id: ++this.feedId });
      this.finish("dead");
    }
    this.emitHud();
  }

  // ── round ─────────────────────────────────────────────────────────────────

  private finish(outcome: ScenarioResult["outcome"]) {
    if (this.phase !== "live") return;
    this.setPhase("done");
    this.audio.outcome(outcome === "win");
    const win = outcome === "win";
    const headKills = this.kills.filter((k) => k.head).length;
    const score =
      this.kills.length * 100 +
      headKills * 50 +
      (win ? Math.round(this.health * 2 + Math.max(0, this.def.duration - this.time) * 10) : 0);
    this.cb.onEnd({
      outcome,
      kills: [...this.kills],
      total: this.bots.length,
      killedBy: this.killedBy,
      time: this.time,
      health: this.health,
      shots: this.shots,
      hits: this.hits,
      headshots: this.headshots,
      stars: [win, win && this.time <= this.def.par, win && this.health === 100],
      score,
      survivors: this.bots.filter((b) => b.alive).map((b) => ({ x: b.root.position.x, z: b.root.position.z, kind: "enemy" as const })),
    });
    if (document.pointerLockElement) document.exitPointerLock();
  }

  private emitHud() {
    this.cb.onHud({
      health: this.health,
      mag: this.mag,
      reserve: this.reserve,
      reloading: this.reloadUntil > this.time,
      left: Math.max(0, this.def.duration - this.time),
      shots: this.shots,
      hits: this.hits,
      kills: this.kills.length,
      total: this.bots.length,
    });
  }

  private movePlayer(dt: number) {
    const k = this.keys;
    const crouch = k.has("ControlLeft") || k.has("KeyC");
    this.crouchT = THREE.MathUtils.clamp(this.crouchT + (crouch ? 1 : -1) * dt * 8, 0, 1);
    const fx = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
    const fz = (k.has("KeyW") ? 1 : 0) - (k.has("KeyS") ? 1 : 0);
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    // forward = (-sin, -cos), right = (cos, -sin)
    const wx = fx * cos - fz * sin;
    const wz = -fx * sin - fz * cos;
    const len = Math.hypot(wx, wz);
    const speed = crouch ? CROUCH : k.has("ShiftLeft") ? WALK : RUN;
    const tx = len ? (wx / len) * speed : 0;
    const tz = len ? (wz / len) * speed : 0;
    const accel = this.onGround ? 60 : 8;
    const dvx = tx - this.vel.x;
    const dvz = tz - this.vel.y;
    const dv = Math.hypot(dvx, dvz);
    const step = Math.min(dv, accel * dt);
    if (dv > 1e-6) this.vel.set(this.vel.x + (dvx / dv) * step, this.vel.y + (dvz / dv) * step);

    const map = this.def.map;
    const height = crouch ? 1.3 : 1.8;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.y * dt;
    resolve(map, this.pos, height);

    const ground = groundAt(map, this.pos.x, this.pos.z, this.pos.y);
    if (this.onGround) {
      if (ground > this.pos.y) this.pos.y = ground; // step up
      else if (ground < this.pos.y - 0.02) this.onGround = false; // walked off
      else this.pos.y = ground;
    }
    if (!this.onGround) {
      this.vy -= GRAVITY * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= ground) {
        this.pos.y = ground;
        this.vy = 0;
        this.onGround = true;
      }
    }

    const sp = this.vel.length();
    if (this.onGround && sp > WALK + 0.3) {
      this.stepAcc += dt;
      if (this.stepAcc > 0.33) {
        this.stepAcc = 0;
        this.audio.step();
      }
    }
  }

  private drawMap() {
    if (!this.minimap) return;
    const pins: Pin[] = this.bots.map((b) =>
      b.alive
        ? b.spottedUntil > this.time
          ? { x: b.root.position.x, z: b.root.position.z, kind: "enemy" as const }
          : null
        : { x: b.root.position.x, z: b.root.position.z, kind: "dead" as const },
    ).filter((p): p is NonNullable<typeof p> => p !== null);
    pins.push({ x: this.pos.x, z: this.pos.z, kind: "you", yaw: this.yaw });
    drawMinimap(this.minimap, this.def.map, pins);
  }

  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    if (this.phase === "live") {
      this.time += dt;
      this.movePlayer(dt);
      this.bloom = Math.max(0, this.bloom - this.def.weapon.spread.recover * dt);
      this.recoil = Math.max(0, this.recoil - dt * 0.12);
      if (this.reloadUntil > 0 && this.time >= this.reloadUntil) {
        const take = Math.min(this.def.weapon.mag - this.mag, this.reserve);
        this.mag += take;
        this.reserve -= take;
        this.reloadUntil = 0;
        this.emitHud();
      }
      for (const b of this.bots) this.updateBot(b, dt);
      if (this.phase === "live" && this.time >= this.def.duration) this.finish("time");
      this.hudAcc += dt;
      if (this.hudAcc > 0.1) {
        this.hudAcc = 0;
        this.emitHud();
      }
    } else {
      // Fallen bodies still finish falling while paused or after the round.
      for (const b of this.bots) if (!b.alive) this.updateBot(b, 0);
    }

    this.mapAcc += dt;
    if (this.mapAcc > 0.06) {
      this.mapAcc = 0;
      this.drawMap();
    }

    // Camera.
    this.camera.position.set(this.pos.x, this.eye(), this.pos.z);
    this.camera.rotation.set(this.pitch + this.recoil, this.yaw, 0);

    // Viewmodel: recoil kick, reload dip, walk bob, muzzle flash.
    this.kick = Math.max(0, this.kick - dt * 9);
    this.flashT = Math.max(0, this.flashT - dt);
    const vm = this.vm.group;
    const reloadP = this.reloadUntil > this.time ? 1 - (this.reloadUntil - this.time) / this.def.weapon.reload : 0;
    const dip = Math.sin(reloadP * Math.PI);
    const bob = this.onGround ? Math.min(1, this.vel.length() / RUN) : 0;
    const t = now / 1000;
    vm.position.set(0.11 + Math.sin(t * 9) * 0.006 * bob, -0.115 - dip * 0.12 - Math.abs(Math.cos(t * 9)) * 0.006 * bob, -0.34 + this.kick * 0.035);
    vm.rotation.set(this.kick * 0.22 - dip * 0.9, 0.16, dip * 0.4);
    this.vm.slide.position.z = -0.06 + this.kick * 0.03;
    (this.vm.flash.material as THREE.MeshBasicMaterial).opacity = this.flashT > 0 ? 1 : 0;
    this.vm.flash.rotation.z = t * 40;

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.vmScene, this.vmCam);
  };
}
