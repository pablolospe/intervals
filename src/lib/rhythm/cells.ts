/** Rhythmic cells that each fill one beat: 4 sixteenths in binary, or 6 sixteenths in ternary (dotted quarter). */

export type Subdivision = "binary" | "ternary";

export interface Slot {
  units: 1 | 2 | 3 | 4 | 6; // sixteenths (3 = dotted 8th, 6 = dotted quarter)
  rest: boolean;
}

export interface RhythmCell {
  id: string;
  label: string;
  subdivision?: Subdivision;
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

export const TERNARY_CELLS: RhythmCell[] = [
  { id: "qd", label: "Negra con puntillo", subdivision: "ternary", slots: [n(6)] },
  { id: "8-8-8", label: "3 corcheas", subdivision: "ternary", slots: [n(2), n(2), n(2)] },
  { id: "q-8", label: "Negra + corchea", subdivision: "ternary", slots: [n(4), n(2)] },
  { id: "8-q", label: "Corchea + negra", subdivision: "ternary", slots: [n(2), n(4)] },
  { id: "8d-16-8", label: "Corchea punt. + semi + corchea", subdivision: "ternary", slots: [n(3), n(1), n(2)] },
  { id: "8-8-16-16", label: "2 corcheas + 2 semis", subdivision: "ternary", slots: [n(2), n(2), n(1), n(1)] },
  // with rests
  { id: "qdr", label: "Silencio de negra punt.", subdivision: "ternary", slots: [r(6)] },
  { id: "8r-8-8", label: "Silencio + 2 corcheas", subdivision: "ternary", slots: [r(2), n(2), n(2)] },
  { id: "8-8r-8", label: "Corchea + silencio + corchea", subdivision: "ternary", slots: [n(2), r(2), n(2)] },
  { id: "8-8-8r", label: "2 corcheas + silencio", subdivision: "ternary", slots: [n(2), n(2), r(2)] },
  { id: "qr-8", label: "Silencio de negra + corchea", subdivision: "ternary", slots: [r(4), n(2)] },
  { id: "8r-q", label: "Silencio + negra", subdivision: "ternary", slots: [r(2), n(4)] },
];

const BY_ID = new Map([...CELLS, ...TERNARY_CELLS].map((c) => [c.id, c]));

export function getCell(id: string): RhythmCell {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Unknown rhythm cell: ${id}`);
  return c;
}

export const hasRest = (c: RhythmCell) => c.slots.some((s) => s.rest);

/** All cells of a meter, with and without rests. */
export const cellsFor = (subdivision: Subdivision = "binary"): RhythmCell[] => (subdivision === "ternary" ? TERNARY_CELLS : CELLS);

/** The cells the user can be asked: every cell of the meter except the ones they turned off. */
export function cellPool(subdivision: Subdivision = "binary", disabled: readonly string[] = []): RhythmCell[] {
  return cellsFor(subdivision).filter((c) => !disabled.includes(c.id));
}

const isFullRest = (id: string) => id === "qr" || id === "qdr";

/** Smallest selection that still makes a dictation worth doing. */
export const MIN_CELLS = 2;

/** A pool needs variety, and at least one cell that is not a whole-beat rest (those can't open a measure). */
export const isUsablePool = (pool: readonly RhythmCell[]) => pool.length >= MIN_CELLS && pool.some((c) => !isFullRest(c.id));

/** Starter selection: whole beats built from plain notes. */
const BASIC_IDS: Record<Subdivision, readonly string[]> = {
  binary: ["q", "8-8", "16x4"],
  ternary: ["qd", "8-8-8", "q-8", "8-q"],
};

/** Ids to switch off so only the basic cells remain. */
export const basicDisabled = (subdivision: Subdivision): string[] =>
  cellsFor(subdivision)
    .filter((c) => !BASIC_IDS[subdivision].includes(c.id))
    .map((c) => c.id);

/** Random measure of `beats` cells. Never more than one whole-beat rest, and never starting with one. */
export function randomRhythm(pool: RhythmCell[], beats = 4, rng: () => number = Math.random): string[] {
  const pick = () => pool[Math.floor(rng() * pool.length)].id;
  // Without a sounding cell to open the measure the rules above can't be met: take whatever there is.
  if (!pool.some((c) => !isFullRest(c.id))) return Array.from({ length: beats }, pick);
  for (;;) {
    const ids = Array.from({ length: beats }, pick);
    const fullRests = ids.filter(isFullRest).length;
    if (fullRests <= 1 && !isFullRest(ids[0])) return ids;
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
  const hits: Hit[] = [];
  let t = 0;
  for (const id of ids) {
    const cell = getCell(id);
    const beatUnits = cell.subdivision === "ternary" ? 6 : 4;
    const unitSec = 60 / bpm / beatUnits;
    for (const s of cell.slots) {
      const len = s.units * unitSec;
      if (!s.rest) hits.push({ start: t, duration: len * articulation });
      t += len;
    }
  }
  return hits;
}

/** VexFlow duration code for a slot ("q", "8r", "16", ...). Dotted units also return base "q"/"8". */
export function vexDuration(s: Slot): string {
  const base = s.units === 4 || s.units === 6 ? "q" : s.units === 2 || s.units === 3 ? "8" : "16";
  return s.rest ? `${base}r` : base;
}

export function isDotted(s: Slot): boolean {
  return s.units === 3 || s.units === 6;
}
