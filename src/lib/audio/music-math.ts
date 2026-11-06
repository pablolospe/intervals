/** Pure music math: Hz <-> MIDI, cents, intervals. No DOM / Web Audio dependencies. */

export const A4_HZ = 440;
export const A4_MIDI = 69;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export function midiToFrequency(midi: number, a4 = A4_HZ): number {
  return a4 * 2 ** ((midi - A4_MIDI) / 12);
}

/** Fractional MIDI number for a frequency (69 = A4). */
export function frequencyToMidi(frequency: number, a4 = A4_HZ): number {
  if (!(frequency > 0)) throw new RangeError("frequency must be > 0");
  return A4_MIDI + 12 * Math.log2(frequency / a4);
}

/** Signed distance in semitones from f1 to f2: 12 * log2(f2 / f1). */
export function semitonesBetween(f1: number, f2: number): number {
  if (!(f1 > 0) || !(f2 > 0)) throw new RangeError("frequencies must be > 0");
  return 12 * Math.log2(f2 / f1);
}

export interface NoteInfo {
  midi: number; // nearest integer MIDI note
  name: string; // e.g. "C#"
  octave: number; // scientific pitch notation (C4 = 261.63 Hz = MIDI 60)
  cents: number; // deviation from equal temperament, in [-50, 50]
}

export function frequencyToNote(frequency: number, a4 = A4_HZ): NoteInfo {
  const exact = frequencyToMidi(frequency, a4);
  const midi = Math.round(exact);
  return {
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    cents: (exact - midi) * 100,
  };
}

/** Deviation in cents of `frequency` relative to `reference`. */
export function centsOff(frequency: number, reference: number): number {
  return 1200 * Math.log2(frequency / reference);
}

export function midiToName(midi: number): string {
  const n = Math.round(midi);
  return `${NOTE_NAMES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;
}

/** Octave-invariant pitch class (0-11) of a MIDI note or frequency-derived midi. */
export function pitchClass(midi: number): number {
  return ((Math.round(midi) % 12) + 12) % 12;
}

/**
 * Octave-invariant interval between two notes, folded into 0..11 semitones
 * (ascending from `from` to `to`).
 */
export function pitchClassInterval(fromMidi: number, toMidi: number): number {
  return (((Math.round(toMidi) - Math.round(fromMidi)) % 12) + 12) % 12;
}

/**
 * Fold a measured interval (in semitones, possibly fractional) by whole octaves so
 * it is as close as possible to `expected`. Lets singers answer in any octave.
 */
export function normalizeToOctave(measured: number, expected: number): number {
  return measured - 12 * Math.round((measured - expected) / 12);
}
