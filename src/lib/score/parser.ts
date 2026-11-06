import type { Accidental, DurationCode, NoteEvent, RestEvent, ScoreEvent, Step, TupletEvent } from "./types";

/**
 * Rule-based parser for Spanish musical dictation, e.g. "ahora quiero un tresillo de negras: do mi sol".
 * Pure and deterministic: text + context in, actions + new context out.
 * An LLM fallback can later sit in front of this and emit the same `Action`s.
 */

export type Action =
  | { type: "append"; event: ScoreEvent }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "setMeasures"; count: number; relative: boolean };

export interface ParserContext {
  /** Duration applied to notes until another one is spoken. */
  duration: DurationCode;
  /** Diatonic index (octave * 7 + step) of the last note, used to pick the closest octave. */
  lastIndex: number | null;
}

export const initialContext = (): ParserContext => ({ duration: "q", lastIndex: null });

export interface ParseResult {
  actions: Action[];
  context: ParserContext;
  errors: string[];
}

const STEP_BY_NAME: Record<string, Step> = { do: "c", re: "d", mi: "e", fa: "f", sol: "g", la: "a", si: "b" };
const STEP_INDEX: Record<Step, number> = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };

const DURATION_BY_WORD: Record<string, DurationCode> = {
  redonda: "w",
  blanca: "h",
  negra: "q",
  corchea: "8",
  semicorchea: "16",
};

const TUPLETS: Record<string, { actual: number; normal: number }> = {
  dosillo: { actual: 2, normal: 3 },
  tresillo: { actual: 3, normal: 2 },
  cuatrillo: { actual: 4, normal: 3 },
  cinquillo: { actual: 5, normal: 4 },
  seisillo: { actual: 6, normal: 4 },
  sextillo: { actual: 6, normal: 4 },
};

const NUMBER_WORDS: Record<string, number> = {
  cero: 0, uno: 1, una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16,
};

