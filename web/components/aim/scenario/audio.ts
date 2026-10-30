// Every scenario sound is synthesized: no recorded or game audio ships.
// Gunshots are a filtered noise crack over a falling sine thump; enemy shots
// are panned and darkened with distance so you can hear where fire comes from.

export class ScenarioAudio {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  volume = 0.5;

  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return;
      }
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
  }

  private out(pan = 0, gain = 1) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = gain * this.volume;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p).connect(ctx.destination);
    return g;
  }

  private burst(dest: AudioNode, dur: number, freq: number, q: number, level: number, delay = 0) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5, dur + 0.05);
  }

  private tone(dest: AudioNode, type: OscillatorType, from: number, to: number, dur: number, level: number, delay = 0) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Your own pistol. */
  shot() {
    if (!this.ctx || this.volume <= 0) return;
    const o = this.out(0, 0.9);
    this.burst(o, 0.09, 2400, 0.7, 1);
    this.burst(o, 0.25, 700, 0.9, 0.5);
    this.tone(o, "sine", 150, 45, 0.18, 0.9);
  }

  /** An enemy shot from `dist` metres away; `pan` -1 left … 1 right. */
  enemyShot(pan: number, dist: number) {
    if (!this.ctx || this.volume <= 0) return;
    const o = this.out(pan, 0.9 / (1 + dist / 10));
    this.burst(o, 0.08, 1800 - Math.min(1200, dist * 40), 0.8, 1);
    this.burst(o, 0.35, 500, 0.8, 0.45);
    this.tone(o, "sine", 120, 40, 0.2, 0.7);
  }

  reload() {
    if (!this.ctx || this.volume <= 0) return;
    const o = this.out(0.2, 0.6);
    this.burst(o, 0.04, 3200, 4, 0.8, 0.15);
    this.burst(o, 0.05, 2200, 4, 0.9, 0.85);
    this.burst(o, 0.04, 3600, 5, 1, 1.4);
  }

  empty() {
    if (!this.ctx || this.volume <= 0) return;
    this.burst(this.out(0.1, 0.5), 0.03, 4200, 6, 0.8);
  }

  step(pan = 0, level = 0.25) {
    if (!this.ctx || this.volume <= 0) return;
    this.burst(this.out(pan, level), 0.07, 900 + Math.random() * 300, 1.2, 1);
  }

  hurt() {
    if (!this.ctx || this.volume <= 0) return;
    const o = this.out(0, 0.6);
    this.tone(o, "sawtooth", 180, 90, 0.18, 0.5);
    this.burst(o, 0.12, 400, 1, 0.6);
  }

  hit(kind: "body" | "head" | "kill") {
    if (!this.ctx || this.volume <= 0) return;
    const o = this.out(0, 0.55);
    if (kind === "head") {
      this.tone(o, "square", 1700, 2600, 0.08, 0.35);
      this.tone(o, "triangle", 2600, 2600, 0.12, 0.3, 0.03);
    } else if (kind === "kill") {
      this.tone(o, "triangle", 660, 1320, 0.1, 0.55);
      this.tone(o, "triangle", 990, 1980, 0.14, 0.45, 0.07);
    } else {
      this.tone(o, "triangle", 900, 1200, 0.06, 0.45);
    }
  }

  outcome(win: boolean) {
    if (!this.ctx || this.volume <= 0) return;
    const o = this.out(0, 0.5);
    const notes = win ? [523, 659, 784, 1046] : [392, 330, 262];
    notes.forEach((f, i) => this.tone(o, "triangle", f, f, 0.32, 0.45, i * 0.12));
  }
}
