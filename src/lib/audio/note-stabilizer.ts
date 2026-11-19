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
  private samples: { time: number; freq: number }[] = [];
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
        // Keep a sliding window: trim older frames until the remaining pitch spread fits within ±tol,
        // so a brief scoop on vocal attack trims cleanly instead of wiping the whole run.
        this.samples.push({ time: nowMs, freq: frequency });
        this.lastVoiced = nowMs;
        while (this.samples.length > 1) {
          let lo = Infinity;
          let hi = -Infinity;
          for (const s of this.samples) {
            if (s.freq < lo) lo = s.freq;
            if (s.freq > hi) hi = s.freq;
          }
          if (centsOff(hi, lo) <= 2 * this.tol) break;
          this.samples.shift();
        }
        const runStart = this.samples[0].time;
        if (nowMs - runStart >= this.hold) {
          this.confirmedFreq = median(this.samples.map((s) => s.freq));
        }
      }
    }

    const active = this.samples.length > 0;
    return {
      progress: this.confirmedFreq !== null ? 1 : active ? Math.min(1, (nowMs - this.samples[0].time) / this.hold) : 0,
      frequency: active ? median(this.samples.map((s) => s.freq)) : null,
      confirmed: this.confirmedFreq !== null,
      confirmedFrequency: this.confirmedFreq,
    };
  }
}
