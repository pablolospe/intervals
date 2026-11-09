"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cellPool, getCell, grade, randomRhythm } from "@/lib/rhythm/cells";
import { RhythmPlayer } from "@/lib/rhythm/rhythm-player";
import { RhythmNotation } from "./rhythm-notation";

const BEATS = 4;
// Dark enough to read on the light paper surface.
const OK = "#047857";
const BAD = "#dc2626";
const OK_ONLY = [OK];
const empty = () => Array<string | null>(BEATS).fill(null);
const BPM_MIN = 50;
const BPM_MAX = 130;

export function RhythmTrainer() {
  const [target, setTarget] = useState<string[] | null>(null);
  const [answer, setAnswer] = useState<(string | null)[]>(empty);
  const [cursor, setCursor] = useState(0);
  const [checked, setChecked] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [includeRests, setIncludeRests] = useState(true);
  const [metronome, setMetronome] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [stats, setStats] = useState({ score: 0, total: 0, streak: 0 });
  const player = useRef<RhythmPlayer | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      player.current?.close();
    },
    [],
  );

  const pool = useMemo(() => cellPool(includeRests), [includeRests]);
  const results = useMemo(() => (checked && target ? grade(answer, target) : null), [checked, answer, target]);
  const resultColors = useMemo(() => results?.map((r) => (r ? OK : BAD)), [results]);
  const allRight = results?.every(Boolean) ?? false;
  const filled = answer.every((a) => a !== null);
  const canPick = !!target && !checked;

  const play = (ids: string[]) => {
    player.current ??= new RhythmPlayer();
    window.clearTimeout(timer.current);
    setPlaying(true);
    const secs = player.current.play(ids, { bpm, countIn: true, metronome });
    timer.current = window.setTimeout(() => setPlaying(false), secs * 1000);
  };

  const newRhythm = () => {
    const ids = randomRhythm(pool, BEATS);
    setTarget(ids);
    setAnswer(empty());
    setCursor(0);
    setChecked(false);
    play(ids);
  };

  const pick = (id: string) => {
    if (!canPick) return;
    const next = answer.slice();
    next[cursor] = id;
    setAnswer(next);
    const nextEmpty = next.findIndex((a, i) => a === null && i > cursor);
    const anyEmpty = next.findIndex((a) => a === null);
    setCursor(nextEmpty >= 0 ? nextEmpty : anyEmpty >= 0 ? anyEmpty : cursor);
  };

  const check = () => {
    if (!target) return;
    const ok = grade(answer, target).every(Boolean);
    setChecked(true);
    setStats((s) => ({ score: s.score + (ok ? 1 : 0), total: s.total + 1, streak: ok ? s.streak + 1 : 0 }));
  };

  const clear = () => {
    setAnswer(empty());
    setCursor(0);
  };

  const hint = playing
    ? "Sonando… contá los 4 clicks de entrada y escuchá."
    : !target
      ? "Apretá “Escuchar ritmo” para empezar."
      : checked
        ? allRight
          ? "¡Clavado! Ese ritmo no se te escapa."
          : `${results!.filter(Boolean).length} de ${BEATS}. Escuchalo de nuevo y comparalo.`
        : filled
          ? "Todo completo. ¿Comprobamos?"
          : `Elegí la célula del tiempo ${cursor + 1}.`;

  return (
    <div className="flex flex-col gap-4">
      {/* Transport + settings */}
      <section className="card flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <button onClick={newRhythm} disabled={playing} className="btn btn-primary">
          <span aria-hidden>▶</span> {target ? "Otro ritmo" : "Escuchar ritmo"}
        </button>
        <button onClick={() => target && play(target)} disabled={!target || playing} className="btn btn-ghost">
          <span aria-hidden>↻</span> Repetir
        </button>

        <div role="group" aria-label="Tempo" className="flex items-center gap-1.5">
          <button className="chip h-8 w-8 !px-0 text-base" onClick={() => setBpm((b) => Math.max(BPM_MIN, b - 5))} disabled={bpm <= BPM_MIN} aria-label="Más lento">
            −
          </button>
          <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums text-zinc-50">♩ = {bpm}</span>
          <button className="chip h-8 w-8 !px-0 text-base" onClick={() => setBpm((b) => Math.min(BPM_MAX, b + 5))} disabled={bpm >= BPM_MAX} aria-label="Más rápido">
            +
          </button>
        </div>

        <div className="flex gap-1.5">
          <button className="chip h-8" aria-pressed={includeRests} onClick={() => setIncludeRests((v) => !v)}>
            {includeRests ? "✓" : "○"} Silencios
          </button>
          <button className="chip h-8" aria-pressed={metronome} onClick={() => setMetronome((v) => !v)}>
            {metronome ? "✓" : "○"} Metrónomo
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm" aria-label={`Aciertos ${stats.score} de ${stats.total}. Racha ${stats.streak}`}>
          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-zinc-300">
            Aciertos <b className="tabular-nums text-zinc-50">{stats.score}/{stats.total}</b>
          </span>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-amber-200">
            Racha <b className="tabular-nums text-amber-100">{stats.streak}</b>
          </span>
        </div>
      </section>

      {/* Answer: one paper slot per beat */}
      <section className="card p-3 sm:p-4" aria-labelledby="answer-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="answer-title" className="text-sm font-semibold text-zinc-100">Tu compás</h2>
          <p role="status" className={`text-sm ${checked ? (allRight ? "font-semibold text-emerald-300" : "font-semibold text-red-300") : "text-zinc-300"}`}>
            {hint}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {answer.map((id, i) => {
            const res = results?.[i];
            const active = canPick && i === cursor;
            const ring =
              res === true ? "ring-4 ring-emerald-400" : res === false ? "ring-4 ring-red-500" : active ? "ring-4 ring-emerald-400 ring-offset-2 ring-offset-zinc-900" : "ring-1 ring-zinc-700";
            return (
              <div key={i} className="flex min-w-0 flex-col gap-1.5">
                <span className={`flex items-center justify-between text-xs font-medium ${active ? "text-emerald-300" : "text-zinc-400"}`}>
                  Tiempo {i + 1}
                  {res !== undefined && (
                    <span aria-hidden className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${res ? "bg-emerald-400 text-zinc-950" : "bg-red-500 text-white"}`}>
                      {res ? "✓" : "✗"}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => canPick && setCursor(i)}
                  disabled={!target}
                  aria-label={`Tiempo ${i + 1}: ${id ? getCell(id).label : "vacío"}${res === undefined ? "" : res ? ", correcto" : ", incorrecto"}`}
                  aria-current={active || undefined}
                  className={`paper flex aspect-[3/2] w-full items-center justify-center px-1 transition ${ring} disabled:cursor-not-allowed disabled:opacity-70 ${
                    id ? "" : "border-2 border-dashed border-zinc-300 bg-stone-100"
                  }`}
                >
                  {id ? (
                    <RhythmNotation ids={[id]} width={120} height={80} />
                  ) : (
                    <span className="text-3xl font-bold text-zinc-400">?</span>
                  )}
                </button>
                {res === false && target && (
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-emerald-400/50 bg-emerald-400/10 p-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">Era</span>
                    <div className="paper w-full px-1">
                      <RhythmNotation ids={[target[i]]} width={100} height={76} colors={OK_ONLY} />
                    </div>
                    <span className="text-center text-xs leading-tight text-emerald-100">{getCell(target[i]).label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {checked && target ? (
          <div className="mt-4 flex flex-col gap-3">
            <div className="paper px-3 py-1">
              <RhythmNotation ids={target} width={360} height={84} line colors={resultColors} className="mx-auto max-w-md" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={newRhythm} disabled={playing} className="btn btn-primary">
                <span aria-hidden>▶</span> Otro ritmo
              </button>
              <button onClick={() => play(target)} disabled={playing} className="btn btn-ghost">
                <span aria-hidden>↻</span> Escuchar la solución
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={check} disabled={!target || !filled} className="btn btn-accent">
              Comprobar
            </button>
            <button onClick={clear} disabled={!answer.some(Boolean)} className="btn btn-ghost">
              Borrar
            </button>
          </div>
        )}
      </section>

      {/* Palette */}
      <section aria-labelledby="palette-title">
        <h2 id="palette-title" className="mb-2 text-sm font-semibold text-zinc-100">
          Células rítmicas
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {pool.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              disabled={!canPick}
              title={c.label}
              className="paper group flex flex-col items-center gap-0.5 px-2 pb-2 pt-1 ring-1 ring-zinc-300 transition hover:-translate-y-0.5 hover:ring-4 hover:ring-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:ring-1 disabled:hover:ring-zinc-300"
            >
              <RhythmNotation ids={[c.id]} width={100} height={76} />
              <span className="text-center text-xs font-medium leading-tight text-zinc-700">{c.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
