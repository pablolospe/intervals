import { beforeEach, describe, expect, it } from "vitest";
import { createJSONStorage } from "zustand/middleware";
import { cellsFor, hasRest } from "@/lib/rhythm/cells";
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
  s().selectCells(cellsFor("binary").map((c) => c.id));
  s().setSubdivision("ternary");
  s().selectCells(cellsFor("ternary").map((c) => c.id));
  s().setSubdivision("binary");
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
    expect(Object.keys(saved as object).sort()).toEqual(["bpm", "disabledCells", "metronome", "stats", "subdivision"]);
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
        version: 2,
        state: { bpm: 9999, subdivision: "ternary", disabledCells: { binary: ["q", "bogus", 7], ternary: "nope" }, metronome: false, stats: { correct: 3, total: 4, streak: 2 } },
      }),
    );
    await useRhythm.persist.rehydrate();
    expect(s().bpm).toBe(BPM_MAX); // clamped
    expect(s().subdivision).toBe("ternary");
    expect(s().disabledCells).toEqual({ binary: ["q"], ternary: [] }); // unknown ids and bad shapes dropped
    expect(s().metronome).toBe(false);
    expect(s().stats).toEqual({ correct: 3, total: 4, streak: 2 });
  });

  it("migrates the old 'Silencios' switch to disabled rest cells", async () => {
    const mem = new Map<string, string>();
    useRhythm.persist.setOptions({
      storage: createJSONStorage(() => ({
        getItem: (k) => mem.get(k) ?? null,
        setItem: (k, v) => void mem.set(k, v),
        removeItem: (k) => void mem.delete(k),
      })),
    });
    mem.set("burpears:rhythm", JSON.stringify({ version: 1, state: { bpm: 90, includeRests: false } }));
    await useRhythm.persist.rehydrate();
    expect(s().bpm).toBe(90);
    for (const sub of ["binary", "ternary"] as const) {
      const rests = cellsFor(sub).filter(hasRest).map((c) => c.id);
      expect([...s().disabledCells[sub]].sort()).toEqual([...rests].sort());
    }
  });
});

describe("cell selection", () => {
  it("turns cells off and on", () => {
    expect(s().setCellsEnabled(["q"], false)).toBe(true);
    expect(s().disabledCells.binary).toEqual(["q"]);
    expect(s().setCellsEnabled(["q"], true)).toBe(true);
    expect(s().disabledCells.binary).toEqual([]);
  });

  it("keeps each meter's selection apart", () => {
    s().setCellsEnabled(["q"], false);
    s().setSubdivision("ternary");
    expect(s().disabledCells.ternary).toEqual([]);
    expect(s().disabledCells.binary).toEqual(["q"]);
  });

  it("refuses a selection too small to dictate", () => {
    const [a, b, ...others] = cellsFor("binary").map((c) => c.id);
    expect(s().setCellsEnabled(others, false)).toBe(true); // two left
    expect(s().setCellsEnabled([a], false)).toBe(false);
    expect(s().disabledCells.binary).toEqual(others);
    expect(s().selectCells([a])).toBe(false);
    expect(s().selectCells([a, b])).toBe(true);
  });

  it("ignores ids from the other meter", () => {
    expect(s().setCellsEnabled(["qd"], false)).toBe(true);
    expect(s().disabledCells.binary).toEqual([]);
  });

  it("draws only enabled cells", () => {
    s().selectCells(["q", "8-8"]);
    for (let k = 1; k <= 20; k++) expect(s().newRhythm(seeded(k)).every((id) => id === "q" || id === "8-8")).toBe(true);
  });

  it("drops a rhythm in progress that uses a cell that was just turned off", () => {
    const target = s().newRhythm(seeded(1));
    s().setCellsEnabled([target[0]], false);
    expect(s().target).toBeNull();
    expect(s().stats.total).toBe(0);
  });

  it("keeps a rhythm in progress that does not use the cell", () => {
    const target = s().newRhythm(seeded(1));
    const unused = cellsFor("binary").find((c) => !target.includes(c.id))!;
    s().setCellsEnabled([unused.id], false);
    expect(s().target).toEqual(target);
  });
});
