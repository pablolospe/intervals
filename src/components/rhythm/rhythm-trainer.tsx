"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cellPool, getCell, grade, randomRhythm } from "@/lib/rhythm/cells";
import { RhythmPlayer } from "@/lib/rhythm/rhythm-player";
import { RhythmNotation } from "./rhythm-notation";

const BEATS = 4;
const OK = "#34d399";
const BAD = "#f87171";
const empty = () => Array<string | null>(BEATS).fill(null);

const chip =
  "rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 disabled:opacity-40";

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
  const allRight = results?.every(Boolean) ?? false;

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
    if (checked || !target) return;
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

  const filled = answer.every((a) => a !== null);

  return (
    <div className="flex flex-col gap-5">
      {/* Settings + transport */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <button onClick={newRhythm} disabled={playing} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50">
          {target ? "Otro ritmo" : "Escuchar ritmo"}
        </button>
        <button onClick={() => target && play(target)} disabled={!target || playing} className={chip}>
          Repetir
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <span className="tabular-nums">♩ = {bpm}</span>
          <input type="range" min={50} max={130} step={5} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-28 accent-emerald-400" />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-zinc-300">
          <input type="checkbox" checked={includeRests} onChange={(e) => setIncludeRests(e.target.checked)} className="accent-emerald-400" />
          Silencios
        </label>
        <label className="flex items-center gap-1.5 text-sm text-zinc-300">
          <input type="checkbox" checked={metronome} onChange={(e) => setMetronome(e.target.checked)} className="accent-emerald-400" />
          Metrónomo
        </label>
        <span className="ml-auto text-sm text-zinc-400">
          Aciertos <b className="text-zinc-100">{stats.score}/{stats.total}</b> · Racha <b className="text-zinc-100">{stats.streak}</b>
        </span>
      </section>

      {/* Answer slots */}
      <section aria-label="Tu respuesta" className="grid grid-cols-4 gap-2">
        {answer.map((id, i) => {
          const res = results?.[i];
          const border = res === undefined ? (i === cursor && target ? "border-emerald-400" : "border-zinc-700") : res ? "border-emerald-400 bg-emerald-400/10" : "border-red-400 bg-red-400/10";
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <button
                onClick={() => !checked && setCursor(i)}
                disabled={!target}
                aria-label={`Tiempo ${i + 1}: ${id ? getCell(id).label : "vacío"}`}
                className={`flex h-24 w-full items-center justify-center rounded-xl border-2 transition ${border} disabled:opacity-40`}
              >
                {id ? <RhythmNotation ids={[id]} width={92} /> : <span className="text-2xl text-zinc-600">{i + 1}</span>}
              </button>
              {res === false && target && (
                <div className="flex flex-col items-center text-xs text-emerald-300">
                  <RhythmNotation ids={[target[i]]} width={92} height={70} colors={[OK]} />
                  <span className="text-center">{getCell(target[i]).label}</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Check / result */}
      {!checked && (
        <div className="flex gap-2">
          <button onClick={check} disabled={!target || !filled} className="rounded-xl bg-violet-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-violet-300 disabled:opacity-40">
            Comprobar
          </button>
          <button onClick={() => { setAnswer(empty()); setCursor(0); }} className={chip}>
            Borrar
          </button>
        </div>
      )}
      {checked && target && (
        <div className={`rounded-2xl border p-4 ${allRight ? "border-emerald-400/40 bg-emerald-400/5" : "border-red-400/40 bg-red-400/5"}`}>
          <p className={`font-semibold ${allRight ? "text-emerald-300" : "text-red-300"}`}>
            {allRight ? "¡Clavado! Ese ritmo no se te escapa." : `${results!.filter(Boolean).length} de ${BEATS}. Escuchalo de nuevo y comparalo.`}
          </p>
          <div className="mt-2 overflow-x-auto">
            <RhythmNotation ids={target} width={320} height={80} line colors={results!.map((r) => (r ? OK : BAD))} />
          </div>
        </div>
      )}

      {/* Palette */}
      <section aria-label="Células rítmicas" className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {pool.map((c) => (
          <button
            key={c.id}
            onClick={() => pick(c.id)}
            disabled={!target || checked}
            title={c.label}
            className="flex flex-col items-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-1 pb-2 transition hover:border-emerald-400 hover:bg-emerald-400/10 disabled:opacity-40"
          >
            <RhythmNotation ids={[c.id]} width={92} height={70} />
            <span className="text-center text-[11px] leading-tight text-zinc-400">{c.label}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
