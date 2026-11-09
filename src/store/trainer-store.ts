import { create } from "zustand";
import { BASE_INTERVALS, directedId, getInterval, pickRoot, signedSemitones, type Direction } from "@/lib/audio/intervals-catalog";
import { evaluateInterval, type IntervalEvaluation } from "@/lib/audio/interval-evaluator";
import { centsOff, frequencyToMidi } from "@/lib/audio/music-math";
import type { Lang } from "@/lib/i18n";

export type Phase = "IDLE" | "PLAYING_INTERVAL" | "SINGING_ROOT" | "SINGING_TARGET" | "IDENTIFY" | "SUCCESS" | "MISS";
export type ConfirmResult = "root" | "target" | "ignored";

export interface Score {
  correct: number;
  total: number;
  streak: number;
}

export interface TrainerState {
  lang: Lang;
  /** A base interval id ("P5"), or "random". */
  selection: string;
  /** Whether challenges go up or down. */
  direction: Direction;
  /** Directed interval of the current challenge ("P5-asc"). */
  currentId: string | null;
  phase: Phase;
  rootMidi: number | null;
  rootHz: number | null;
  evaluation: IntervalEvaluation | null;
  micError: boolean;
  answerId: string | null;
  score: Score;

  setLang: (lang: Lang) => void;
  setSelection: (id: string) => void;
  setDirection: (direction: Direction) => void;
  setMicError: (v: boolean) => void;
  startChallenge: (rand?: () => number) => void;
  /** Surprise mode only: the user names the interval and its direction after singing it. */
  answer: (baseId: string, direction: Direction) => void;
  replay: () => void;
  playbackFinished: () => void;
  confirmNote: (hz: number) => ConfirmResult;
  reset: () => void;
}

const MIN_TARGET_SEPARATION_CENTS = 50;

export const useTrainer = create<TrainerState>((set, get) => ({
  lang: "es",
  selection: "random",
  direction: "asc",
  currentId: null,
  phase: "IDLE",
  rootMidi: null,
  rootHz: null,
  evaluation: null,
  micError: false,
  answerId: null,
  score: { correct: 0, total: 0, streak: 0 },

  setLang: (lang) => set({ lang }),
  setSelection: (selection) =>
    set({ selection, currentId: null, phase: "IDLE", rootMidi: null, rootHz: null, evaluation: null }),
  setDirection: (direction) =>
    set({ direction, currentId: null, phase: "IDLE", rootMidi: null, rootHz: null, evaluation: null }),
  setMicError: (micError) => set({ micError }),

  startChallenge: (rand = Math.random) => {
    const { selection, direction } = get();
    const random = selection === "random";
    const base = random ? BASE_INTERVALS[Math.floor(rand() * BASE_INTERVALS.length)].id : selection;
    // Surprise mode also randomises the direction: guessing it is part of the game.
    const dir: Direction = random ? (rand() < 0.5 ? "asc" : "desc") : direction;
    const id = directedId(base, dir);
    set({
      currentId: id,
      rootMidi: pickRoot(getInterval(id), rand),
      rootHz: null,
      evaluation: null,
      answerId: null,
      phase: "PLAYING_INTERVAL",
    });
  },

  replay: () => {
    if (get().currentId) set({ phase: "PLAYING_INTERVAL", rootHz: null, evaluation: null, answerId: null });
  },

  playbackFinished: () => {
    if (get().phase === "PLAYING_INTERVAL") set({ phase: "SINGING_ROOT" });
  },

  confirmNote: (hz) => {
    const { phase, rootHz, currentId, score } = get();
    if (phase === "SINGING_ROOT") {
      set({ rootHz: hz, phase: "SINGING_TARGET" });
      return "root";
    }
    if (phase === "SINGING_TARGET" && rootHz !== null && currentId) {
      // The singer is probably still holding the root: wait for a different pitch.
      if (Math.abs(centsOff(hz, rootHz)) < MIN_TARGET_SEPARATION_CENTS) return "ignored";
      const evaluation = evaluateInterval(rootHz, hz, signedSemitones(getInterval(currentId)));
      if (get().selection === "random") {
        // Surprise mode: the sung pitch is recorded, but the score depends on naming the interval.
        set({ evaluation, phase: "IDENTIFY" });
        return "target";
      }
      set({
        evaluation,
        phase: evaluation.correct ? "SUCCESS" : "MISS",
        score: {
          correct: score.correct + (evaluation.correct ? 1 : 0),
          total: score.total + 1,
          streak: evaluation.correct ? score.streak + 1 : 0,
        },
      });
      return "target";
    }
    return "ignored";
  },

  answer: (baseId, direction) => {
    const { phase, currentId, score } = get();
    if (phase !== "IDENTIFY" || !currentId) return;
    const answerId = directedId(baseId, direction);
    const correct = answerId === currentId;
    set({
      answerId,
      phase: correct ? "SUCCESS" : "MISS",
      score: {
        correct: score.correct + (correct ? 1 : 0),
        total: score.total + 1,
        streak: correct ? score.streak + 1 : 0,
      },
    });
  },

  reset: () => set({ phase: "IDLE", currentId: null, rootMidi: null, rootHz: null, evaluation: null }),
}));

/** Nearest MIDI of a frequency, re-exported for UI convenience. */
export const hzToMidi = frequencyToMidi;
