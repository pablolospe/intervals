import { describe, expect, it } from "vitest";
import { CELLS, cellPool, grade, hasRest, planRhythm, randomRhythm, vexDuration } from "./cells";

describe("rhythm cells", () => {
  it("every cell fills exactly one beat and ids are unique", () => {
    for (const c of CELLS) expect(c.slots.reduce((s, x) => s + x.units, 0)).toBe(4);
    expect(new Set(CELLS.map((c) => c.id)).size).toBe(CELLS.length);
  });

  it("pool without rests excludes rest cells", () => {
    expect(cellPool(false).some(hasRest)).toBe(false);
    expect(cellPool(false)).toHaveLength(6);
    expect(cellPool(true)).toHaveLength(CELLS.length);
  });

  it("random rhythm has 4 beats, at most one full rest, never on beat 1", () => {
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let k = 0; k < 500; k++) {
      const ids = randomRhythm(cellPool(true), 4, rng);
      expect(ids).toHaveLength(4);
      expect(ids[0]).not.toBe("qr");
      expect(ids.filter((i) => i === "qr").length).toBeLessThanOrEqual(1);
    }
  });

  it("plans onsets in seconds, skipping rests", () => {
    // 60 bpm -> sixteenth = 0.25s
    const hits = planRhythm(["8-16-16", "8r-8"], 60, 1);
    expect(hits.map((h) => h.start)).toEqual([0, 0.5, 0.75, 1.5]);
    expect(hits.map((h) => h.duration)).toEqual([0.5, 0.25, 0.25, 0.5]);
  });

  it("grades beat by beat", () => {
    expect(grade(["q", "8-8", null, "qr"], ["q", "16x4", "q", "qr"])).toEqual([true, false, false, true]);
  });

  it("maps slots to vexflow durations", () => {
    expect(vexDuration({ units: 2, rest: true })).toBe("8r");
    expect(vexDuration({ units: 1, rest: false })).toBe("16");
  });
});
