/** Rhythmic cells that each fill exactly one quarter-note beat, measured in sixteenths. */

export interface Slot {
  units: 1 | 2 | 4; // sixteenths
  rest: boolean;
}

export interface RhythmCell {
  id: string;
  label: string;
  slots: Slot[];
}

const n = (units: Slot["units"]): Slot => ({ units, rest: false });
const r = (units: Slot["units"]): Slot => ({ units, rest: true });

export const CELLS: RhythmCell[] = [
  { id: "q", label: "Negra", slots: [n(4)] },
  { id: "8-8", label: "2 corcheas", slots: [n(2), n(2)] },
  { id: "16x4", label: "4 semicorcheas", slots: [n(1), n(1), n(1), n(1)] },
  { id: "8-16-16", label: "Corchea + 2 semis", slots: [n(2), n(1), n(1)] },
  { id: "16-16-8", label: "2 semis + corchea", slots: [n(1), n(1), n(2)] },
  { id: "16-8-16", label: "Semi + corchea + semi", slots: [n(1), n(2), n(1)] },
  // with rests
  { id: "qr", label: "Silencio de negra", slots: [r(4)] },
  { id: "8r-8", label: "Silencio + corchea", slots: [r(2), n(2)] },
  { id: "8-8r", label: "Corchea + silencio", slots: [n(2), r(2)] },
  { id: "8r-16-16", label: "Silencio + 2 semis", slots: [r(2), n(1), n(1)] },
  { id: "16r-16-8", label: "Silencio de semi + semi + corchea", slots: [r(1), n(1), n(2)] },
  { id: "16r-16-16-16", label: "Silencio de semi + 3 semis", slots: [r(1), n(1), n(1), n(1)] },
];

const BY_ID = new Map(CELLS.map((c) => [c.id, c]));

export function getCell(id: string): RhythmCell {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Unknown rhythm cell: ${id}`);
  return c;
}

export const hasRest = (c: RhythmCell) => c.slots.some((s) => s.rest);

export function cellPool(includeRests: boolean): RhythmCell[] {
  return includeRests ? CELLS : CELLS.filter((c) => !hasRest(c));
}

/** Random measure of `beats` cells. Never more than one whole-beat rest, and never starting with one. */
export function randomRhythm(pool: RhythmCell[], beats = 4, rng: () => number = Math.random): string[] {
  for (;;) {
    const ids = Array.from({ length: beats }, () => pool[Math.floor(rng() * pool.length)].id);
    const fullRests = ids.filter((id) => id === "qr").length;
    if (fullRests <= 1 && ids[0] !== "qr") return ids;
  }
}

/** Per-beat correctness of the user's answer. */
export function grade(answer: (string | null)[], target: string[]): boolean[] {
  return target.map((id, i) => answer[i] === id);
}

export interface Hit {
  start: number; // seconds from the first downbeat
  duration: number; // seconds the note sounds
}

/** Onsets of the sounding (non-rest) slots at `bpm`. Notes are slightly detached so lengths stay audible. */
export function planRhythm(ids: string[], bpm: number, articulation = 0.85): Hit[] {
  const sixteenth = 60 / bpm / 4;
  const hits: Hit[] = [];
  let t = 0;
  for (const id of ids) {
    for (const s of getCell(id).slots) {
      const len = s.units * sixteenth;
      if (!s.rest) hits.push({ start: t, duration: len * articulation });
      t += len;
    }
  }
  return hits;
}

/** VexFlow duration code for a slot ("q", "8r", "16", ...). */
export function vexDuration(s: Slot): string {
  const base = s.units === 4 ? "q" : s.units === 2 ? "8" : "16";
  return s.rest ? `${base}r` : base;
}
