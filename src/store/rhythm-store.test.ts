import { beforeEach, describe, expect, it } from "vitest";
import { createJSONStorage } from "zustand/middleware";
import { BPM_MAX, BPM_MIN, useRhythm } from "./rhythm-store";

const s = () => useRhythm.getState();

/** Deterministic but varied: a constant rng can pick a leading rest forever and `randomRhythm` would never return. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

beforeEach(() => {
  s().resetProgress();
  s().setSubdivision("ternary");
  s().setSubdivision("binary"); // drops any exercise in progress
  s().setBpm(80);
});

/** Fills every beat with the right cells. */
function solve() {
  for (const id of s().target!) s().pick(id);
}

describe("rhythm exercise", () => {
  it("scores a right answer and a streak", () => {
    s().newRhythm(seeded(1));
    solve();
    s().check();
    expect(s().checked).toBe(true);
    expect(s().stats).toEqual({ correct: 1, total: 1, streak: 1 });
  });

  it("does not check an incomplete answer, nor twice", () => {
    s().newRhythm(seeded(1));
    s().pick(s().target![0]);
    s().check();
    expect(s().stats.total).toBe(0);
    solve();
    s().check();
    s().check();
    expect(s().stats.total).toBe(1);
  });

  it("giving up counts as a miss, breaks the streak and draws another rhythm", () => {
    s().newRhythm(seeded(1));
    solve();
    s().check();
    const next = s().giveUp(seeded(2));
    expect(next).toEqual(s().target);
    expect(s().stats).toEqual({ correct: 1, total: 2, streak: 0 });
    expect(s().checked).toBe(false);
  });

  it("giving up with no rhythm does nothing", () => {
    expect(s().giveUp()).toBeNull();
    expect(s().stats.total).toBe(0);
  });

  it("changing the subdivision drops the exercise in progress", () => {
    s().newRhythm(seeded(1));
    s().setSubdivision("ternary");
    expect(s().target).toBeNull();
    expect(s().answer.every((a) => a === null)).toBe(true);
  });

  it("keeps the tempo inside its range", () => {
    s().setBpm(1000);
    expect(s().bpm).toBe(BPM_MAX);
    s().setBpm(-5);
    expect(s().bpm).toBe(BPM_MIN);
  });
});

describe("persistence", () => {
  it("saves settings and stats, not the exercise", () => {
    s().newRhythm(seeded(1));
    const saved = useRhythm.persist.getOptions().partialize!(s());
    expect(Object.keys(saved as object).sort()).toEqual(["bpm", "includeRests", "metronome", "stats", "subdivision"]);
  });

  it("restores saved data and ignores malformed fields", async () => {
    const mem = new Map<string, string>();
    useRhythm.persist.setOptions({
      storage: createJSONStorage(() => ({
        getItem: (k) => mem.get(k) ?? null,
        setItem: (k, v) => void mem.set(k, v),
        removeItem: (k) => void mem.delete(k),
      })),
    });
    mem.set(
      "burpears:rhythm",
      JSON.stringify({
        version: 1,
        state: { bpm: 9999, subdivision: "ternary", includeRests: "yes", metronome: false, stats: { correct: 3, total: 4, streak: 2 } },
      }),
    );
    await useRhythm.persist.rehydrate();
    expect(s().bpm).toBe(BPM_MAX); // clamped
    expect(s().subdivision).toBe("ternary");
    expect(s().includeRests).toBe(true); // invalid, default kept
    expect(s().metronome).toBe(false);
    expect(s().stats).toEqual({ correct: 3, total: 4, streak: 2 });
  });
});
