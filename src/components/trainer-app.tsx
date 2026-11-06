"use client";
import { useEffect } from "react";
import { getInterval, INTERVALS } from "@/lib/audio/intervals-catalog";
import { dict } from "@/lib/i18n";
import { useTrainer } from "@/store/trainer-store";
import { useTrainerAudio } from "@/hooks/use-trainer-audio";
import { PitchCanvas } from "./pitch-canvas";

const btn =
  "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function TrainerApp() {
  const { lang, selection, currentId, phase, evaluation, micError, score, setLang, setSelection } = useTrainer();
  const { startChallenge, replay, playReference } = useTrainerAudio();
  const t = dict[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const def = currentId ? getInterval(currentId) : null;
  const busy = phase === "PLAYING_INTERVAL";
  const showAnswer = phase === "SUCCESS" || phase === "MISS";
  const steps = ["PLAYING_INTERVAL", "SINGING_ROOT", "SINGING_TARGET", "SUCCESS"] as const;
  const stepIndex = phase === "MISS" ? 3 : steps.indexOf(phase as (typeof steps)[number]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8 text-zinc-100">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-zinc-400">{t.subtitle}</p>
        </div>
        <div role="group" aria-label={t.language} className="flex overflow-hidden rounded-lg border border-zinc-700 text-xs">
          {(["es", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`px-3 py-1.5 uppercase ${lang === l ? "bg-zinc-100 text-zinc-900" : "text-zinc-300"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          {t.interval}
          <select
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          >
            <option value="random">{t.random}</option>
            {INTERVALS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name[lang]} ({i.direction === "asc" ? "↑" : "↓"})
              </option>
            ))}
          </select>
        </label>
        <button onClick={startChallenge} disabled={busy} className={`${btn} bg-emerald-500 text-zinc-950 hover:bg-emerald-400`}>
          {t.newChallenge}
        </button>
        <button onClick={replay} disabled={busy || !def} className={`${btn} border border-zinc-700 hover:bg-zinc-800`}>
          {t.replay}
        </button>
      </div>

      <ol className="flex gap-2" aria-label="progress">
        {steps.map((s, i) => (
          <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-emerald-400" : "bg-zinc-800"}`} />
        ))}
      </ol>

      <p role="status" className={`text-lg ${phase === "SUCCESS" ? "text-emerald-400" : phase === "MISS" ? "text-amber-400" : ""}`}>
        {t.phase[phase]}
      </p>

      <PitchCanvas idleLabel={t.idleLabel} />

      {micError && <p className="text-sm text-red-400">{t.micDenied}</p>}

      {showAnswer && def && evaluation && (
        <p className="text-sm text-zinc-400">
          {def.name[lang]} ({def.direction === "asc" ? t.ascending : t.descending}) · {t.error}:{" "}
          {evaluation.errorCents >= 0 ? "+" : ""}
          {evaluation.errorCents.toFixed(0)} {t.cents}
        </p>
      )}

      <section className="rounded-xl border border-zinc-800 p-4">
        <h2 className="mb-2 text-sm font-medium text-zinc-300">{t.reference}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <fieldset className="flex gap-4 text-sm" aria-label={t.refMode}>
            <label className="flex items-center gap-1.5">
              <input type="radio" name="ref" defaultChecked /> {t.instrumental}
            </label>
            <label className="flex items-center gap-1.5 text-zinc-500">
              <input type="radio" name="ref" disabled /> {t.clip}
            </label>
          </fieldset>
          <button onClick={playReference} disabled={busy || !def} className={`${btn} border border-zinc-700 hover:bg-zinc-800`}>
            {t.playReference}
          </button>
        </div>
        {def && (showAnswer || phase === "SINGING_TARGET") && (
          <p className="mt-2 text-sm text-zinc-400">
            {t.song}: {def.song.title}
            {def.song.artist ? ` — ${def.song.artist}` : ""}
          </p>
        )}
      </section>

      <footer className="flex gap-6 text-sm text-zinc-400">
        <span>
          {t.score}: {score.correct}/{score.total}
        </span>
        <span>
          {t.streak}: {score.streak}
        </span>
      </footer>
    </main>
  );
}
