import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cellPool, cellsFor, grade, hasRest, isUsablePool, randomRhythm, type Subdivision } from "@/lib/rhythm/cells";
import { safeStorage } from "./safe-storage";
import type { Score } from "./trainer-store";

export const BEATS = 4;
export const BPM_MIN = 50;
export const BPM_MAX = 130;

const emptyAnswer = () => Array<string | null>(BEATS).fill(null);
const emptyStats = (): Score => ({ correct: 0, total: 0, streak: 0 });

export interface RhythmState {
  // Persisted: settings and progress.
  bpm: number;
  subdivision: Subdivision;
  /** Cells switched off in the dictation, per meter. Stored as "off" so cells added later start enabled. */
  disabledCells: Record<Subdivision, string[]>;
  metronome: boolean;
  stats: Score;

  // Kept while navigating inside the app, but not across reloads: the exercise in progress.
  target: string[] | null;
  answer: (string | null)[];
  cursor: number;
  checked: boolean;

  setBpm: (bpm: number) => void;
  setSubdivision: (subdivision: Subdivision) => void;
  /**
   * Turns cells of the current meter on or off. Refused (returns false) if it would leave too few cells to
   * dictate. A rhythm in progress that uses a newly disabled cell is dropped, like on a meter change.
   */
  setCellsEnabled: (ids: readonly string[], enabled: boolean) => boolean;
  /** Keeps exactly these cells of the current meter on. Same rules as `setCellsEnabled`. */
  selectCells: (ids: readonly string[]) => boolean;
  setMetronome: (v: boolean) => void;
  /** Draws a new rhythm and returns it so the caller can play it. */
  newRhythm: (rng?: () => number) => string[];
  setCursor: (i: number) => void;
  pick: (cellId: string) => void;
  clear: () => void;
  check: () => void;
  /** Skips to another rhythm but counts as a miss, so it is never easier than trying. */
  giveUp: (rng?: () => number) => string[] | null;
  resetProgress: () => void;
}

const clampBpm = (bpm: number) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));

type PersistedRhythm = Pick<RhythmState, "bpm" | "subdivision" | "disabledCells" | "metronome" | "stats">;

const SUBDIVISIONS: Subdivision[] = ["binary", "ternary"];
const noneDisabled = (): Record<Subdivision, string[]> => ({ binary: [], ternary: [] });

const isCount = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;

/** localStorage can hold anything: keep only what has the right shape. */
function sanitize(raw: unknown): Partial<PersistedRhythm> {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Partial<PersistedRhythm> = {};
  if (typeof p.bpm === "number" && Number.isFinite(p.bpm)) out.bpm = clampBpm(p.bpm);
  if (p.subdivision === "binary" || p.subdivision === "ternary") out.subdivision = p.subdivision;
  if (p.disabledCells && typeof p.disabledCells === "object") {
    const raw = p.disabledCells as Record<string, unknown>;
    const disabled = noneDisabled();
    for (const sub of SUBDIVISIONS) {
      const known = cellsFor(sub).map((c) => c.id);
      const ids = Array.isArray(raw[sub]) ? (raw[sub] as unknown[]).filter((id): id is string => typeof id === "string" && known.includes(id)) : [];
      // A selection that can't make a dictation is corrupt (or from an older cell list): start over.
      disabled[sub] = isUsablePool(cellPool(sub, ids)) ? [...new Set(ids)] : [];
    }
    out.disabledCells = disabled;
  }
  if (typeof p.metronome === "boolean") out.metronome = p.metronome;
  const st = p.stats as Score | undefined;
  if (st && isCount(st.correct) && isCount(st.total) && isCount(st.streak)) out.stats = { correct: st.correct, total: st.total, streak: st.streak };
  return out;
}

