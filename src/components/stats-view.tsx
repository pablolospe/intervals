"use client";
import { useState } from "react";
import { SuiteShell } from "@/components/suite-shell";
import { getInterval } from "@/lib/audio/intervals-catalog";
import { MODULES } from "@/lib/modules";
import { useRhythm } from "@/store/rhythm-store";
import { useTrainer, type Score } from "@/store/trainer-store";
import { useHydrated } from "./store-hydrator";

const color = (id: (typeof MODULES)[number]["id"]) => MODULES.find((m) => m.id === id)!.color;
const percent = (correct: number, total: number) => (total ? Math.round((correct / total) * 100) : 0);

function SummaryCard({ title, accent, score }: { title: string; accent: string; score: Score }) {
  return (
    <li className="flex flex-col gap-1 rounded-3xl border-2 border-zinc-700/70 bg-[#0b0c10] p-4">
      <h3 className="text-sm font-bold text-zinc-300">{title}</h3>
      <p className="text-4xl font-extrabold tabular-nums" style={{ color: accent }}>
        {score.total ? `${percent(score.correct, score.total)}%` : "—"}
      </p>
      <p className="text-sm text-zinc-400">
        <b className="tabular-nums text-zinc-100">{score.correct}/{score.total}</b> aciertos · racha{" "}
        <b className="tabular-nums text-amber-300">{score.streak}</b>
      </p>
    </li>
  );
}

export function StatsView() {
  const hydrated = useHydrated();
  const scores = useTrainer((s) => s.scores);
  const byInterval = useTrainer((s) => s.byInterval);
  const rhythm = useRhythm((s) => s.stats);
  const [confirming, setConfirming] = useState(false);

  // Weakest first, so what needs practice is at the top.
  const rows = Object.entries(byInterval)
    .filter(([, v]) => v.total > 0)
    .map(([id, v]) => ({ id, def: getInterval(id), ...v }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total);

  const hasData = scores.recognize.total + scores.sing.total + rhythm.total > 0;

  const wipe = () => {
    useTrainer.getState().resetProgress();
    useRhythm.getState().resetProgress();
    setConfirming(false);
  };

  return (
    <SuiteShell active="stats">
      <main data-theme="stats" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 p-4 text-zinc-100 md:overflow-y-auto md:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-emerald-400 sm:text-3xl">resultados</h1>

        <div className={`flex flex-col gap-5 transition-opacity ${hydrated ? "" : "opacity-40"}`}>
          <ul className="grid gap-3 sm:grid-cols-3">
            <SummaryCard title="Adivinar intervalos" accent={color("recognize")} score={scores.recognize} />
            <SummaryCard title="Cantar intervalos" accent={color("sing")} score={scores.sing} />
            <SummaryCard title="Células rítmicas" accent={color("rhythm")} score={rhythm} />
          </ul>

          <section aria-labelledby="by-interval" className="rounded-3xl border-2 border-zinc-700/70 bg-[#0b0c10] p-4 sm:p-5">
            <h2 id="by-interval" className="text-lg font-extrabold">Por intervalo</h2>
            <p className="mb-3 text-sm text-zinc-400">Los que más te cuestan, primero. Suma Adivinar y Cantar.</p>
            {hydrated && rows.length === 0 ? (
              <p className="py-4 text-center text-zinc-400">Todavía no hay datos. Entrená un rato y volvé a mirar.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {rows.map((r) => {
                  const pct = percent(r.correct, r.total);
                  return (
                    <li key={r.id} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                      <span className="truncate font-semibold">
                        {r.def.name.es} <span aria-hidden className="text-zinc-400">{r.def.direction === "asc" ? "↑" : "↓"}</span>
                        <span className="sr-only">{r.def.direction === "asc" ? " ascendente" : " descendente"}</span>
                      </span>
                      <span role="img" aria-label={`${pct}% de aciertos`} className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                        <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="tabular-nums text-zinc-300">
                        {r.correct}/{r.total} · <b className="text-zinc-100">{pct}%</b>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {hasData && (
          <div className="flex items-center gap-2 self-start text-sm">
            {confirming ? (
              <>
                <span className="text-zinc-300">¿Borrar todo tu progreso?</span>
                <button onClick={wipe} className="rounded-full bg-red-500 px-4 py-1.5 font-bold text-white hover:brightness-110">Sí, borrar</button>
                <button onClick={() => setConfirming(false)} className="rounded-full border border-zinc-700 px-4 py-1.5 font-semibold text-zinc-200 hover:bg-zinc-800">Cancelar</button>
              </>
            ) : (
              <button onClick={() => setConfirming(true)} className="rounded-full border border-zinc-700 px-4 py-1.5 font-semibold text-zinc-300 hover:bg-zinc-800">Borrar progreso</button>
            )}
          </div>
        )}
      </main>
    </SuiteShell>
  );
}
