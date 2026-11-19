import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BASE_INTERVALS, directedId, getInterval, pickRoot, signedSemitones, type Direction } from "@/lib/audio/intervals-catalog";
import { evaluateInterval, type IntervalEvaluation } from "@/lib/audio/interval-evaluator";
import { centsOff, frequencyToMidi } from "@/lib/audio/music-math";
import type { Lang } from "@/lib/i18n";
import { safeStorage } from "./safe-storage";

export type Phase = "IDLE" | "PLAYING_INTERVAL" | "SINGING_ROOT" | "SINGING_TARGET" | "IDENTIFY" | "SUCCESS" | "MISS";
export type ConfirmResult = "root" | "target" | "ignored";

export interface Score {
  correct: number;
  total: number;
  streak: number;
}

/** Each game keeps its own tally: "recognize" is surprise mode (selection "random"), "sing" is the chosen interval. */
export type GameMode = "recognize" | "sing";

export interface IntervalStat {
  correct: number;
  total: number;
}

export interface TrainerState {
  lang: Lang;
  /** A base interval id ("P5"), or "random". */
  selection: string;
  /** Last interval chosen in "sing" mode; restored when coming back from surprise mode or after a reload. */
  singSelection: string;
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
  scores: Record<GameMode, Score>;
  /** Right/total per directed interval ("P5-asc"), across both games. */
  byInterval: Record<string, IntervalStat>;

  setLang: (lang: Lang) => void;
  /** The route decides the game: recognise = surprise interval, sing = the interval the user chose. */
  setMode: (mode: GameMode) => void;
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
  resetProgress: () => void;
}

const MIN_TARGET_SEPARATION_CENTS = 50;
const DEFAULT_SING_SELECTION = "P5";
const emptyScore = (): Score => ({ correct: 0, total: 0, streak: 0 });
const emptyScores = (): Record<GameMode, Score> => ({ recognize: emptyScore(), sing: emptyScore() });

/** Adds one result to the game's score and to the interval's tally. */
function tally(
  s: Pick<TrainerState, "scores" | "byInterval">,
  mode: GameMode,
  intervalId: string,
  correct: boolean,
): Pick<TrainerState, "scores" | "byInterval"> {
  const score = s.scores[mode];
  const prev = s.byInterval[intervalId] ?? { correct: 0, total: 0 };
  return {
    scores: {
      ...s.scores,
      [mode]: {
        correct: score.correct + (correct ? 1 : 0),
        total: score.total + 1,
        streak: correct ? score.streak + 1 : 0,
      },
    },
    byInterval: {
      ...s.byInterval,
      [intervalId]: { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 },
    },
  };
}

// ---- persistence ----------------------------------------------------------

/** Only what is worth keeping across reloads; the challenge in progress (phase, notes, evaluation) is not. */
type PersistedTrainer = Pick<TrainerState, "lang" | "singSelection" | "direction" | "scores" | "byInterval">;

const isCount = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
const isScore = (v: unknown): v is Score =>
  !!v && typeof v === "object" && isCount((v as Score).correct) && isCount((v as Score).total) && isCount((v as Score).streak);

/** localStorage can hold anything (old versions, edits by hand): keep only what has the right shape. */
function sanitize(raw: unknown): Partial<PersistedTrainer> {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Partial<PersistedTrainer> = {};
  if (p.lang === "es" || p.lang === "en") out.lang = p.lang;
  if (p.direction === "asc" || p.direction === "desc") out.direction = p.direction;
  if (typeof p.singSelection === "string" && BASE_INTERVALS.some((b) => b.id === p.singSelection)) out.singSelection = p.singSelection;
  const sc = p.scores as Partial<Record<GameMode, unknown>> | undefined;
  if (sc && isScore(sc.recognize) && isScore(sc.sing)) out.scores = { recognize: sc.recognize, sing: sc.sing };
  if (p.byInterval && typeof p.byInterval === "object") {
    const byInterval: Record<string, IntervalStat> = {};
    for (const [id, v] of Object.entries(p.byInterval)) {
      const stat = v as IntervalStat;
      if (INTERVAL_IDS.has(id) && isCount(stat?.correct) && isCount(stat?.total) && stat.correct <= stat.total) byInterval[id] = { correct: stat.correct, total: stat.total };
    }
    out.byInterval = byInterval;
  }
  return out;
}

const INTERVAL_IDS = new Set(BASE_INTERVALS.flatMap((b) => [directedId(b.id, "asc"), directedId(b.id, "desc")]));

export const useTrainer = create<TrainerState>()(
  persist(
    (set, get) => ({
    lang: "es",
    selection: "random",
    singSelection: DEFAULT_SING_SELECTION,
    direction: "asc",
    currentId: null,
    phase: "IDLE",
    rootMidi: null,
    rootHz: null,
    evaluation: null,
    micError: false,
    answerId: null,
    scores: emptyScores(),
    byInterval: {},

    setLang: (lang) => set({ lang }),
    setMode: (mode) => get().setSelection(mode === "recognize" ? "random" : get().singSelection),
    setSelection: (selection) =>
      set((s) => ({
        selection,
        singSelection: selection === "random" ? s.singSelection : selection,
        currentId: null,
        phase: "IDLE",
        rootMidi: null,
        rootHz: null,
        evaluation: null,
      })),
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
      const { phase, rootHz, currentId } = get();
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
        set((s) => ({
          evaluation,
          phase: evaluation.correct ? "SUCCESS" : "MISS",
          ...tally(s, "sing", currentId, evaluation.correct),
        }));
        return "target";
      }
      return "ignored";
    },

    answer: (baseId, direction) => {
      const { phase, currentId } = get();
      if (phase !== "IDENTIFY" || !currentId) return;
      const answerId = directedId(baseId, direction);
      const correct = answerId === currentId;
      set((s) => ({
        answerId,
        phase: correct ? "SUCCESS" : "MISS",
        ...tally(s, "recognize", currentId, correct),
      }));
    },

    reset: () => set({ phase: "IDLE", currentId: null, rootMidi: null, rootHz: null, evaluation: null }),
    resetProgress: () => set({ scores: emptyScores(), byInterval: {} }),
    }),
    {
      name: "burpears:trainer",
      version: 1,
      storage: safeStorage,
      // Rehydrated by <StoreHydrator /> after mount, so server and first client render match.
      skipHydration: true,
      partialize: (s): PersistedTrainer => ({
        lang: s.lang,
        singSelection: s.singSelection,
        direction: s.direction,
        scores: s.scores,
        byInterval: s.byInterval,
      }),
      // Bump `version` when the persisted shape changes and convert old data here instead of dropping it.
      migrate: (persisted) => persisted as PersistedTrainer,
      merge: (persisted, current) => {
        const saved = sanitize(persisted);
        const next = { ...current, ...saved };
        // The page's mount effect may have run before hydration: bring the chosen interval along.
        if (current.selection !== "random" && saved.singSelection) next.selection = saved.singSelection;
        return next;
      },
    },
  ),
);

/** Nearest MIDI of a frequency, re-exported for UI convenience. */
export const hzToMidi = frequencyToMidi;
