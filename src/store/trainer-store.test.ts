import { beforeEach, describe, expect, it } from "vitest";
import { midiToFrequency } from "@/lib/audio/music-math";
import { useTrainer } from "./trainer-store";

const s = () => useTrainer.getState();
const cents = (f: number, c: number) => f * 2 ** (c / 1200);

beforeEach(() => {
  useTrainer.setState({ ...s(), score: { correct: 0, total: 0, streak: 0 } });
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
    expect(s().score).toEqual({ correct: 1, total: 1, streak: 1 });
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
    expect(s().score).toEqual({ correct: 0, total: 1, streak: 0 });
    const root = s().rootMidi;
    s().replay();
    expect(s().phase).toBe("PLAYING_INTERVAL");
    expect(s().rootMidi).toBe(root);
  });

  it("random selection picks from the catalog and ignores stray confirmations", () => {
    s().setSelection("random");
    s().startChallenge(() => 0.999);
    expect(s().currentId).toBe("P8-asc");
    expect(s().confirmNote(220)).toBe("ignored"); // still PLAYING_INTERVAL
  });

  it("surprise mode asks the user to name the interval before scoring", () => {
    s().setSelection("random");
    s().startChallenge(() => 0); // m2-asc
    s().playbackFinished();
    s().confirmNote(220);
    s().confirmNote(midiToFrequency(57 + 1));
    expect(s().phase).toBe("IDENTIFY");
    expect(s().score.total).toBe(0);
    s().answer("M2");
    expect(s().phase).toBe("MISS");
    expect(s().score).toEqual({ correct: 0, total: 1, streak: 0 });

    s().startChallenge(() => 0);
    s().playbackFinished();
    s().confirmNote(220);
    s().confirmNote(midiToFrequency(57 + 1));
    s().answer("m2");
    expect(s().phase).toBe("SUCCESS");
    expect(s().score).toEqual({ correct: 1, total: 2, streak: 1 });
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
    s().answer("m2");
    expect(s().phase).toBe("PLAYING_INTERVAL");
  });
});
