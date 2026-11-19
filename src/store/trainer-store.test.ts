import { beforeEach, describe, expect, it } from "vitest";
import { createJSONStorage } from "zustand/middleware";
import { midiToFrequency } from "@/lib/audio/music-math";
import { useTrainer } from "./trainer-store";

const s = () => useTrainer.getState();
const cents = (f: number, c: number) => f * 2 ** (c / 1200);

beforeEach(() => {
  s().resetProgress();
  s().setDirection("asc");
  s().setSelection("P5");
});

describe("trainer state machine", () => {
  it("walks IDLE -> PLAYING -> ROOT -> TARGET -> SUCCESS", () => {
    expect(s().phase).toBe("IDLE");
    s().startChallenge(() => 0);
    expect(s().phase).toBe("PLAYING_INTERVAL");
    expect(s().rootMidi).toBe(45);
    s().playbackFinished();
    expect(s().phase).toBe("SINGING_ROOT");
    expect(s().confirmNote(midiToFrequency(57))).toBe("root");
    expect(s().phase).toBe("SINGING_TARGET");
    expect(s().confirmNote(midiToFrequency(64))).toBe("target");
    expect(s().phase).toBe("SUCCESS");
    expect(s().scores.sing).toEqual({ correct: 1, total: 1, streak: 1 });
  });

  it("ignores the target while the singer still holds the root", () => {
    s().startChallenge(() => 0);
    s().playbackFinished();
    s().confirmNote(220);
    expect(s().confirmNote(cents(220, 10))).toBe("ignored");
    expect(s().phase).toBe("SINGING_TARGET");
  });

  it("records a miss and resets the streak; replay keeps the same root", () => {
    s().startChallenge(() => 0);
    s().playbackFinished();
    s().confirmNote(220);
    s().confirmNote(midiToFrequency(57 + 5)); // sang a 4th instead of a 5th
    expect(s().phase).toBe("MISS");
    expect(s().scores.sing).toEqual({ correct: 0, total: 1, streak: 0 });
    const root = s().rootMidi;
    s().replay();
    expect(s().phase).toBe("PLAYING_INTERVAL");
    expect(s().rootMidi).toBe(root);
  });

  it("random selection picks from the catalog and ignores stray confirmations", () => {
    s().setSelection("random");
    s().startChallenge(() => 0.999);
    expect(s().currentId).toBe("P8-desc"); // direction is random too
    expect(s().confirmNote(220)).toBe("ignored"); // still PLAYING_INTERVAL
  });

  it("surprise mode asks the user to name the interval before scoring", () => {
    s().setSelection("random");
    s().startChallenge(() => 0); // m2-asc (0 picks the first interval and "asc")
    s().playbackFinished();
    s().confirmNote(220);
    s().confirmNote(midiToFrequency(57 + 1));
    expect(s().phase).toBe("IDENTIFY");
    expect(s().scores.recognize.total).toBe(0);
    s().answer("M2", "asc");
    expect(s().phase).toBe("MISS");
    expect(s().scores.recognize).toEqual({ correct: 0, total: 1, streak: 0 });

    s().startChallenge(() => 0);
    s().playbackFinished();
    s().confirmNote(220);
    s().confirmNote(midiToFrequency(57 + 1));
    s().answer("m2", "desc"); // right interval, wrong direction
    expect(s().phase).toBe("MISS");

    s().startChallenge(() => 0);
    s().playbackFinished();
    s().confirmNote(220);
    s().confirmNote(midiToFrequency(57 + 1));
    s().answer("m2", "asc");
    expect(s().phase).toBe("SUCCESS");
    expect(s().scores.recognize).toEqual({ correct: 1, total: 3, streak: 1 });
  });

  it("descending mode builds descending challenges", () => {
    s().setDirection("desc");
    s().startChallenge(() => 0);
    expect(s().currentId).toBe("P5-desc");
    expect(s().rootMidi).toBe(52); // lowest root that keeps the 5th below inside A2..A4
    s().playbackFinished();
    s().confirmNote(midiToFrequency(57));
    s().confirmNote(midiToFrequency(50));
    expect(s().phase).toBe("SUCCESS");
  });

  it("changing direction resets the current challenge", () => {
    s().startChallenge(() => 0);
    s().setDirection("desc");
    expect(s().phase).toBe("IDLE");
    expect(s().currentId).toBeNull();
  });

  it("ignores answers outside the IDENTIFY phase", () => {
    s().setSelection("random");
    s().startChallenge(() => 0);
    s().answer("m2", "asc");
    expect(s().phase).toBe("PLAYING_INTERVAL");
  });
});

