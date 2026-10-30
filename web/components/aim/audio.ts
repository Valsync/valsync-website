// Synthesized hit sounds: no audio files to ship, and the very first click
// (the one that grabs pointer lock) is the user gesture that unlocks audio.

export type Sound = "hit" | "head" | "kill" | "miss" | "tick" | "go";

export class Sfx {
  private ctx: AudioContext | null = null;
  volume = 0.5;

  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  play(kind: Sound) {
    const ctx = this.ctx;
    if (!ctx || this.volume <= 0) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);

    const [type, from, to, dur, level]: [OscillatorType, number, number, number, number] = {
      hit: ["triangle", 880, 1320, 0.07, 0.5],
      head: ["square", 1560, 2400, 0.09, 0.28],
      kill: ["triangle", 660, 1980, 0.12, 0.5],
      miss: ["sine", 220, 140, 0.06, 0.25],
      tick: ["sine", 740, 740, 0.08, 0.35],
      go: ["sine", 1180, 1180, 0.18, 0.4],
    }[kind] as [OscillatorType, number, number, number, number];

    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(level * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}
