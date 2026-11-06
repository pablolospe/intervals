import { describe, expect, it } from "vitest";
import * as ed from "./edit";
import { applyEdit, initialEditor, setMeasureCount, submitText } from "./editor";
import { pitchToMidi, type NoteEvent } from "./types";

const note = (s: ReturnType<typeof initialEditor>, e: number, i: number | null = null) => {
  const l = ed.getLeaf(s.score, { e, i });
  return l as NoteEvent;
};

describe("measure limit", () => {
  it("starts with 4 measures and refuses to overflow atomically", () => {
    let s = initialEditor();
    expect(s.score.measures).toBe(4);
    s = submitText(s, "redonda do re mi fa").state; // exactly 4 measures
    expect(s.score.events).toHaveLength(4);
    const r = submitText(s, "redonda sol");
    expect(r.errors[0]).toMatch(/4 compases/);
    expect(r.state.score.events).toHaveLength(4);
    const grown = submitText(s, "agregá 1 compas redonda sol").state;
    expect(grown.score.measures).toBe(5);
    expect(grown.score.events).toHaveLength(5);
  });

  it("cannot shrink below the used measures, and keeps count on clear", () => {
    let s = submitText(initialEditor(), "redonda do re").state;
    const r = setMeasureCount(s, 1);
    expect(r.state.score.measures).toBe(2);
    expect(r.error).toMatch(/2 compases/);
    s = submitText(setMeasureCount(s, 8).state, "borrar todo").state;
    expect(s.score.measures).toBe(8);
  });
});

describe("manual edits", () => {
  it("transposes diatonically, crosses octaves, and cycles accidentals", () => {
    let s = submitText(initialEditor(), "do").state; // C4
    const sel = { e: 0, i: null };
    s = applyEdit(s, ed.transpose(s.score, sel, -1)).state; // B3
    expect(pitchToMidi(note(s, 0).pitch)).toBe(59);
    s = applyEdit(s, ed.transpose(s.score, sel, 8)).state; // C5
    expect(pitchToMidi(note(s, 0).pitch)).toBe(72);
    s = applyEdit(s, ed.cycleAccidental(s.score, sel)).state;
    expect(note(s, 0).pitch.accidental).toBe("#");
  });

  it("rejects a duration change that overflows the score", () => {
    let s = submitText(initialEditor(), "negra do re mi fa").state; // fills 1 measure
    s = setMeasureCount(s, 1).state;
    expect(s.score.measures).toBe(1);
    const r = applyEdit(s, ed.setDuration(s.score, { e: 0, i: null }, "w"));
    expect(r.error).toMatch(/1 compases/);
    expect(r.state).toBe(s);
  });

  it("deleting inside a tuplet leaves a rest; top-level delete shifts left; edits are undoable", () => {
    let s = submitText(initialEditor(), "tresillo de negras do mi sol fa").state;
    const inTuplet = ed.deleteLeaf(s.score, { e: 0, i: 1 });
    expect(ed.getLeaf(inTuplet.score, { e: 0, i: 1 })?.kind).toBe("rest");
    const top = ed.deleteLeaf(s.score, { e: 1, i: null });
    expect(top.score.events).toHaveLength(1);
    s = applyEdit(s, top.score).state;
    s = submitText(s, "deshacer").state;
    expect(s.score.events).toHaveLength(2);
  });
});
