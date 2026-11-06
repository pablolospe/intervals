import { describe, expect, it } from "vitest";
import { evaluateInterval } from "./interval-evaluator";
import { midiToFrequency } from "./music-math";
import { NoteStabilizer } from "./note-stabilizer";

const cents = (f: number, c: number) => f * 2 ** (c / 1200);

/** Feed `f(t)` every 16ms from t0 to t1; returns last state. */
function feed(s: NoteStabilizer, t0: number, t1: number, f: (t: number) => number | null) {
  let st = s.update(t0, f(t0));
  for (let t = t0 + 16; t <= t1; t += 16) st = s.update(t, f(t));
  return st;
}

describe("NoteStabilizer", () => {
  it("confirms after 400ms of steady pitch with progress rising", () => {
    const s = new NoteStabilizer();
    const mid = feed(s, 0, 200, () => 220);
    expect(mid.confirmed).toBe(false);
    expect(mid.progress).toBeGreaterThan(0.4);
    expect(mid.progress).toBeLessThan(0.6);
    const end = feed(s, 216, 420, () => 220);
    expect(end.confirmed).toBe(true);
    expect(end.confirmedFrequency).toBeCloseTo(220, 6);
  });

  it("tolerates vibrato within ±35 cents", () => {
    const s = new NoteStabilizer();
    const st = feed(s, 0, 500, (t) => cents(220, 30 * Math.sin(t / 40)));
    expect(st.confirmed).toBe(true);
  });

  it("restarts when pitch jumps beyond tolerance", () => {
    const s = new NoteStabilizer();
    feed(s, 0, 300, () => 220);
    const st = feed(s, 316, 600, () => cents(220, 80));
    expect(st.confirmed).toBe(false); // new run only ~284ms old
    expect(feed(s, 616, 760, () => cents(220, 80)).confirmed).toBe(true);
  });

  it("bridges short dropouts but resets on long silence", () => {
    const s = new NoteStabilizer();
    feed(s, 0, 200, () => 220);
    s.update(216, null); // within 100ms grace
    expect(feed(s, 232, 420, () => 220).confirmed).toBe(true);

    const s2 = new NoteStabilizer();
    feed(s2, 0, 200, () => 220);
    const st = feed(s2, 216, 400, () => null);
    expect(st.progress).toBe(0);
    expect(st.frequency).toBeNull();
  });

  it("latches confirmation until reset", () => {
    const s = new NoteStabilizer();
    feed(s, 0, 450, () => 220);
    expect(s.update(500, null).confirmed).toBe(true);
    s.reset();
    expect(s.update(520, null).confirmed).toBe(false);
  });
});

describe("evaluateInterval", () => {
  const f = midiToFrequency;
  it("accepts an exact perfect 5th and tolerates ±50 cents", () => {
    expect(evaluateInterval(f(57), f(64), 7).correct).toBe(true);
    expect(evaluateInterval(f(57), cents(f(64), 40), 7)).toMatchObject({ correct: true });
    expect(evaluateInterval(f(57), cents(f(64), 60), 7).correct).toBe(false);
  });

  it("is octave-invariant (singer answers an octave lower/higher)", () => {
    expect(evaluateInterval(f(60), f(67 - 12), 7).correct).toBe(true);
    expect(evaluateInterval(f(60), f(67 + 12), 7).correct).toBe(true);
  });

  it("handles descending intervals and wrong answers", () => {
    expect(evaluateInterval(f(65), f(62), -3).correct).toBe(true);
    const wrong = evaluateInterval(f(60), f(65), 7);
    expect(wrong.correct).toBe(false);
    expect(wrong.errorCents).toBeCloseTo(-200, 6);
  });
});
