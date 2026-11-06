import { midiToFrequency } from "./music-math";

export interface Adsr {
  attack: number; // s
  decay: number; // s
  sustain: number; // 0..1 of peak
  release: number; // s
}

export interface EnvelopePoint {
  time: number; // absolute, seconds
  value: number;
}

export const RHODES_ADSR: Adsr = { attack: 0.008, decay: 0.7, sustain: 0.35, release: 0.35 };

/**
 * Piecewise-linear ADSR. Returns breakpoints from `start`; the note is held for
 * `duration` seconds and then released. Linear segments make the level at release exact.
 */
export function planEnvelope(adsr: Adsr, start: number, duration: number, peak = 1): EnvelopePoint[] {
  const attackEnd = start + adsr.attack;
  const decayEnd = attackEnd + adsr.decay;
  const sus = adsr.sustain * peak;
  const end = start + Math.max(duration, adsr.attack);

  let levelAtEnd: number;
  if (end <= attackEnd) levelAtEnd = peak * ((end - start) / adsr.attack);
  else if (end < decayEnd) levelAtEnd = peak + (sus - peak) * ((end - attackEnd) / adsr.decay);
  else levelAtEnd = sus;

  const pts: EnvelopePoint[] = [{ time: start, value: 0 }];
  if (end > attackEnd) pts.push({ time: attackEnd, value: peak });
  if (end > decayEnd) pts.push({ time: decayEnd, value: sus });
  pts.push({ time: end, value: levelAtEnd });
  pts.push({ time: end + adsr.release, value: 0 });
  return pts;
}

export interface SequenceNote {
  midi: number;
  beats: number;
}

export interface ScheduledNote {
  midi: number;
  start: number; // seconds from sequence start
  duration: number; // seconds
}

/** Lay notes back to back at `bpm`. Sounding length is slightly shorter than the slot (legato gap). */
export function planSequence(notes: SequenceNote[], bpm: number, articulation = 0.92): ScheduledNote[] {
  const beat = 60 / bpm;
  let t = 0;
  return notes.map((n) => {
    const slot = n.beats * beat;
    const out = { midi: n.midi, start: t, duration: slot * articulation };
    t += slot;
    return out;
  });
}

export interface SynthOptions {
  adsr?: Adsr;
  volume?: number;
}

/**
 * Warm electric-piano voice: triangle + sine (+ soft octave) -> lowpass whose cutoff
 * closes over the note -> ADSR gain -> master. All timing on the hardware clock.
 */
export class SynthEngine {
  private readonly master: GainNode;
  private readonly adsr: Adsr;

  constructor(private readonly ctx: BaseAudioContext, opts: SynthOptions = {}) {
    this.adsr = opts.adsr ?? RHODES_ADSR;
    this.master = ctx.createGain();
    this.master.gain.value = opts.volume ?? 0.4;
    this.master.connect(ctx.destination);
  }

  /** Schedule one note at absolute context time `when`. Returns the time the sound has fully ended. */
  playNote(midi: number, when: number, duration: number, velocity = 0.8): number {
    const { ctx, adsr } = this;
    const freq = midiToFrequency(midi);
    const points = planEnvelope(adsr, when, duration, velocity);
    const stopAt = points[points.length - 1].time + 0.05;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(points[0].value, points[0].time);
    for (const p of points.slice(1)) gain.gain.linearRampToValueAtTime(p.value, p.time);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(Math.min(freq * 8, 9000), when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 2, 400), when + 0.6);

    const voices: [OscillatorType, number, number][] = [
      ["triangle", 1, 1],
      ["sine", 1, 0.6],
      ["sine", 2, 0.15],
    ];
    for (const [type, mult, level] of voices) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(filter);
      osc.start(when);
      osc.stop(stopAt);
    }
    filter.connect(gain).connect(this.master);
    return stopAt;
  }

  /** Play a sequence starting at `startAt` (default: now + small lead). Returns total length in seconds. */
  playSequence(notes: SequenceNote[], bpm = 90, startAt = this.ctx.currentTime + 0.05): number {
    const plan = planSequence(notes, bpm);
    for (const n of plan) this.playNote(n.midi, startAt + n.start, n.duration);
    const last = plan[plan.length - 1];
    return last ? last.start + last.duration + this.adsr.release : 0;
  }
}
