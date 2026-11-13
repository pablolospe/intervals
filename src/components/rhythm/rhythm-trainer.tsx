"use client";
import { SuiteShell } from "@/components/suite-shell";
import { useEffect, useMemo, useRef, useState } from "react";
import { cellPool, getCell, grade, randomRhythm } from "@/lib/rhythm/cells";
import { RhythmPlayer } from "@/lib/rhythm/rhythm-player";
import { RhythmNotation } from "./rhythm-notation";

const BEATS = 4;
// Dark enough to read on the light paper surface.
const OK = "var(--accent-edge)";
const BAD = "#dc2626";
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

  /** Giving up skips to another rhythm, but counts as a miss, so it is never easier than trying. */
  const giveUp = () => {
    if (!target) return;
    setStats((st) => ({ ...st, total: st.total + 1, streak: 0 }));
    newRhythm();
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
          : "";

  return (
    <SuiteShell active="rhythm">
    <main data-theme="rhythm" className="mx-auto flex min-h-0 w-full flex-1 max-w-5xl flex-col gap-2.5 p-2.5 text-zinc-100 sm:gap-3 sm:p-4 md:overflow-hidden">
      {/* Header with Suite link, title, and live stats */}
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight text-emerald-400 sm:text-2xl">
            células rítmicas
          </h1>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs sm:px-3 sm:text-sm" aria-label={`Aciertos: ${stats.score}/${stats.total}. Racha: ${stats.streak}`}>
          <span className="text-zinc-400 text-[11px] sm:text-xs">Aciertos</span>
          <b className="tabular-nums text-zinc-100">{stats.score}/{stats.total}</b>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 text-[11px] sm:text-xs">Racha</span>
          <b className="tabular-nums text-amber-300">{stats.streak}</b>
        </div>
      </header>

      {/* Listen: one big button that turns into "Repetir" once a rhythm exists. */}
      <section className="card flex shrink-0 flex-col gap-3 p-3 sm:p-4">
        <button
          onClick={() => (target ? play(target) : newRhythm())}
          disabled={playing}
          className={`btn btn-primary w-full font-extrabold ${target ? "gap-2 py-2.5 text-base sm:py-3 sm:text-lg" : "gap-3 py-4 text-xl sm:py-5 sm:text-2xl"}`}
        >
          <span aria-hidden className={target ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}>{target && !playing ? "↻" : "▶"}</span>
          {playing ? "Sonando…" : target ? "Repetir" : "Escuchar ritmo"}
        </button>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div role="group" aria-label="Tempo" className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-1.5 py-1">
              <button
                className="chip h-7 w-7 px-0! text-xs font-bold"
                onClick={() => setBpm((b) => Math.max(BPM_MIN, b - 5))}
                disabled={bpm <= BPM_MIN}
                aria-label="Más lento"
              >
                −
              </button>
              <span className="min-w-14 sm:min-w-16 text-center text-xs font-semibold tabular-nums text-zinc-50">
                ♩ = {bpm}
              </span>
              <button
                className="chip h-7 w-7 px-0! text-xs font-bold"
                onClick={() => setBpm((b) => Math.min(BPM_MAX, b + 5))}
                disabled={bpm >= BPM_MAX}
                aria-label="Más rápido"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="chip h-8 px-3 text-xs"
                aria-pressed={includeRests}
                onClick={() => setIncludeRests((v) => !v)}
              >
                {includeRests ? "✓" : "○"} Silencios
              </button>
              <button
                className="chip h-8 px-3 text-xs"
                aria-pressed={metronome}
                onClick={() => setMetronome((v) => !v)}
              >
                {metronome ? "✓" : "○"} Metrónomo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Answer: one paper slot per beat */}
      <section className={`card relative flex min-h-52 shrink-0 flex-col justify-between p-2.5 transition-opacity sm:p-3 ${target ? "" : "pointer-events-none opacity-40"}`} aria-labelledby="answer-title">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="answer-title" className="text-xs sm:text-sm font-semibold text-zinc-100">Tu compás</h2>
          {hint && <p role="status" className={`text-xs sm:text-sm ${checked ? (allRight ? "font-semibold text-emerald-300" : "font-semibold text-red-300") : "text-zinc-300"}`}>
            {hint}
          </p>}
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {answer.map((id, i) => {
            const res = results?.[i];
            const active = canPick && i === cursor;
            const ring =
              res === true ? "ring-2 ring-emerald-400" : res === false ? "ring-2 ring-red-500" : active ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-900" : "ring-1 ring-zinc-700";
            return (
              <div key={i} className="flex min-w-0 flex-col gap-1">
                {res !== undefined && (
                  <div className="flex items-center justify-end">
                    <span aria-hidden className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold ${res ? "bg-emerald-400 text-zinc-950" : "bg-red-500 text-white"}`}>
                      {res ? "✓" : "✗"}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => canPick && setCursor(i)}
                  disabled={!target}
                  aria-label={`Tiempo ${i + 1}: ${id ? getCell(id).label : "vacío"}${res === undefined ? "" : res ? ", correcto" : ", incorrecto"}`}
                  aria-current={active || undefined}
                  className={`paper flex h-13 sm:h-16 w-full items-center justify-center px-1 transition ${ring} disabled:cursor-not-allowed disabled:opacity-70 ${
                    id ? "" : "border-2 border-dashed border-zinc-300 bg-stone-100"
                  }`}
                >
                  {id ? (
                    <div className="flex h-10 sm:h-12 w-full items-center justify-center">
                      <RhythmNotation ids={[id]} width={84} height={72} className="h-full w-auto" />
                    </div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-bold text-zinc-400">?</span>
                  )}
                </button>
                {res === false && target && (
                  <span className="truncate text-center text-[10px] sm:text-[11px] font-semibold text-emerald-400">
                    Era: {getCell(target[i]).label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-2.5 flex gap-2 border-t border-zinc-800 pt-2">
          <button onClick={check} disabled={!target || !filled} className="btn btn-accent btn-sm">
            Comprobar
          </button>
          <button onClick={clear} disabled={!answer.some(Boolean)} className="btn btn-ghost btn-sm">
            Borrar
          </button>
          <button onClick={giveUp} disabled={!target || playing} className="btn btn-ghost btn-sm ml-auto text-zinc-400">
            Me rindo
          </button>
        </div>

        {checked && target && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-3xl bg-zinc-950/90 p-3 backdrop-blur-[2px]">
            <div
              role="status"
              className={`w-full max-w-md rounded-2xl border-2 px-3 py-2 text-center ${allRight ? "border-green-400 bg-green-500/15" : "border-red-400 bg-red-500/15"}`}
            >
              <p className={`flex items-center justify-center gap-2 text-xl font-extrabold sm:text-2xl ${allRight ? "text-green-300" : "text-red-300"}`}>
                <span aria-hidden>{allRight ? "✓" : "✕"}</span>
                {allRight ? "¡Clavado!" : "Uy, casi."}
              </p>
              <p className={`text-sm ${allRight ? "text-green-100" : "text-red-100"}`}>
                {allRight ? "Ese ritmo no se te escapa." : `${results!.filter(Boolean).length} de ${BEATS} tiempos bien. Así era:`}
              </p>
            </div>
            <div className="paper w-full max-w-md px-2 py-0.5">
              <div className="flex h-12 w-full items-center justify-center sm:h-14">
                <RhythmNotation ids={target} width={340} height={72} line colors={resultColors} className="h-full w-auto max-w-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={newRhythm} disabled={playing} className="btn btn-primary px-5 py-2.5 text-base font-bold">
                <span aria-hidden>▶</span> Otro ritmo
              </button>
              <button onClick={() => play(target)} disabled={playing} className="btn btn-ghost px-4 py-2.5 text-base font-bold">
                <span aria-hidden>↻</span> Repetir
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Palette */}
      <section className={`card shrink-0 p-2 transition-opacity sm:p-2.5 ${target ? "" : "opacity-40"}`} aria-labelledby="palette-title">
        <h2 id="palette-title" className="mb-1.5 text-xs font-semibold text-zinc-200">
          Células rítmicas
        </h2>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2">
          {pool.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              disabled={!canPick}
              title={c.label}
              className="paper group flex flex-col items-center gap-0.5 p-1 pb-1.5 ring-1 ring-zinc-300 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:ring-1 disabled:hover:ring-zinc-300"
            >
              <div className="flex h-10 sm:h-11 w-full items-center justify-center">
                <RhythmNotation ids={[c.id]} width={84} height={72} className="h-full w-auto" />
              </div>
              <span className="truncate max-w-full px-0.5 text-center text-[9.5px] sm:text-[10px] font-medium leading-none text-zinc-600">{c.label}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
    </SuiteShell>
  );
}
