import type { SequenceNote } from "./synth-engine";

export type Direction = "asc" | "desc";

export interface MotifNote {
  /** Semitones relative to the motif's first note (the exercise root). */
  offset: number;
  /** Duration in beats. */
  beats: number;
}

export interface ReferenceSong {
  title: string;
  artist?: string;
  /** Short instrumental motif; first note is the interval's root. */
  motif: MotifNote[];
}

export interface IntervalDef {
  id: string;
  name: { es: string; en: string };
  semitones: number;
  direction: Direction;
  song: ReferenceSong;
}

const n = (offset: number, beats = 1): MotifNote => ({ offset, beats });

export const INTERVALS: readonly IntervalDef[] = [
  { id: "m2-asc", name: { es: "2da menor", en: "Minor 2nd" }, semitones: 1, direction: "asc",
    song: { title: "Jaws", motif: [n(0, 0.5), n(1, 0.5), n(0, 0.5), n(1, 0.5)] } },
  { id: "M2-asc", name: { es: "2da mayor", en: "Major 2nd" }, semitones: 2, direction: "asc",
    song: { title: "Happy Birthday", motif: [n(0, 0.75), n(0, 0.25), n(2), n(0), n(5), n(4, 2)] } },
  { id: "m3-desc", name: { es: "3ra menor", en: "Minor 3rd" }, semitones: 3, direction: "desc",
    song: { title: "Hey Jude", artist: "The Beatles", motif: [n(0, 1), n(-3, 2)] } },
  { id: "M3-asc", name: { es: "3ra mayor", en: "Major 3rd" }, semitones: 4, direction: "asc",
    song: { title: "When the Saints Go Marching In", motif: [n(0), n(4), n(5), n(7, 2)] } },
  { id: "P4-asc", name: { es: "4ta justa", en: "Perfect 4th" }, semitones: 5, direction: "asc",
    song: { title: "Bridal Chorus (Here Comes the Bride)", motif: [n(0), n(5, 2)] } },
  { id: "TT-asc", name: { es: "Tritono", en: "Tritone" }, semitones: 6, direction: "asc",
    song: { title: "The Simpsons", motif: [n(0), n(6, 2)] } },
  { id: "P5-asc", name: { es: "5ta justa", en: "Perfect 5th" }, semitones: 7, direction: "asc",
    song: { title: "Star Wars (Main Theme)", motif: [n(0), n(7, 2)] } },
  { id: "m6-asc", name: { es: "6ta menor", en: "Minor 6th" }, semitones: 8, direction: "asc",
    song: { title: "El día que me quieras", artist: "Carlos Gardel", motif: [n(0), n(8, 2)] } },
  { id: "M6-asc", name: { es: "6ta mayor", en: "Major 6th" }, semitones: 9, direction: "asc",
    song: { title: "My Way", motif: [n(0), n(9, 2)] } },
  { id: "P8-asc", name: { es: "8va justa", en: "Perfect octave" }, semitones: 12, direction: "asc",
    song: { title: "Somewhere Over the Rainbow", motif: [n(0, 2), n(12, 2)] } },
];

export function getInterval(id: string): IntervalDef {
  const def = INTERVALS.find((i) => i.id === id);
  if (!def) throw new Error(`Unknown interval: ${id}`);
  return def;
}

/** Signed semitone distance from root to target (negative when descending). */
export function signedSemitones(def: IntervalDef): number {
  return def.direction === "asc" ? def.semitones : -def.semitones;
}

/** Root + target as two sequential notes. */
export function intervalNotes(def: IntervalDef, rootMidi: number, beats = 1.5): SequenceNote[] {
  return [
    { midi: rootMidi, beats },
    { midi: rootMidi + signedSemitones(def), beats },
  ];
}

/** Song motif transposed so its first note is `rootMidi`. */
export function motifNotes(def: IntervalDef, rootMidi: number): SequenceNote[] {
  return def.song.motif.map((m) => ({ midi: rootMidi + m.offset, beats: m.beats }));
}

/**
 * Random root such that both interval notes stay inside [low, high] (MIDI),
 * a comfortable range for most voices (default A2..A4).
 */
export function pickRoot(def: IntervalDef, rand: () => number = Math.random, low = 45, high = 69): number {
  const d = signedSemitones(def);
  const min = Math.max(low, low - d);
  const max = Math.min(high, high - d);
  return min + Math.floor(rand() * (max - min + 1));
}
