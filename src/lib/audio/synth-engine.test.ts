import { describe, expect, it, vi } from "vitest";
import { midiToFrequency } from "./music-math";
import { planEnvelope, planSequence, RHODES_ADSR, SynthEngine } from "./synth-engine";

const adsr = { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.3 };

describe("planEnvelope", () => {
  it("goes 0 -> peak -> sustain -> release -> 0 for a long note", () => {
    const p = planEnvelope(adsr, 1, 2, 0.8);
    expect(p.map((x) => [+x.time.toFixed(3), x.value])).toEqual([
      [1, 0], [1.1, 0.8], [1.3, 0.4], [3, 0.4], [3.3, 0],
    ]);
  });

  it("releases from mid-decay level when the note is short", () => {
    const p = planEnvelope(adsr, 0, 0.2, 1); // end 0.2: halfway through decay (0.1..0.3)
    const rel = p[p.length - 2];
    expect(rel.time).toBeCloseTo(0.2);
    expect(rel.value).toBeCloseTo(0.75);
    expect(p[p.length - 1].value).toBe(0);
  });

  it("times are monotonically non-decreasing", () => {
    for (const d of [0.01, 0.05, 0.2, 5]) {
      const t = planEnvelope(RHODES_ADSR, 0, d).map((x) => x.time);
      expect([...t].sort((a, b) => a - b)).toEqual(t);
    }
  });
});

describe("planSequence", () => {
  it("lays notes end to end at the given tempo", () => {
    const s = planSequence([{ midi: 60, beats: 1 }, { midi: 64, beats: 2 }], 120, 1);
    expect(s).toEqual([
      { midi: 60, start: 0, duration: 0.5 },
      { midi: 64, start: 0.5, duration: 1 },
    ]);
  });
});

function fakeCtx() {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const node = () => {
    const n: Record<string, unknown> = { connect: vi.fn((t: unknown) => t), start: vi.fn(), stop: vi.fn() };
    return n;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oscs: Record<string, any>[] = [];
  const ctx = {
    currentTime: 0,
    destination: {},
    createGain: () => Object.assign(node(), { gain: param() }),
    createBiquadFilter: () => Object.assign(node(), { Q: param(), frequency: param(), type: "" }),
    createOscillator: () => {
      const o = Object.assign(node(), { frequency: param(), type: "sine" });
      oscs.push(o);
      return o;
    },
  };
  return { ctx: ctx as unknown as BaseAudioContext, oscs };
}

describe("SynthEngine", () => {
  it("creates 3 oscillators per note tuned to the right pitch and scheduled on the clock", () => {
    const { ctx, oscs } = fakeCtx();
    const synth = new SynthEngine(ctx);
    synth.playNote(69, 2, 1);
    expect(oscs).toHaveLength(3);
    expect(oscs[0].frequency.value).toBeCloseTo(440);
    expect(oscs[2].frequency.value).toBeCloseTo(880);
    expect(oscs[0].start).toHaveBeenCalledWith(2);
    expect(oscs[0].stop.mock.calls[0][0]).toBeGreaterThan(3);
  });

  it("playSequence schedules each note at its offset and returns total length", () => {
    const { ctx, oscs } = fakeCtx();
    const synth = new SynthEngine(ctx);
    const total = synth.playSequence([{ midi: 60, beats: 1 }, { midi: 67, beats: 1 }], 60, 10);
    expect(oscs).toHaveLength(6);
    expect(oscs[3].start).toHaveBeenCalledWith(11);
    expect(oscs[3].frequency.value).toBeCloseTo(midiToFrequency(67));
    expect(total).toBeGreaterThan(1.9);
  });
});
