import { centsOff } from "./music-math";

export interface StabilizerOptions {
  /** Max deviation from the run's center pitch, in cents (run spread may not exceed 2x this). */
  toleranceCents?: number;
  /** Continuous time the pitch must hold to confirm the note, in ms. */
  holdMs?: number;
  /** Unvoiced gap tolerated before the run is discarded, in ms. */
  graceMs?: number;
}

export interface StabilizerState {
  /** 0..1 progress toward confirmation (drives the stabilization bar). */
  progress: number;
  /** Median frequency of the current run, null when idle. */
  frequency: number | null;
  /** Latched true once the note has been held long enough. */
  confirmed: boolean;
  /** Median frequency at the moment of confirmation. */
  confirmedFrequency: number | null;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Confirms a sung note after it stays within ±tolerance cents for holdMs. Pure: time is injected. */
export class NoteStabilizer {
  private readonly tol: number;
  private readonly hold: number;
  private readonly grace: number;
  private samples: number[] = [];
  private runStart = 0;
  private lastVoiced = 0;
  private confirmedFreq: number | null = null;

  constructor(opts: StabilizerOptions = {}) {
    this.tol = opts.toleranceCents ?? 35;
    this.hold = opts.holdMs ?? 400;
    this.grace = opts.graceMs ?? 100;
  }

  reset(): void {
    this.samples = [];
    this.confirmedFreq = null;
  }

  /** Feed one analysis frame. `frequency` is null when unvoiced. */
  update(nowMs: number, frequency: number | null): StabilizerState {
    if (this.confirmedFreq === null) {
      if (frequency === null) {
        if (this.samples.length && nowMs - this.lastVoiced > this.grace) this.samples = [];
      } else {
        // Run breaks when its pitch spread would exceed ±tol around some center (order-independent,
        // so vibrato within the tolerance never resets it).
        if (this.samples.length) {
          const lo = Math.min(...this.samples, frequency);
          const hi = Math.max(...this.samples, frequency);
          if (centsOff(hi, lo) > 2 * this.tol) this.samples = [];
        }
        if (!this.samples.length) this.runStart = nowMs;
        this.samples.push(frequency);
        this.lastVoiced = nowMs;
        if (nowMs - this.runStart >= this.hold) this.confirmedFreq = median(this.samples);
      }
    }

    const active = this.samples.length > 0;
    return {
      progress: this.confirmedFreq !== null ? 1 : active ? Math.min(1, (nowMs - this.runStart) / this.hold) : 0,
      frequency: active ? median(this.samples) : null,
      confirmed: this.confirmedFreq !== null,
      confirmedFrequency: this.confirmedFreq,
    };
  }
}
