import { describe, expect, it } from "vitest";
import {
  centsOff,
  frequencyToMidi,
  frequencyToNote,
  midiToFrequency,
  midiToName,
  normalizeToOctave,
  pitchClassInterval,
  semitonesBetween,
} from "./music-math";

describe("music-math", () => {
  it("converts A4 and C4", () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 10);
    expect(midiToFrequency(69)).toBeCloseTo(440, 10);
    expect(midiToFrequency(60)).toBeCloseTo(261.6256, 3);
  });

  it("roundtrips midi <-> Hz", () => {
    for (let m = 24; m <= 96; m++) expect(frequencyToMidi(midiToFrequency(m))).toBeCloseTo(m, 9);
  });

  it("names notes with scientific pitch notation", () => {
    expect(frequencyToNote(440)).toMatchObject({ name: "A", octave: 4, midi: 69 });
    expect(frequencyToNote(261.6256)).toMatchObject({ name: "C", octave: 4 });
    expect(midiToName(64)).toBe("E4");
  });

  it("measures cents deviation", () => {
    expect(centsOff(440 * 2 ** (25 / 1200), 440)).toBeCloseTo(25, 6);
    expect(frequencyToNote(440 * 2 ** (-30 / 1200)).cents).toBeCloseTo(-30, 6);
  });

  it("computes semitones between frequencies", () => {
    expect(semitonesBetween(261.6256, 392)).toBeCloseTo(7, 2);
    expect(semitonesBetween(440, 220)).toBeCloseTo(-12, 10);
    expect(() => semitonesBetween(0, 440)).toThrow();
  });

  it("folds intervals by pitch class and octave", () => {
    expect(pitchClassInterval(60, 67)).toBe(7);
    expect(pitchClassInterval(67, 60)).toBe(5);
    expect(normalizeToOctave(19.1, 7)).toBeCloseTo(7.1, 10);
    expect(normalizeToOctave(-5.2, 7)).toBeCloseTo(6.8, 10);
  });
});
