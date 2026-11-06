import * as edit from "./edit";
import { toMeasures } from "./layout";
import { initialContext, parseCommand, type ParserContext } from "./parser";
import { emptyScore, MAX_MEASURES, pitchToMidi, type Score } from "./types";

/** Pure editor state: score + parser context + undo stack. Each submitted text / manual edit is one undo step. */
export interface EditorState {
  score: Score;
  context: ParserContext;
  history: { score: Score; context: ParserContext }[];
}

export const initialEditor = (): EditorState => ({ score: emptyScore(), context: initialContext(), history: [] });

export const usedMeasures = (score: Score) => toMeasures(score).length;

/** After manual edits, dictation should continue from the last note actually on the page. */
function contextFromScore(score: Score, base: ParserContext): ParserContext {
  const leaves = score.events.flatMap((e) => (e.kind === "tuplet" ? e.items : [e]));
  const last = [...leaves].reverse().find((l) => l.kind === "note");
  if (!last || last.kind !== "note") return { ...base, lastIndex: null };
  const { step, octave } = last.pitch;
  return { ...base, lastIndex: octave * 7 + "cdefgab".indexOf(step) };
}

const overflow = (score: Score) =>
  `No entra: la partitura tiene ${score.measures} compases. Agregá compases o borrá algo.`;

export function submitText(state: EditorState, text: string): { state: EditorState; errors: string[] } {
  const { actions, context, errors } = parseCommand(text, state.context);
  if (actions.length === 0) return { state, errors };

  let score = state.score;
  let ctx = context;
  const snapshot = { score: state.score, context: state.context };

  for (const a of actions) {
    if (a.type === "append") score = { ...score, events: [...score.events, a.event] };
    else if (a.type === "clear") {
      score = emptyScore(score.measures);
      ctx = initialContext();
    } else if (a.type === "setMeasures") {
      const wanted = a.relative ? score.measures + a.count : a.count;
      const min = Math.max(1, usedMeasures(score));
      const next = Math.min(MAX_MEASURES, Math.max(min, wanted));
      if (next !== wanted) errors.push(wanted < min ? `Ya hay música en ${min} compases.` : `El máximo es ${MAX_MEASURES} compases.`);
      score = { ...score, measures: next };
    } else if (a.type === "undo") {
      return { state: undo(state), errors };
    }
  }
  if (usedMeasures(score) > score.measures) return { state, errors: [...errors, overflow(score)] };
  return { state: { score, context: ctx, history: [...state.history, snapshot] }, errors };
}

export function undo(state: EditorState): EditorState {
  const prev = state.history[state.history.length - 1];
  return prev ? { score: prev.score, context: prev.context, history: state.history.slice(0, -1) } : state;
}

/** Commit a manually edited score (one undo step), enforcing the measure limit. */
export function applyEdit(state: EditorState, score: Score): { state: EditorState; error?: string } {
  if (score === state.score) return { state };
  if (usedMeasures(score) > score.measures) return { state, error: overflow(score) };
  return {
    state: {
      score,
      context: contextFromScore(score, state.context),
      history: [...state.history, { score: state.score, context: state.context }],
    },
  };
}

export function setMeasureCount(state: EditorState, count: number): { state: EditorState; error?: string } {
  const min = Math.max(1, usedMeasures(state.score));
  const next = Math.min(MAX_MEASURES, Math.max(min, count));
  const r = applyEdit(state, { ...state.score, measures: next });
  return count < min ? { ...r, error: `Ya hay música en ${min} compases.` } : r;
}

export { edit, pitchToMidi };