export const useRhythm = create<RhythmState>()(
  persist(
    (set, get) => {
      const draw = (rng?: () => number) => {
        const { disabledCells, subdivision } = get();
        const target = randomRhythm(cellPool(subdivision, disabledCells[subdivision]), BEATS, rng);
        set({ target, answer: emptyAnswer(), cursor: 0, checked: false });
        return target;
      };
      const applyDisabled = (next: string[]) => {
        const { subdivision, disabledCells, target, checked } = get();
        if (!isUsablePool(cellPool(subdivision, next))) return false;
        // Still being answered and uses a cell that is now off: it can no longer be a fair exercise.
        const stale = !!target && !checked && target.some((id) => next.includes(id));
        set({
          disabledCells: { ...disabledCells, [subdivision]: next },
          ...(stale ? { target: null, answer: emptyAnswer(), cursor: 0 } : {}),
        });
        return true;
      };
      const addResult = (ok: boolean) =>
        set((s) => ({
          stats: {
            correct: s.stats.correct + (ok ? 1 : 0),
            total: s.stats.total + 1,
            streak: ok ? s.stats.streak + 1 : 0,
          },
        }));

      return {
        bpm: 80,
        subdivision: "binary",
        disabledCells: noneDisabled(),
        metronome: true,
        stats: emptyStats(),

        target: null,
        answer: emptyAnswer(),
        cursor: 0,
        checked: false,

        setBpm: (bpm) => set({ bpm: clampBpm(bpm) }),
        setSubdivision: (subdivision) => {
          if (subdivision === get().subdivision) return;
          set({ subdivision, target: null, answer: emptyAnswer(), cursor: 0, checked: false });
        },
        setCellsEnabled: (ids, enabled) => {
          const { subdivision, disabledCells } = get();
          const mine = cellsFor(subdivision).map((c) => c.id);
          const touched = ids.filter((id) => mine.includes(id));
          const current = disabledCells[subdivision];
          const next = mine.filter((id) => (touched.includes(id) ? !enabled : current.includes(id)));
          return applyDisabled(next);
        },
        selectCells: (ids) => {
          const { subdivision } = get();
          return applyDisabled(cellsFor(subdivision).map((c) => c.id).filter((id) => !ids.includes(id)));
        },
        setMetronome: (metronome) => set({ metronome }),

        newRhythm: draw,
        setCursor: (cursor) => {
          if (get().target && !get().checked) set({ cursor });
        },

        pick: (cellId) => {
          const { target, checked, answer, cursor } = get();
          if (!target || checked) return;
          const next = answer.slice();
          next[cursor] = cellId;
          const nextEmpty = next.findIndex((a, i) => a === null && i > cursor);
          const anyEmpty = next.findIndex((a) => a === null);
          set({ answer: next, cursor: nextEmpty >= 0 ? nextEmpty : anyEmpty >= 0 ? anyEmpty : cursor });
        },

        clear: () => set({ answer: emptyAnswer(), cursor: 0 }),

        check: () => {
          const { target, answer, checked } = get();
          if (!target || checked || answer.some((a) => a === null)) return;
          set({ checked: true });
          addResult(grade(answer, target).every(Boolean));
        },

        giveUp: (rng) => {
          if (!get().target) return null;
          addResult(false);
          return draw(rng);
        },

        resetProgress: () => set({ stats: emptyStats() }),
      };
    },
    {
      name: "burpears:rhythm",
      version: 2,
      storage: safeStorage,
      // Rehydrated by <StoreHydrator /> after mount, so server and first client render match.
      skipHydration: true,
      partialize: (s): PersistedRhythm => ({
        bpm: s.bpm,
        subdivision: s.subdivision,
        disabledCells: s.disabledCells,
        metronome: s.metronome,
        stats: s.stats,
      }),
      // Bump `version` when the persisted shape changes and convert old data here instead of dropping it.
      migrate: (persisted, version) => {
        const p = (persisted && typeof persisted === "object" ? persisted : {}) as Record<string, unknown>;
        // v1 had a single "Silencios" switch: turning it off now means disabling every rest cell.
        if (version < 2) {
          const { includeRests, ...rest } = p;
          if (includeRests === false) {
            const restIds = (sub: Subdivision) => cellsFor(sub).filter(hasRest).map((c) => c.id);
            return { ...rest, disabledCells: { binary: restIds("binary"), ternary: restIds("ternary") } } as PersistedRhythm;
          }
          return rest as unknown as PersistedRhythm;
        }
        return p as unknown as PersistedRhythm;
      },
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
    },
  ),
);
