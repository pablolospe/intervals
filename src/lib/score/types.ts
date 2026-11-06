/** Score model: a flat list of events; barlines are derived from beat totals at render time. */

export type DurationCode = "w" | "h" | "q" | "8" | "16";
export type Step = "c" | "d" | "e" | "f" | "g" | "a" | "b";
export type Accidental = "" | "#" | "b";

/** Length in quarter-note beats of each base duration. */
export const DURATION_BEATS: Record<DurationCode, number> = { w: 4, h: 2, q: 1, "8": 0.5, "16": 0.25 };

export interface Pitch {
  step: Step;
  accidental: Accidental;
  octave: number;
}

export interface NoteEvent {
  kind: "note";
  pitch: Pitch;
  duration: DurationCode;
}

export interface RestEvent {
  kind: "rest";
  duration: DurationCode;
}

/** `actual` notes played in the time of `normal` (triplet = 3:2). */
export interface TupletEvent {
  kind: "tuplet";
  actual: number;
  normal: number;
  items: (NoteEvent | RestEvent)[];
}

export type ScoreEvent = NoteEvent | RestEvent | TupletEvent;

export const DEFAULT_MEASURES = 4;
export const MAX_MEASURES = 32;

export interface Score {
  beatsPerMeasure: number; // quarter-note beats (4/4 => 4)
  /** Total measures available; dictation/editing cannot overflow this. */
  measures: number;
  events: ScoreEvent[];
}

export const emptyScore = (measures = DEFAULT_MEASURES): Score => ({ beatsPerMeasure: 4, measures, events: [] });

export function eventBeats(e: ScoreEvent): number {
  if (e.kind !== "tuplet") return DURATION_BEATS[e.duration];
  const inner = e.items.reduce((sum, i) => sum + DURATION_BEATS[i.duration], 0);
  return (inner * e.normal) / e.actual;
}

/** Pitch to MIDI number (C4 = 60). */
export function pitchToMidi(p: Pitch): number {
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[p.step];
  const alt = p.accidental === "#" ? 1 : p.accidental === "b" ? -1 : 0;
  return (p.octave + 1) * 12 + base + alt;
}
