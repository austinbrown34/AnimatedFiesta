// Optional, non-blocking Web Audio polish: tiny synth blips for firing,
// cheering, portals, and the win sting. Every method is guarded so a missing or
// suspended AudioContext silently no-ops — audio never affects gameplay.
export class Audio {
  private ctx?: AudioContext;
  private master?: GainNode;

  /** Call from a user gesture (the Begin click) to create/resume the context. */
  resume(): void {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.ctx.destination);
      }
      void this.ctx.resume();
    } catch {
      /* audio is optional */
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, when = 0, gain = 0.25): void {
    if (!this.ctx || !this.master) return;
    try {
      const t = this.ctx.currentTime + when;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch {
      /* ignore */
    }
  }

  private sweep(from: number, to: number, dur: number, gain = 0.2): void {
    if (!this.ctx || !this.master) return;
    try {
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(from, t);
      o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch {
      /* ignore */
    }
  }

  fire(): void {
    this.blip(200, 0.08, "square", 0, 0.1);
  }
  cheer(): void {
    [523, 659, 784].forEach((f, i) => this.blip(f, 0.18, "triangle", i * 0.05, 0.18));
  }
  portal(): void {
    this.sweep(200, 1200, 0.55, 0.18);
  }
  win(): void {
    [261, 329, 392, 523].forEach((f, i) => this.blip(f, 0.5, "triangle", i * 0.12, 0.22));
    this.blip(65, 1.2, "sine", 0, 0.28); // bass drop
  }
}
