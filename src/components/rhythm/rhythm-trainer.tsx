"use client";
import { SuiteShell } from "@/components/suite-shell";
import { useEffect, useMemo, useRef, useState } from "react";
import { cellPool, cellsFor, getCell, grade, type Subdivision } from "@/lib/rhythm/cells";
import { RhythmPlayer } from "@/lib/rhythm/rhythm-player";
import { BEATS, BPM_MAX, BPM_MIN, useRhythm } from "@/store/rhythm-store";
import { useHydrated } from "../store-hydrator";
import { CellPickerDialog } from "./cell-picker-dialog";
import { RhythmNotation } from "./rhythm-notation";

// Dark enough to read on the light paper surface.
const OK = "var(--accent-edge)";
const BAD = "#dc2626";

export function RhythmTrainer() {
  // Settings, progress and the exercise in progress live in the store so they survive navigating away.
  const { target, answer, cursor, checked, bpm, subdivision, disabledCells, metronome, stats } = useRhythm();
  const { setBpm, setSubdivision, setMetronome, setCursor, pick, clear, check } = useRhythm.getState();
  const hydrated = useHydrated();
  const [playing, setPlaying] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const answerCard = useRef<HTMLElement>(null);
  const player = useRef<RhythmPlayer | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      // The route may be hidden (not unmounted) by <Activity>; drop the closed player so it's rebuilt.
      window.clearTimeout(timer.current);
      player.current?.close();
      player.current = null;
      setPlaying(false);
    },
    [],
  );

  const disabled = disabledCells[subdivision];
  const pool = useMemo(() => cellPool(subdivision, disabled), [subdivision, disabled]);
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

  const stop = () => {
    window.clearTimeout(timer.current);
    player.current?.stop();
    setPlaying(false);
  };

  const switchSubdivision = (next: Subdivision) => {
    if (next === subdivision) return;
    stop();
    setSubdivision(next); // also drops the current exercise
  };

  const newRhythm = () => play(useRhythm.getState().newRhythm());

  /** Checks the answer and brings the result into view: on phones the card may be scrolled off-screen. */
  const checkAnswer = () => {
    check();
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => answerCard.current?.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" }));
  };

  /** Giving up skips to another rhythm, but counts as a miss, so it is never easier than trying. */
  const giveUp = () => {
    const ids = useRhythm.getState().giveUp();
    if (ids) play(ids);
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

        <div className={`flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs transition-opacity sm:px-3 sm:text-sm ${hydrated ? "" : "opacity-40"}`} aria-label={`Aciertos: ${stats.correct}/${stats.total}. Racha: ${stats.streak}`}>
          <span className="text-zinc-400 text-[11px] sm:text-xs">Aciertos</span>
          <b className="tabular-nums text-zinc-100">{stats.correct}/{stats.total}</b>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 text-[11px] sm:text-xs">Racha</span>
          <b className="tabular-nums text-amber-300">{stats.streak}</b>
        </div>
      </header>

      {/* Listen: one big button that turns into "Repetir" once a rhythm exists, or "Detener" while playing. */}
      <section className="card flex shrink-0 flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
        <button
          onClick={() => (playing ? stop() : target ? play(target) : newRhythm())}
          className={`btn h-11 w-full gap-2 text-base font-extrabold sm:h-12 sm:w-auto sm:min-w-56 sm:self-center sm:px-8 xl:shrink-0 ${
            playing ? "btn-danger" : "btn-primary"
          }`}
        >
          <span aria-hidden>{playing ? "■" : target ? "↻" : "▶"}</span>
          {playing ? "Detener" : target ? "Repetir" : "Escuchar ritmo"}
        </button>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 xl:justify-end">
          <div
            role="radiogroup"
            aria-label="Subdivisión"
            className="grid w-full grid-cols-2 rounded-full border border-zinc-800 bg-zinc-950/70 p-0.5 text-xs font-semibold sm:inline-flex sm:w-auto"
          >
            {([
              ["binary", "Binaria", "(4/4)"],
              ["ternary", "Ternaria", "(12/8)"],
            ] as const).map(([mode, label, meter]) => {
              const on = subdivision === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => switchSubdivision(mode)}
                  className={`rounded-full px-3 py-1.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:py-1 ${
                    on ? "bg-emerald-400 text-zinc-950 shadow-sm" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  {label} <span className={on ? "text-zinc-900/75" : "text-zinc-400"}>{meter}</span>
                </button>
              );
            })}
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-1.5 sm:w-auto sm:justify-center sm:gap-2.5">
            <div role="group" aria-label="Tempo" className="flex items-center gap-0.5 rounded-full border border-zinc-800 bg-zinc-950/70 p-0.5">
              <button
                className="chip h-7 w-7 border-zinc-700/80 px-0! text-xs font-bold"
                onClick={() => setBpm(bpm - 5)}
                disabled={bpm <= BPM_MIN}
                aria-label="Más lento"
              >
                −
              </button>
              <span className="min-w-12 px-1 text-center text-xs font-semibold tabular-nums text-zinc-100 sm:min-w-14">
                {subdivision === "ternary" ? "♩." : "♩"} {bpm}
              </span>
              <button
                className="chip h-7 w-7 border-zinc-700/80 px-0! text-xs font-bold"
                onClick={() => setBpm(bpm + 5)}
                disabled={bpm >= BPM_MAX}
                aria-label="Más rápido"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="chip h-8 gap-1.5 px-2.5 text-xs sm:px-3" onClick={() => setPickerOpen(true)} aria-haspopup="dialog">
                <span>Elegir células</span>
                <span className="rounded-full bg-zinc-950/60 px-1.5 text-[10px] tabular-nums text-emerald-300">
                  {pool.length}/{cellsFor(subdivision).length}
                </span>
              </button>
              <button
                className="chip h-8 gap-1.5 px-2.5 text-xs sm:px-3"
                aria-pressed={metronome}
                onClick={() => setMetronome(!metronome)}
              >
                <span aria-hidden className="text-[11px]">{metronome ? "✓" : "○"}</span>
                <span>Metrónomo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Answer: one paper slot per beat */}
      <section ref={answerCard} className={`card relative flex shrink-0 flex-col justify-between gap-2.5 p-2.5 transition-opacity sm:min-h-52 sm:p-3 ${checked ? "min-h-56" : ""} ${target ? "" : "pointer-events-none opacity-40"}`} aria-labelledby="answer-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <h2 id="answer-title" className="text-xs font-semibold text-zinc-100 sm:text-sm">Tu compás</h2>
          {hint && <p role="status" className={`text-xs sm:text-sm ${playing ? "hidden sm:block " : ""}${checked ? (allRight ? "font-semibold text-emerald-300" : "font-semibold text-red-300") : "text-zinc-300"}`}>
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
          {/* Desktop: big primary action in the card. On phones it moves to the sticky bar under the palette. */}
          <button
            onClick={checkAnswer}
            disabled={!target || !filled}
            className={`btn btn-accent hidden h-11 min-w-44 flex-1 text-base font-extrabold md:inline-flex ${filled && canPick ? "anim-pop" : ""}`}
          >
            <span aria-hidden>✓</span> Comprobar
          </button>
          <button onClick={clear} disabled={!answer.some(Boolean)} className="btn btn-ghost btn-sm">
            Borrar
          </button>
          <button onClick={giveUp} disabled={!target || playing} className="btn btn-ghost btn-sm ml-auto text-zinc-400 md:ml-0">
            Nuevo ritmo
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
            <button onClick={newRhythm} disabled={playing} className="btn btn-primary px-5 py-2.5 text-base font-bold max-md:hidden">
              <span aria-hidden>▶</span> Otro ritmo
            </button>
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

      {/* Phones: the main action floats at the bottom, within thumb reach: "Comprobar" once the measure is complete, then "Otro ritmo". */}
      {target && (checked || filled) && (
        <>
        {/* Room at the end of the page so the fixed bar never covers the last row of cells. */}
        <div aria-hidden className="h-20 shrink-0 md:hidden" />
        <div className="anim-pop fixed inset-x-0 bottom-0 z-40 bg-linear-to-t from-[#0b0c10] from-70% to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6 md:hidden">
          {checked ? (
            <button onClick={newRhythm} disabled={playing} className="btn btn-primary h-14 w-full text-lg font-extrabold">
              <span aria-hidden>▶</span> Otro ritmo
            </button>
          ) : (
            <button onClick={checkAnswer} className="btn btn-accent h-14 w-full text-lg font-extrabold">
              <span aria-hidden>✓</span> Comprobar
            </button>
          )}
        </div>
        </>
      )}
    </main>
    <CellPickerDialog
      open={pickerOpen}
      onClose={() => {
        setPickerOpen(false);
        // The exercise may have been dropped because it used a cell that is now off.
        if (!useRhythm.getState().target) stop();
      }}
    />
    </SuiteShell>
  );
}
