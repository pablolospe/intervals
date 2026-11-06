import { describe, expect, it } from "vitest";
import { centsOff, midiToFrequency, semitonesBetween } from "./music-math";
import { detectPitch } from "./pitch-detector";

const SR = 44100;
const N = 4096;

function sine(freq: number, amp = 0.5): Float32Array {
  const b = new Float32Array(N);
  for (let i = 0; i < N; i++) b[i] = amp * Math.sin((2 * Math.PI * freq * i) / SR);
  return b;
}

/** Voice-like signal: fundamental plus decaying harmonics (and a weak f0 case). */
function harmonic(freq: number, gains = [1, 0.6, 0.4, 0.25, 0.15]): Float32Array {
  const b = new Float32Array(N);
  gains.forEach((g, k) => {
    for (let i = 0; i < N; i++) b[i] += 0.2 * g * Math.sin((2 * Math.PI * freq * (k + 1) * i) / SR);
  });
  return b;
}

describe("detectPitch (MPM)", () => {
  it.each([82.41, 110, 261.63, 440, 880])("detects a %f Hz sine within 1 cent", (f) => {
    const res = detectPitch(sine(f), SR);
    expect(res).not.toBeNull();
    expect(Math.abs(centsOff(res!.frequency, f))).toBeLessThan(1);
  });

  it("ignores harmonics and reports the fundamental", () => {
    const res = detectPitch(harmonic(196), SR);
    expect(res).not.toBeNull();
    expect(Math.abs(centsOff(res!.frequency, 196))).toBeLessThan(1);
  });

  it("finds the fundamental when f0 is weaker than its 2nd harmonic", () => {
    const res = detectPitch(harmonic(165, [0.4, 1, 0.5, 0.3]), SR);
    expect(res).not.toBeNull();
    expect(Math.abs(centsOff(res!.frequency, 165))).toBeLessThan(2);
  });

  it("rejects silence and very quiet noise via the RMS gate", () => {
    expect(detectPitch(new Float32Array(N), SR)).toBeNull();
    expect(detectPitch(sine(440, 0.001), SR)).toBeNull();
  });

  it("returns null for white noise", () => {
    let seed = 1;
    const noise = new Float32Array(N).map(() => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647 - 0.5) * 0.6;
    });
    expect(detectPitch(noise, SR)).toBeNull();
  });

  it("measures sung intervals with sub-cent accuracy", () => {
    const cases: [number, number][] = [
      [60, 67], // perfect 5th up
      [65, 62], // minor 3rd down (Hey Jude)
      [60, 66], // tritone
      [60, 72], // octave
    ];
    for (const [m1, m2] of cases) {
      const f1 = detectPitch(sine(midiToFrequency(m1)), SR)!.frequency;
      const f2 = detectPitch(sine(midiToFrequency(m2)), SR)!.frequency;
      expect(Math.abs(semitonesBetween(f1, f2) - (m2 - m1))).toBeLessThan(0.01);
    }
  });
});
