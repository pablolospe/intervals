import { describe, expect, it } from "vitest";
import { initialContext, parseCommand } from "./parser";
import { initialEditor, submitText } from "./editor";
import { eventBeats, pitchToMidi, type ScoreEvent } from "./types";

const events = (text: string) =>
  parseCommand(text, initialContext()).actions.flatMap((a) => (a.type === "append" ? [a.event] : []));

describe("parseCommand", () => {
  it("parses the headline example: triplet of quarter notes", () => {
    const r = parseCommand("ahora quiero un tresillo de negras: do mi sol", initialContext());
    expect(r.errors).toEqual([]);
    const [t] = events("ahora quiero un tresillo de negras: do mi sol") as [ScoreEvent];
    expect(t.kind).toBe("tuplet");
    if (t.kind !== "tuplet") return;
    expect([t.actual, t.normal]).toEqual([3, 2]);
    expect(t.items.map((n) => n.kind === "note" && pitchToMidi(n.pitch))).toEqual([60, 64, 67]);
    expect(eventBeats(t)).toBeCloseTo(2); // 3 quarters in the time of 2
  });

  it("keeps duration until changed and picks the closest octave", () => {
    const ev = events("corchea sol do re");
    expect(ev.map((e) => e.kind === "note" && pitchToMidi(e.pitch))).toEqual([67, 72, 74]);
    expect(ev.every((e) => e.kind === "note" && e.duration === "8")).toBe(true);
  });

  it("handles accidentals, explicit octave and accents", () => {
    const ev = events("octava 5 fa sostenido, si bemol");
    expect(ev.map((e) => e.kind === "note" && pitchToMidi(e.pitch))).toEqual([78, 82]);
    expect(events("Dó Mí")).toHaveLength(2);
  });

  it("parses rests, with or without a duration", () => {
    expect(events("silencio de blanca")[0]).toEqual({ kind: "rest", duration: "h" });
  });

  it("reports incomplete tuplets and unknown words", () => {
    const r = parseCommand("tresillo do mi", initialContext());
    expect(r.actions).toHaveLength(0);
    expect(r.errors[0]).toMatch(/faltan 1/);
    expect(parseCommand("do banana", initialContext()).errors[0]).toMatch(/banana/);
  });
});

describe("submitText / undo", () => {
  it("appends, undoes and clears", () => {
    let s = initialEditor();
    s = submitText(s, "do re mi").state;
    s = submitText(s, "fa").state;
    expect(s.score.events).toHaveLength(4);
    s = submitText(s, "deshacer").state;
    expect(s.score.events).toHaveLength(3);
    s = submitText(s, "borrar todo").state;
    expect(s.score.events).toHaveLength(0);
  });
});

describe("measures", () => {
  it("parses absolute and relative measure counts", () => {
    const abs = parseCommand("ocho compases", initialContext());
    expect(abs.actions).toEqual([{ type: "setMeasures", count: 8, relative: false }]);
    const rel = parseCommand("agregá 2 compases", initialContext());
    expect(rel.actions).toEqual([{ type: "setMeasures", count: 2, relative: true }]);
    expect(parseCommand("agrega un compas", initialContext()).actions).toEqual([{ type: "setMeasures", count: 1, relative: true }]);
  });
});

describe("speech-recognizer style input", () => {
  it("tolerates punctuation, hyphens and capitalization typical of transcripts", () => {
    const ev = events("Tresillo de negras: Do-mi-sol.");
    expect(ev).toHaveLength(1);
    expect(events("Do, re, mi.")).toHaveLength(3);
  });
});
