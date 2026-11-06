import { create } from "zustand";
import { getInterval, INTERVALS, pickRoot, signedSemitones } from "@/lib/audio/intervals-catalog";
import { evaluateInterval, type IntervalEvaluation } from "@/lib/audio/interval-evaluator";
import { centsOff, frequencyToMidi } from "@/lib/audio/music-math";
import type { Lang } from "@/lib/i18n";

export type Phase = "IDLE" | "PLAYING_INTERVAL" | "SINGING_ROOT" | "SINGING_TARGET" | "SUCCESS" | "MISS";
export type ConfirmResult = "root" | "target" | "ignored";

export interface Score {
  correct: number;
  total: number;
  streak: number;
}

export interface TrainerState {
  lang: Lang;
  /** An interval id from the catalog, or "random". */
  selection: string;
  /** Interval of the current challenge. */
  currentId: string | null;
  phase: Phase;
  rootMidi: number | null;
  rootHz: number | null;
  evaluation: IntervalEvaluation | null;
  micError: boolean;
  score: Score;

  setLang: (lang: Lang) => void;
  setSelection: (id: string) => void;
  setMicError: (v: boolean) => void;
  startChallenge: (rand?: () => number) => void;
  replay: () => void;
  playbackFinished: () => void;
  confirmNote: (hz: number) => ConfirmResult;
  reset: () => void;
}

const MIN_TARGET_SEPARATION_CENTS = 50;

export const useTrainer = create<TrainerState>((set, get) => ({
  lang: "es",
  selection: "random",
  currentId: null,
  phase: "IDLE",
  rootMidi: null,
  rootHz: null,
  evaluation: null,
  micError: false,
  score: { correct: 0, total: 0, streak: 0 },

  setLang: (lang) => set({ lang }),
  setSelection: (selection) =>
    set({ selection, currentId: null, phase: "IDLE", rootMidi: null, rootHz: null, evaluation: null }),
  setMicError: (micError) => set({ micError }),

  startChallenge: (rand = Math.random) => {
    const { selection } = get();
    const id = selection === "random" ? INTERVALS[Math.floor(rand() * INTERVALS.length)].id : selection;
    set({
      currentId: id,
      rootMidi: pickRoot(getInterval(id), rand),
      rootHz: null,
      evaluation: null,
      phase: "PLAYING_INTERVAL",
    });
  },

  replay: () => {
    if (get().currentId) set({ phase: "PLAYING_INTERVAL", rootHz: null, evaluation: null });
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

  reset: () => set({ phase: "IDLE", currentId: null, rootMidi: null, rootHz: null, evaluation: null }),
}));

/** Nearest MIDI of a frequency, re-exported for UI convenience. */
export const hzToMidi = frequencyToMidi;
