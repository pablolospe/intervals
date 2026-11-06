import { normalizeToOctave, semitonesBetween } from "./music-math";

export interface IntervalEvaluation {
  /** Raw measured distance root -> target in semitones (any octave). */
  measured: number;
  /** Measured distance folded by octaves to be nearest the expected interval. */
  normalized: number;
  /** normalized - expected, in cents. */
  errorCents: number;
  correct: boolean;
}

/**
 * Compare two sung frequencies against the expected signed interval.
 * Octave-invariant so any vocal register works; default tolerance is ±50 cents (a quarter tone).
 */
export function evaluateInterval(
  rootHz: number,
  targetHz: number,
  expectedSemitones: number,
  toleranceCents = 50,
): IntervalEvaluation {
  const measured = semitonesBetween(rootHz, targetHz);
  const normalized = normalizeToOctave(measured, expectedSemitones);
  const errorCents = (normalized - expectedSemitones) * 100;
  return { measured, normalized, errorCents, correct: Math.abs(errorCents) <= toleranceCents };
}