const FILLER = new Set([
  "ahora", "quiero", "queres", "escribi", "escribime", "escribir", "agrega", "agregar", "agregame", "pone", "ponele",
  "poner", "y", "de", "con", "nota", "notas", "por", "favor", "otra", "otro", "un", "una", "unos", "unas", "el", "los",
  "las", "luego", "despues", "despues.", "entonces", "dale", "che",
]);

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[:;,.!?¿¡\-–—"“”()]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const singular = (w: string) => (w.endsWith("s") && w.length > 3 && !(w in STEP_BY_NAME) ? w.slice(0, -1) : w);

const NOTE_TOKEN = /^(do|re|mi|fa|sol|la|si)([#b]?)(\d)?$/;

/** Pick the octave that puts `step` closest (diatonically) to the previous note. */
export function closestOctave(step: Step, lastIndex: number | null): number {
  if (lastIndex === null) return 4;
  const lastOctave = Math.floor(lastIndex / 7);
  let best = lastOctave;
  let bestDist = Infinity;
  for (const o of [lastOctave - 1, lastOctave, lastOctave + 1]) {
    const dist = Math.abs(o * 7 + STEP_INDEX[step] - lastIndex);
    if (dist < bestDist) {
      best = o;
      bestDist = dist;
    }
  }
  return best;
}

export function parseCommand(text: string, context: ParserContext): ParseResult {
  const tokens = normalize(text);
  const ctx: ParserContext = { ...context };
  const actions: Action[] = [];
  const errors: string[] = [];

  let openTuplet: TupletEvent | null = null;
  let lastNote: NoteEvent | null = null;
  let explicitOctave: number | null = null;

  const emit = (event: NoteEvent | RestEvent) => {
    if (openTuplet) {
      openTuplet.items.push(event);
      if (openTuplet.items.length === openTuplet.actual) {
        actions.push({ type: "append", event: openTuplet });
        openTuplet = null;
      }
    } else {
      actions.push({ type: "append", event });
    }
  };

  const addNote = (name: string, accidental: Accidental, octave: number | null) => {
    const step = STEP_BY_NAME[name];
    const oct = octave ?? explicitOctave ?? closestOctave(step, ctx.lastIndex);
    explicitOctave = null;
    ctx.lastIndex = oct * 7 + STEP_INDEX[step];
    lastNote = { kind: "note", pitch: { step, accidental, octave: oct }, duration: ctx.duration };
    emit(lastNote);
  };

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const sing = singular(tok);

    // "4 compases" sets the total; "agregá 2 compases" adds. Checked before fillers because "un"/"una" are numbers here.
    const count = /^\d+$/.test(tok) ? Number(tok) : NUMBER_WORDS[tok];
    if (count !== undefined && tokens[i + 1]?.startsWith("compas")) {
      const relative = tokens.slice(0, i).some((t) => ["agrega", "agregar", "agregame", "suma", "sumar", "anade", "anadir"].includes(t));
      actions.push({ type: "setMeasures", count, relative });
      i++;
      continue;
    }

    if (FILLER.has(tok) && !(tok in STEP_BY_NAME)) continue;

    // Commands
    if (["deshacer", "undo", "borra", "borrar", "elimina", "eliminar", "quita", "quitar"].includes(tok)) {
      const rest = tokens.slice(i + 1);
      if (rest.some((t) => ["todo", "todos", "tudo"].includes(t))) actions.push({ type: "clear" });
      else actions.push({ type: "undo" });
      return finish();
    }
    if (["limpiar", "limpia", "reiniciar", "reinicia"].includes(tok)) {
      actions.push({ type: "clear" });
      return finish();
    }

    // Durations
    if (sing in DURATION_BY_WORD) {
      ctx.duration = DURATION_BY_WORD[sing];
      continue;
    }

    // Tuplets
    if (sing in TUPLETS) {
      if (openTuplet) {
        errors.push("Cerré el grupo anterior sin terminar.");
        openTuplet = null;
      }
      openTuplet = { kind: "tuplet", ...TUPLETS[sing], items: [] };
      continue;
    }

    // Rests: "silencio de negra" or "silencio" (uses current duration)
    if (tok === "silencio" || tok === "pausa") {
      let j = i + 1;
      while (j < tokens.length && FILLER.has(tokens[j])) j++;
      const next = tokens[j] ? singular(tokens[j]) : "";
      if (next in DURATION_BY_WORD) {
        ctx.duration = DURATION_BY_WORD[next];
        i = j;
      }
      emit({ kind: "rest", duration: ctx.duration });
      continue;
    }

    // Accidental words apply to the previous note
    if (tok === "sostenido" || tok === "bemol") {
      const n = lastNote as NoteEvent | null;
      if (n) n.pitch.accidental = tok === "sostenido" ? "#" : "b";
      else errors.push(`"${tok}" sin nota previa.`);
      continue;
    }

    // Explicit octave: "octava 5" / "octava cinco"
    if (tok === "octava") {
      const arg = tokens[i + 1];
      const value = arg === undefined ? NaN : /^\d$/.test(arg) ? Number(arg) : (NUMBER_WORDS[arg] ?? NaN);
      if (Number.isNaN(value)) errors.push('Después de "octava" va un número.');
      else {
        explicitOctave = value;
        i++;
      }
      continue;
    }

    const m = NOTE_TOKEN.exec(tok);
    if (m) {
      addNote(m[1], (m[2] as Accidental) || "", m[3] !== undefined ? Number(m[3]) : null);
      continue;
    }

    errors.push(`No entendí "${tok}".`);
  }

  return finish();

  function finish(): ParseResult {
    const t = openTuplet as TupletEvent | null;
    if (t) errors.push(`Grupo incompleto: faltan ${t.actual - t.items.length} nota(s).`);
    return { actions, context: ctx, errors };
  }
}
