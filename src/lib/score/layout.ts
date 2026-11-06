import { eventBeats, DURATION_BEATS, pitchToMidi, type Score, type ScoreEvent } from "./types";

/** Split events into measures; an event that would overflow starts a new measure. */
export function toMeasures(score: Score): ScoreEvent[][] {
  const measures: ScoreEvent[][] = [];
  let current: ScoreEvent[] = [];
  let used = 0;
  for (const e of score.events) {
    const b = eventBeats(e);
    if (used + b > score.beatsPerMeasure + 1e-9 && current.length) {
      measures.push(current);
      current = [];
      used = 0;
    }
    current.push(e);
    used += b;
  }
  if (current.length) measures.push(current);
  return measures;
}

export interface PlayStep {
  midi: number | null; // null = rest
  beats: number;
}

/** Flatten to timed steps for playback; tuplet members are scaled by normal/actual. */
export function toPlaySteps(score: Score): PlayStep[] {
  const steps: PlayStep[] = [];
  for (const e of score.events) {
    if (e.kind === "tuplet") {
      for (const i of e.items) {
        steps.push({
          midi: i.kind === "note" ? pitchToMidi(i.pitch) : null,
          beats: (DURATION_BEATS[i.duration] * e.normal) / e.actual,
        });
      }
    } else {
      steps.push({ midi: e.kind === "note" ? pitchToMidi(e.pitch) : null, beats: DURATION_BEATS[e.duration] });
    }
  }
  return steps;
}
