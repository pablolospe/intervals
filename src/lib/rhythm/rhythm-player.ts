import { SynthEngine } from "@/lib/audio/synth-engine";
import { getCell, planRhythm } from "./cells";

/** Short, dry envelope so note lengths (and the rests between them) are clearly audible. */
const PERCUSSIVE_ADSR = { attack: 0.004, decay: 0.12, sustain: 0.55, release: 0.03 };
const PITCH = 72; // C5

const CLICK_LEVELS = {
  accent: { freq: 1800, gain: 1, decay: 0.04 },
  beat: { freq: 1200, gain: 0.6, decay: 0.04 },
  sub: { freq: 900, gain: 0.18, decay: 0.025 },
} as const;

type ClickLevel = keyof typeof CLICK_LEVELS;

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
  private readonly clicks = new Set<OscillatorNode>();

  constructor() {
    this.ctx = new AudioContext();
    this.synth = new SynthEngine(this.ctx, { adsr: PERCUSSIVE_ADSR, volume: 0.45 });
    this.clickBus = this.ctx.createGain();
    this.clickBus.gain.value = 0.25;
    this.clickBus.connect(this.ctx.destination);
  }

  private click(when: number, level: ClickLevel) {
    const { freq, gain, decay } = CLICK_LEVELS[level];
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, when + decay);
    osc.connect(g).connect(this.clickBus);
    osc.start(when);
    osc.stop(when + decay + 0.01);
    this.clicks.add(osc);
    osc.onended = () => this.clicks.delete(osc);
  }

  /** Cut whatever is playing (notes and clicks). */
  stop() {
    this.synth.stopAll();
    for (const osc of this.clicks) {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
    }
    this.clicks.clear();
  }

  /** Returns the total length in seconds (count-in included). */
  play(ids: string[], { bpm, countIn, metronome }: PlayOptions): number {
    void this.ctx.resume();
    this.stop();
    const beat = 60 / bpm;
    const beats = ids.length;
    const t0 = this.ctx.currentTime + 0.08;
    const lead = countIn ? beats * beat : 0;

    const isTernary = ids.length > 0 && getCell(ids[0]).subdivision === "ternary";
    const scheduleBarClicks = (barStart: number) => {
      for (let b = 0; b < beats; b++) {
        this.click(barStart + b * beat, b === 0 ? "accent" : "beat");
        if (isTernary) {
          this.click(barStart + (b + 1 / 3) * beat, "sub");
          this.click(barStart + (b + 2 / 3) * beat, "sub");
        }
      }
    };

    if (countIn) scheduleBarClicks(t0);
    if (metronome) scheduleBarClicks(t0 + lead);
    for (const h of planRhythm(ids, bpm)) this.synth.playNote(PITCH, t0 + lead + h.start, h.duration, 0.85);

    return lead + beats * beat + 0.1;
  }

  close() {
    void this.ctx.close();
  }
}
