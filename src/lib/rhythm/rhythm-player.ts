import { SynthEngine } from "@/lib/audio/synth-engine";
import { planRhythm } from "./cells";

/** Short, dry envelope so note lengths (and the rests between them) are clearly audible. */
const PERCUSSIVE_ADSR = { attack: 0.004, decay: 0.12, sustain: 0.55, release: 0.03 };
const PITCH = 72; // C5

export interface PlayOptions {
  bpm: number;
  countIn: boolean;
  metronome: boolean;
}

/** Plays a one-measure rhythm on a single pitch, with optional count-in and metronome clicks. */
export class RhythmPlayer {
  private readonly ctx: AudioContext;
  private readonly synth: SynthEngine;
  private readonly clickBus: GainNode;

  constructor() {
    this.ctx = new AudioContext();
    this.synth = new SynthEngine(this.ctx, { adsr: PERCUSSIVE_ADSR, volume: 0.45 });
    this.clickBus = this.ctx.createGain();
    this.clickBus.gain.value = 0.25;
    this.clickBus.connect(this.ctx.destination);
  }

  private click(when: number, accent: boolean) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = accent ? 1800 : 1200;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(accent ? 1 : 0.6, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
    osc.connect(g).connect(this.clickBus);
    osc.start(when);
    osc.stop(when + 0.05);
  }

  /** Returns the total length in seconds (count-in included). */
  play(ids: string[], { bpm, countIn, metronome }: PlayOptions): number {
    void this.ctx.resume();
    const beat = 60 / bpm;
    const beats = ids.length;
    const t0 = this.ctx.currentTime + 0.08;
    const lead = countIn ? beats * beat : 0;

    if (countIn) for (let b = 0; b < beats; b++) this.click(t0 + b * beat, b === 0);
    if (metronome) for (let b = 0; b < beats; b++) this.click(t0 + lead + b * beat, b === 0);
    for (const h of planRhythm(ids, bpm)) this.synth.playNote(PITCH, t0 + lead + h.start, h.duration, 0.85);

    return lead + beats * beat + 0.1;
  }

  close() {
    void this.ctx.close();
  }
}