describe("progress", () => {
  const sing = (hz2: number) => {
    s().startChallenge(() => 0);
    s().playbackFinished();
    s().confirmNote(220);
    s().confirmNote(hz2);
  };

  it("keeps a separate score for each game", () => {
    sing(midiToFrequency(64)); // P5 right
    s().setMode("recognize");
    expect(s().selection).toBe("random");
    s().startChallenge(() => 0);
    s().playbackFinished();
    s().confirmNote(220);
    s().confirmNote(midiToFrequency(58));
    s().answer("m2", "asc");
    expect(s().scores.sing).toEqual({ correct: 1, total: 1, streak: 1 });
    expect(s().scores.recognize).toEqual({ correct: 1, total: 1, streak: 1 });
  });

  it("remembers the chosen interval when coming back from surprise mode", () => {
    s().setMode("sing");
    s().setSelection("M3");
    s().setMode("recognize");
    expect(s().selection).toBe("random");
    s().setMode("sing");
    expect(s().selection).toBe("M3");
  });

  it("tallies right and total per directed interval across both games", () => {
    sing(midiToFrequency(64)); // P5-asc right
    sing(midiToFrequency(62)); // P5-asc wrong
    expect(s().byInterval["P5-asc"]).toEqual({ correct: 1, total: 2 });
  });

  it("resetProgress wipes scores and tallies but not the settings", () => {
    s().setSelection("M3");
    sing(midiToFrequency(64));
    s().resetProgress();
    expect(s().scores.sing.total).toBe(0);
    expect(s().byInterval).toEqual({});
    expect(s().singSelection).toBe("M3");
  });
});

describe("persistence", () => {
  const options = () => useTrainer.persist.getOptions();
  const mem = new Map<string, string>();
  beforeEach(() => {
    mem.clear();
    useTrainer.persist.setOptions({
      storage: createJSONStorage(() => ({
        getItem: (k) => mem.get(k) ?? null,
        setItem: (k, v) => void mem.set(k, v),
        removeItem: (k) => void mem.delete(k),
      })),
    });
  });

  it("saves progress and settings, never the challenge in progress", () => {
    s().startChallenge(() => 0);
    const saved = options().partialize!(s());
    expect(Object.keys(saved as object).sort()).toEqual(["byInterval", "direction", "lang", "scores", "singSelection"]);
  });

  it("restores saved progress and ignores malformed data", async () => {
    const good = { recognize: { correct: 2, total: 3, streak: 1 }, sing: { correct: 0, total: 0, streak: 0 } };
    mem.set(
      "burpears:trainer",
      JSON.stringify({
        version: 1,
        state: {
          lang: "klingon", // invalid: ignored
          direction: "desc",
          singSelection: "M3",
          scores: good,
          byInterval: { "M3-asc": { correct: 1, total: 2 }, "nope-asc": { correct: 1, total: 1 }, "P5-asc": { correct: 5, total: 2 } },
        },
      }),
    );
    await useTrainer.persist.rehydrate();
    expect(s().lang).toBe("es");
    expect(s().direction).toBe("desc");
    expect(s().singSelection).toBe("M3");
    expect(s().scores).toEqual(good);
    expect(s().byInterval).toEqual({ "M3-asc": { correct: 1, total: 2 } }); // unknown id and impossible tally dropped
    expect(s().phase).toBe("IDLE");
  });

  it("applies the saved interval to a page that mounted before hydration", async () => {
    s().setMode("sing"); // default P5, as the mount effect does
    mem.set("burpears:trainer", JSON.stringify({ version: 1, state: { singSelection: "M3" } }));
    await useTrainer.persist.rehydrate();
    expect(s().selection).toBe("M3");
  });
});
