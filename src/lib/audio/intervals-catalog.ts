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

/** A directed interval: one quality (`base`) sung up or down. */
export interface IntervalDef {
  /** `${base}-${direction}`, e.g. "m3-desc". */
  id: string;
  base: string;
  name: { es: string; en: string };
  semitones: number;
  direction: Direction;
  /** Primary song (first of songs). */
  song: ReferenceSong;
  /** Multiple song options for this interval. */
  songs: ReferenceSong[];
}

/** An interval quality with multiple mnemonic songs per direction. */
export interface BaseInterval {
  id: string;
  name: { es: string; en: string };
  semitones: number;
  songs: Record<Direction, ReferenceSong[]>;
}

const n = (offset: number, beats = 1): MotifNote => ({ offset, beats });

export const BASE_INTERVALS: readonly BaseInterval[] = [
  {
    id: "m2",
    name: { es: "2da menor", en: "Minor 2nd" },
    semitones: 1,
    songs: {
      asc: [
        {
          title: "Tiburón (Jaws)",
          artist: "John Williams",
          motif: [n(0, 0.75), n(1, 0.75), n(0, 0.5), n(1, 0.5), n(0, 0.35), n(1, 0.35), n(0, 0.2), n(1, 0.5)],
        },
        {
          title: "La Pantera Rosa",
          artist: "Henry Mancini",
          motif: [n(0, 0.5), n(1, 1), n(0, 0.5), n(1, 1), n(0, 0.5), n(1, 0.5), n(2, 0.5), n(3, 1.5)],
        },
      ],
      desc: [
        {
          title: "Para Elisa",
          artist: "Beethoven",
          motif: [n(0, 0.5), n(-1, 0.5), n(0, 0.5), n(-1, 0.5), n(0, 0.5), n(-5, 0.5), n(-2, 0.5), n(-4, 0.5), n(-7, 1.5)],
        },
        {
          title: "Fly Me to the Moon",
          artist: "Frank Sinatra",
          motif: [n(0, 1), n(-1, 1), n(-3, 0.5), n(-5, 0.5), n(-7, 2)],
        },
      ],
    },
  },
  {
    id: "M2",
    name: { es: "2da mayor", en: "Major 2nd" },
    semitones: 2,
    songs: {
      asc: [
        {
          title: "Cumpleaños feliz",
          motif: [n(0, 0.75), n(0, 0.25), n(2), n(0), n(5), n(4, 2)],
        },
        {
          title: "Martinillo (Frère Jacques)",
          motif: [n(0, 1), n(2, 1), n(4, 1), n(0, 1)],
        },
      ],
      desc: [
        {
          title: "Yesterday",
          artist: "The Beatles",
          motif: [n(0, 1), n(-2, 2), n(0, 0.5), n(2, 0.5), n(4, 0.5), n(5, 0.5), n(4, 1)],
        },
        {
          title: "Mary Had a Little Lamb",
          motif: [n(0, 0.75), n(-2, 0.25), n(-4, 0.5), n(-2, 0.5), n(0, 0.5), n(0, 0.5), n(0, 1)],
        },
      ],
    },
  },
  {
    id: "m3",
    name: { es: "3ra menor", en: "Minor 3rd" },
    semitones: 3,
    songs: {
      asc: [
        {
          title: "Greensleeves",
          motif: [n(0, 1), n(3, 2), n(5, 1), n(7, 1.5), n(8, 0.5), n(7, 1), n(5, 2)],
        },
        {
          title: "Arrullo (Canción de cuna)",
          artist: "Brahms",
          motif: [n(0, 0.75), n(0, 0.25), n(3, 2), n(0, 0.75), n(0, 0.25), n(3, 2)],
        },
        {
          title: "Smoke on the Water",
          artist: "Deep Purple",
          motif: [n(0, 1), n(3, 1), n(5, 1.5), n(0, 1), n(3, 1), n(6, 0.5), n(5, 1.5)],
        },
      ],
      desc: [
        {
          title: "Hey Jude",
          artist: "The Beatles",
          motif: [n(0, 1), n(-3, 1.5), n(-3, 0.5), n(-1, 0.5), n(0, 0.5), n(2, 2)],
        },
        {
          title: "Te quiero yo (Barney)",
          motif: [n(0, 1), n(-3, 1), n(0, 1), n(-3, 1), n(2, 0.5), n(0, 0.5), n(-1, 0.5), n(-3, 1.5)],
        },
      ],
    },
  },
  {
    id: "M3",
    name: { es: "3ra mayor", en: "Major 3rd" },
    semitones: 4,
    songs: {
      asc: [
        {
          title: "When the Saints Go Marching In",
          motif: [n(0), n(4), n(5), n(7, 2), n(0), n(4), n(5), n(7, 2)],
        },
        {
          title: "Kumbaya",
          motif: [n(0, 1), n(4, 1), n(7, 2), n(7, 1)],
        },
      ],
      desc: [
        {
          title: "5ta Sinfonía",
          artist: "Beethoven",
          motif: [n(0, 0.5), n(0, 0.5), n(0, 0.5), n(-4, 2), n(-2, 0.5), n(-2, 0.5), n(-2, 0.5), n(-5, 2)],
        },
        {
          title: "Swing Low, Sweet Chariot",
          motif: [n(0, 1.5), n(-4, 1.5), n(0, 1), n(-4, 2)],
        },
      ],
    },
  },
  {
    id: "P4",
    name: { es: "4ta justa", en: "Perfect 4th" },
    semitones: 5,
    songs: {
      asc: [
        {
          title: "Bridal Chorus (Here Comes the Bride)",
          artist: "Wagner",
          motif: [n(0, 1), n(5, 1.5), n(5, 0.5), n(5, 2), n(0, 1), n(7, 1.5), n(4, 0.5), n(5, 2)],
        },
        {
          title: "A Hard Day's Night",
          artist: "The Beatles",
          motif: [n(0, 1), n(5, 1.5), n(3, 0.5), n(0, 1), n(-2, 2)],
        },
        {
          title: "Himno Nacional Argentino",
          motif: [n(0, 1), n(5, 2), n(5, 0.5), n(4, 0.5), n(5, 2)],
        },
      ],
      desc: [
        {
          title: "Pequeña serenata nocturna",
          artist: "Mozart",
          motif: [n(0, 1), n(-5, 0.5), n(0, 1), n(-5, 0.5), n(0, 0.5), n(4, 0.5), n(7, 1.5)],
        },
        {
          title: "Born Free",
          artist: "John Barry",
          motif: [n(0, 2), n(-5, 2), n(-4, 0.5), n(-2, 0.5), n(0, 2)],
        },
      ],
    },
  },
  {
    id: "TT",
    name: { es: "Tritono", en: "Tritone" },
    semitones: 6,
    songs: {
      asc: [
        {
          title: "The Simpsons",
          artist: "Danny Elfman",
          motif: [n(0, 1), n(6, 1), n(7, 2)],
        },
        {
          title: "Maria (West Side Story)",
          artist: "Leonard Bernstein",
          motif: [n(0, 1.5), n(6, 2), n(7, 2.5)],
        },
      ],
      desc: [
        {
          title: "Black Sabbath",
          artist: "Black Sabbath",
          motif: [n(0, 1), n(-6, 3), n(-12, 1), n(0, 1), n(-6, 3)],
        },
        {
          title: "Even Flow",
          artist: "Pearl Jam",
          motif: [n(0, 1), n(-6, 1.5), n(-7, 1), n(-5, 1.5)],
        },
      ],
    },
  },
  {
    id: "P5",
    name: { es: "5ta justa", en: "Perfect 5th" },
    semitones: 7,
    songs: {
      asc: [
        {
          title: "Star Wars (Main Theme)",
          artist: "John Williams",
          motif: [n(0, 1), n(7, 1.5), n(5, 0.33), n(4, 0.33), n(2, 0.34), n(12, 1.5), n(7, 1.5)],
        },
        {
          title: "Estrellita (Twinkle Twinkle)",
          motif: [n(0, 1), n(0, 1), n(7, 1), n(7, 1), n(9, 1), n(9, 1), n(7, 2)],
        },
      ],
      desc: [
        {
          title: "Los Picapiedras",
          motif: [n(0, 1), n(-7, 1), n(5, 1.5), n(2, 0.5), n(0, 1), n(-7, 1)],
        },
        {
          title: "Game of Thrones",
          artist: "Ramin Djawadi",
          motif: [n(0, 2), n(-7, 2), n(-3, 0.5), n(-2, 0.5), n(0, 2)],
        },
      ],
    },
  },
  {
    id: "m6",
    name: { es: "6ta menor", en: "Minor 6th" },
    semitones: 8,
    songs: {
      asc: [
        {
          title: "The Entertainer",
          artist: "Scott Joplin",
          motif: [n(0, 0.75), n(8, 1), n(5, 0.5), n(8, 0.5), n(5, 0.5), n(8, 1.5)],
        },
        {
          title: "Conquest of Paradise",
          artist: "Vangelis",
          motif: [n(0, 1.5), n(8, 2), n(7, 2)],
        },
      ],
      desc: [
        {
          title: "Love Story (Where Do I Begin)",
          artist: "Francis Lai",
          motif: [n(0, 1.5), n(-8, 2.5)],
        },
        {
          title: "Chega de Saudade",
          artist: "Tom Jobim",
          motif: [n(0, 1.5), n(-8, 2), n(-7, 1), n(-8, 2)],
        },
      ],
    },
  },
  {
    id: "M6",
    name: { es: "6ta mayor", en: "Major 6th" },
    semitones: 9,
    songs: {
      asc: [
        {
          title: "El día que me quieras",
          artist: "Carlos Gardel",
          motif: [n(0, 1), n(9, 1), n(9, 0.5), n(9, 0.5), n(8, 0.5), n(9, 2)],
        },
        {
          title: "My Way",
          artist: "Frank Sinatra",
          motif: [n(0, 1.5), n(9, 2), n(8, 1), n(7, 1), n(5, 2)],
        },
      ],
      desc: [
        {
          title: "No Surprises",
          artist: "Radiohead",
          motif: [n(0, 1), n(-9, 1.5), n(-7, 0.5), n(-5, 1), n(-7, 2)],
        },
        {
          title: "Nobody Knows the Trouble I've Seen",
          motif: [n(0, 0.75), n(-9, 1.25), n(-7, 0.5), n(-5, 1.5)],
        },
      ],
    },
  },
  {
    id: "m7",
    name: { es: "7ma menor", en: "Minor 7th" },
    semitones: 10,
    songs: {
      asc: [
        {
          title: "Somewhere (West Side Story)",
          artist: "Leonard Bernstein",
          motif: [n(0, 1.5), n(10, 1.5), n(9, 0.75), n(7, 0.75), n(5, 2)],
        },
        {
          title: "The Winner Takes It All",
          artist: "ABBA",
          motif: [n(0, 1), n(10, 1.5), n(9, 0.5), n(7, 1), n(5, 2)],
        },
      ],
      desc: [
        {
          title: "Watermelon Man",
          artist: "Herbie Hancock",
          motif: [n(0, 1), n(-10, 2)],
        },
        {
          title: "Blanca Navidad (White Christmas)",
          artist: "Irving Berlin",
          motif: [n(0, 1.5), n(-10, 2), n(-8, 1), n(-10, 2)],
        },
      ],
    },
  },
  {
    id: "M7",
    name: { es: "7ma mayor", en: "Major 7th" },
    semitones: 11,
    songs: {
      asc: [
        {
          title: "Take On Me",
          artist: "a-ha",
          motif: [n(0, 1.5), n(11, 1.5), n(12, 2)],
        },
        {
          title: "Superman (Love Theme)",
          artist: "John Williams",
          motif: [n(0, 1.5), n(11, 2), n(9, 1), n(11, 2)],
        },
      ],
      desc: [
        {
          title: "I Love You",
          artist: "Cole Porter",
          motif: [n(0, 1.5), n(-11, 2.5)],
        },
        {
          title: "Have Yourself a Merry Little Christmas",
          motif: [n(0, 1.5), n(-11, 2), n(-9, 1), n(-7, 2)],
        },
      ],
    },
  },
  {
    id: "P8",
    name: { es: "8va justa", en: "Perfect octave" },
    semitones: 12,
    songs: {
      asc: [
        {
          title: "Somewhere Over the Rainbow",
          artist: "Judy Garland",
          motif: [n(0, 1.5), n(12, 1.5), n(11, 1), n(7, 0.5), n(9, 0.5), n(11, 1), n(12, 2)],
        },
        {
          title: "Singin' in the Rain",
          artist: "Gene Kelly",
          motif: [n(0, 1), n(12, 1.5), n(9, 1), n(7, 1), n(4, 2)],
        },
      ],
      desc: [
        {
          title: "Doogie Howser, M.D.",
          artist: "Mike Post",
          motif: [n(0, 1), n(-12, 2), n(-10, 1), n(-12, 2)],
        },
        {
          title: "Willow Weep for Me",
          artist: "Ann Ronell",
          motif: [n(0, 1), n(-12, 3)],
        },
      ],
    },
  },
];

export const DIRECTIONS: readonly Direction[] = ["asc", "desc"];

export const directedId = (base: string, direction: Direction) => `${base}-${direction}`;

/** Every base interval in both directions (24 entries). */
export const INTERVALS: readonly IntervalDef[] = BASE_INTERVALS.flatMap((b) =>
  DIRECTIONS.map((direction) => {
    const songList = b.songs[direction];
    return {
      id: directedId(b.id, direction),
      base: b.id,
      name: b.name,
      semitones: b.semitones,
      direction,
      song: songList[0],
      songs: songList,
    };
  }),
);

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
export function motifNotes(def: IntervalDef, rootMidi: number, songIndex = 0): SequenceNote[] {
  const song = def.songs[songIndex] ?? def.song;
  return song.motif.map((m) => ({ midi: rootMidi + m.offset, beats: m.beats }));
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
