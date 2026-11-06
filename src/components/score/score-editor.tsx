"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { SynthEngine } from "@/lib/audio/synth-engine";
import * as ed from "@/lib/score/edit";
import { applyEdit, initialEditor, setMeasureCount, submitText, undo, usedMeasures, type EditorState } from "@/lib/score/editor";
import { toPlaySteps } from "@/lib/score/layout";
import { ENGINES, type EngineId } from "@/lib/speech/types";
import { MAX_MEASURES, pitchToMidi, type DurationCode, type Score } from "@/lib/score/types";
import { ScoreView } from "./score-view";

const EXAMPLES = ["un tresillo de negras: do mi sol", "corchea re fa la do", "silencio de negra", "agregá 2 compases", "deshacer"];
const DURATIONS: { code: DurationCode; label: string }[] = [
  { code: "w", label: "Redonda" },
  { code: "h", label: "Blanca" },
  { code: "q", label: "Negra" },
  { code: "8", label: "Corchea" },
  { code: "16", label: "Semicorchea" },
];

const chip =
  "rounded-lg border border-zinc-700 bg-zinc-900/60 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 disabled:opacity-40";

export function ScoreEditor() {
  const [state, setState] = useState<EditorState>(initialEditor);
  const [selected, setSelected] = useState<ed.Selection | null>(null);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [width, setWidth] = useState(800);
  const [engine, setEngine] = useState<EngineId>("web-speech");
  const [heard, setHeard] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<SynthEngine | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)));
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const audio = () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      synthRef.current = new SynthEngine(ctxRef.current);
    }
    void ctxRef.current.resume();
    return { ctx: ctxRef.current, synth: synthRef.current! };
  };

  /** Short audition of the note you just selected/moved. */
  const preview = useCallback((score: Score, sel: ed.Selection | null) => {
    const leaf = sel && ed.getLeaf(score, sel);
    if (!leaf || leaf.kind !== "note") return;
    const { ctx, synth } = audio();
    synth.playNote(pitchToMidi(leaf.pitch), ctx.currentTime + 0.02, 0.5);
  }, []);

  const select = useCallback(
    (sel: ed.Selection | null) => {
      setSelected(sel);
      preview(state.score, sel);
    },
    [state.score, preview],
  );

  const submit = (value: string) => {
    if (!value.trim()) return;
    const r = submitText(state, value);
    setState(r.state);
    setErrors(r.errors);
    setText("");
    if (r.state.score !== state.score) setSelected(null);
  };

  const voice = useVoiceInput(engine, (spoken) => {
    setHeard(spoken);
    submit(spoken);
  });

  /** Run a manual edit on the selection; keeps selection and previews the result. */
  const edit = useCallback(
    (fn: (s: Score, sel: ed.Selection) => Score) => {
      if (!selected) return;
      const next = fn(state.score, selected);
      const r = applyEdit(state, next);
      setErrors(r.error ? [r.error] : []);
      if (r.error || r.state === state) return;
      setState(r.state);
      preview(next, selected);
    },
    [selected, state, preview],
  );

  const remove = useCallback(() => {
    if (!selected) return;
    const { score, selection } = ed.deleteLeaf(state.score, selected);
    const r = applyEdit(state, score);
    setState(r.state);
    setSelected(selection);
    setErrors([]);
  }, [selected, state]);

  const doUndo = useCallback(() => {
    setState((s) => undo(s));
    setSelected(null);
    setErrors([]);
  }, []);

  const move = useCallback(
    (dir: 1 | -1) => {
      const all = ed.leafSelections(state.score);
      if (!all.length) return;
      const idx = selected ? all.findIndex((s) => ed.sameSelection(s, selected)) : -1;
      const next = all[Math.min(all.length - 1, Math.max(0, idx === -1 ? (dir === 1 ? 0 : all.length - 1) : idx + dir))];
      select(next);
    },
    [state.score, selected, select],
  );

  // Keyboard: only when not typing in the text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        doUndo();
      } else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "Escape") setSelected(null);
      else if (selected && e.key === "ArrowUp") {
        e.preventDefault();
        edit((s, sel) => ed.transpose(s, sel, e.shiftKey ? 7 : 1));
      } else if (selected && e.key === "ArrowDown") {
        e.preventDefault();
        edit((s, sel) => ed.transpose(s, sel, e.shiftKey ? -7 : -1));
      } else if (selected && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        remove();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, edit, remove, move, doUndo]);

  const play = () => {
    const { ctx, synth } = audio();
    const beat = 60 / 90;
    let t = ctx.currentTime + 0.05;
    for (const s of toPlaySteps(state.score)) {
      if (s.midi !== null) synth.playNote(s.midi, t, s.beats * beat * 0.92);
      t += s.beats * beat;
    }
  };

  const changeMeasures = (count: number) => {
    const r = setMeasureCount(state, count);
    setState(r.state);
    setErrors(r.error ? [r.error] : []);
  };

  const leaf = selected ? ed.getLeaf(state.score, selected) : null;
  const isNote = leaf?.kind === "note";
  const hasMusic = state.score.events.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-300">
        <div className="flex items-center gap-2" role="group" aria-label="Cantidad de compases">
          <span>Compases</span>
          <button className={chip} onClick={() => changeMeasures(state.score.measures - 1)} disabled={state.score.measures <= Math.max(1, usedMeasures(state.score))} aria-label="Quitar un compás">−</button>
          <span className="w-6 text-center font-semibold tabular-nums">{state.score.measures}</span>
          <button className={chip} onClick={() => changeMeasures(state.score.measures + 1)} disabled={state.score.measures >= MAX_MEASURES} aria-label="Agregar un compás">+</button>
        </div>
        <button className={chip} onClick={doUndo} disabled={!state.history.length}>↶ Deshacer</button>
      </div>

      <div ref={wrap} className="min-h-40 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2">
        <ScoreView score={state.score} width={width} selected={selected} onSelect={select} />
        {!hasMusic && (
          <p className="px-4 pb-3 text-sm text-zinc-500">Vacía. Escribí abajo, por ejemplo: “{EXAMPLES[0]}”.</p>
        )}
      </div>

      <div
        className="flex min-h-[3.25rem] flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2"
        role="toolbar"
        aria-label="Editar nota seleccionada"
      >
        {!leaf ? (
          <span className="text-xs text-zinc-500">Tocá una nota para editarla (← → para moverte, ↑ ↓ cambian la altura, Supr borra).</span>
        ) : (
          <>
            <button className={chip} disabled={!isNote} onClick={() => edit((s, sel) => ed.transpose(s, sel, 1))}>↑ Subir</button>
            <button className={chip} disabled={!isNote} onClick={() => edit((s, sel) => ed.transpose(s, sel, -1))}>↓ Bajar</button>
            <button className={chip} disabled={!isNote} onClick={() => edit((s, sel) => ed.transpose(s, sel, 7))}>8va ↑</button>
            <button className={chip} disabled={!isNote} onClick={() => edit((s, sel) => ed.transpose(s, sel, -7))}>8va ↓</button>
            <button className={chip} disabled={!isNote} onClick={() => edit(ed.cycleAccidental)}>♮ ♯ ♭</button>
            <span className="mx-1 h-4 w-px bg-zinc-700" />
            {DURATIONS.map((d) => (
              <button
                key={d.code}
                className={`${chip} ${leaf.duration === d.code ? "!border-emerald-400 text-emerald-300" : ""}`}
                onClick={() => edit((s, sel) => ed.setDuration(s, sel, d.code))}
              >
                {d.label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-zinc-700" />
            <button className={chip} disabled={!isNote} onClick={() => edit(ed.toRest)}>Silencio</button>
            <button className={`${chip} hover:!border-red-400`} onClick={remove}>Borrar</button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <button
          type="button"
          onClick={() => void voice.toggle()}
          disabled={voice.status.kind === "loading" || voice.status.kind === "transcribing"}
          aria-pressed={voice.status.kind === "listening"}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
            voice.status.kind === "listening" ? "animate-pulse bg-red-500 text-white" : "bg-violet-400 text-zinc-950"
          }`}
        >
          {voice.status.kind === "listening" ? "■ Listo" : "🎤 Hablar"}
        </button>
        <label className="flex items-center gap-1.5">
          Motor
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value as EngineId)}
            disabled={voice.status.kind !== "idle"}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
          >
            {ENGINES.map((en) => (
              <option key={en.id} value={en.id}>{en.label}</option>
            ))}
          </select>
        </label>
        <span aria-live="polite">
          {voice.status.kind === "listening" && "Escuchando… tocá “Listo” cuando termines."}
          {voice.status.kind === "transcribing" && "Transcribiendo…"}
          {voice.status.kind === "loading" &&
            `Descargando el modelo${voice.status.progress !== null ? ` (${Math.round(voice.status.progress * 100)}%)` : "…"} — solo la primera vez.`}
          {voice.status.kind === "idle" && ENGINES.find((en) => en.id === engine)?.hint}
        </span>
      </div>
      {heard && <p className="text-sm text-zinc-300">Escuché: “{heard}”</p>}
      {voice.error && <p className="text-sm text-amber-300">{voice.error}</p>}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ahora quiero un tresillo de negras: do mi sol"
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-400"
          autoFocus
        />
        <button className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950">Escribir</button>
        <button
          type="button"
          onClick={play}
          disabled={!hasMusic}
          className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 disabled:opacity-40"
        >
          ▶ Escuchar
        </button>
      </form>

      {errors.length > 0 && <p className="text-sm text-amber-300">{errors.join(" ")}</p>}

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => submit(ex)} className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-600">
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
