import type { Accidental, DurationCode, NoteEvent, RestEvent, Score, ScoreEvent, Step, TupletEvent } from "./types";

/** Pure manual-editing operations. A selection points at one note/rest ("leaf"). */
export interface Selection {
  e: number; // index in score.events
  i: number | null; // index inside a tuplet, or null for a top-level note/rest
}

type Leaf = NoteEvent | RestEvent;

const STEPS: Step[] = ["c", "d", "e", "f", "g", "a", "b"];

export function getLeaf(score: Score, sel: Selection): Leaf | null {
  const ev = score.events[sel.e];
  if (!ev) return null;
  if (ev.kind === "tuplet") return sel.i === null ? null : (ev.items[sel.i] ?? null);
  return sel.i === null ? ev : null;
}

/** All selectable leaves in reading order. */
export function leafSelections(score: Score): Selection[] {
  return score.events.flatMap((ev, e): Selection[] =>
    ev.kind === "tuplet" ? ev.items.map((_, i) => ({ e, i })) : [{ e, i: null }],
  );
}

export const sameSelection = (a: Selection | null, b: Selection | null) => !!a && !!b && a.e === b.e && a.i === b.i;

function replaceLeaf(score: Score, sel: Selection, leaf: Leaf): Score {
  const events = score.events.map((ev, idx): ScoreEvent => {
    if (idx !== sel.e) return ev;
    if (ev.kind === "tuplet") {
      const t: TupletEvent = { ...ev, items: ev.items.map((it, j) => (j === sel.i ? leaf : it)) };
      return t;
    }
    return leaf;
  });
  return { ...score, events };
}

/** Move a note by diatonic steps (±1 = next line/space, ±7 = octave). Rests are unchanged. */
export function transpose(score: Score, sel: Selection, steps: number): Score {
  const leaf = getLeaf(score, sel);
  if (!leaf || leaf.kind !== "note") return score;
  const index = leaf.pitch.octave * 7 + STEPS.indexOf(leaf.pitch.step) + steps;
  const octave = Math.floor(index / 7);
  if (octave < 0 || octave > 8) return score;
  return replaceLeaf(score, sel, { ...leaf, pitch: { ...leaf.pitch, step: STEPS[((index % 7) + 7) % 7], octave } });
}

const NEXT_ACCIDENTAL: Record<Accidental, Accidental> = { "": "#", "#": "b", b: "" };

export function cycleAccidental(score: Score, sel: Selection): Score {
  const leaf = getLeaf(score, sel);
  if (!leaf || leaf.kind !== "note") return score;
  return replaceLeaf(score, sel, { ...leaf, pitch: { ...leaf.pitch, accidental: NEXT_ACCIDENTAL[leaf.pitch.accidental] } });
}

export function setDuration(score: Score, sel: Selection, duration: DurationCode): Score {
  const leaf = getLeaf(score, sel);
  return leaf ? replaceLeaf(score, sel, { ...leaf, duration }) : score;
}

export function toRest(score: Score, sel: Selection): Score {
  const leaf = getLeaf(score, sel);
  return leaf && leaf.kind === "note" ? replaceLeaf(score, sel, { kind: "rest", duration: leaf.duration }) : score;
}

/**
 * Delete a note. Inside a tuplet it becomes a rest (removing it would break the n:m grouping);
 * a top-level note/rest is removed and later events shift left.
 */
export function deleteLeaf(score: Score, sel: Selection): { score: Score; selection: Selection | null } {
  if (sel.i !== null) {
    const next = toRest(score, sel);
    return { score: next, selection: sel };
  }
  const events = score.events.filter((_, idx) => idx !== sel.e);
  const next = { ...score, events };
  const stay = leafSelections(next).find((s) => s.e === Math.min(sel.e, events.length - 1) && (s.i === null || s.i === 0));
  return { score: next, selection: stay ?? null };
}
