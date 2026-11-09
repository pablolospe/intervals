import { describe, expect, it } from "vitest";
import { getInterval, INTERVALS, intervalNotes, motifNotes, pickRoot, signedSemitones } from "./intervals-catalog";

describe("catalog", () => {
  it("has every interval in both directions, with unique ids and valid data", () => {
    expect(INTERVALS).toHaveLength(24);
    expect(new Set(INTERVALS.map((i) => i.id)).size).toBe(INTERVALS.length);
    expect(getInterval("P5-desc")).toMatchObject({ base: "P5", direction: "desc", semitones: 7 });
    for (const i of INTERVALS) {
      expect(i.song.motif[0].offset).toBe(0);
      expect(i.songs.length).toBeGreaterThanOrEqual(2);
      expect(i.semitones).toBeGreaterThan(0);
    }
  });

  it("every song opens with its interval (after any repeated root notes)", () => {
    for (const i of INTERVALS) expect(i.song.motif.find((m) => m.offset !== 0)?.offset).toBe(signedSemitones(i));
  });

  it("the motif contains the interval jump for every entry", () => {
    for (const i of INTERVALS) {
      const jumps = i.song.motif.slice(1).map((m, k) => m.offset - i.song.motif[k].offset);
      expect(jumps).toContain(signedSemitones(i));
    }
  });

  it("builds interval and transposed motif notes", () => {
    const d = getInterval("m3-desc");
    expect(intervalNotes(d, 65).map((n) => n.midi)).toEqual([65, 62]);
    expect(motifNotes(d, 70).map((n) => n.midi)).toEqual([70, 67, 67, 69, 70, 72]);
    expect(() => getInterval("nope")).toThrow();
  });

  it("pickRoot keeps both notes inside the comfortable range", () => {
    for (const i of INTERVALS) {
      for (const r of [0, 0.5, 0.999]) {
        const root = pickRoot(i, () => r);
        const t = root + signedSemitones(i);
        expect(Math.min(root, t)).toBeGreaterThanOrEqual(45);
        expect(Math.max(root, t)).toBeLessThanOrEqual(69);
      }
    }
  });
});
