"use client";
import { useEffect } from "react";
import { getInterval, INTERVALS } from "@/lib/audio/intervals-catalog";
import { dict } from "@/lib/i18n";
import { useTrainer, type Phase } from "@/store/trainer-store";
import { useTrainerAudio } from "@/hooks/use-trainer-audio";
import { IdentifyModal } from "./identify-modal";
import { Mascot, type Mood } from "./mascot";
import { PitchCanvas } from "./pitch-canvas";

const ANIM: Record<Phase, string> = {
  IDLE: "",
  PLAYING_INTERVAL: "anim-ring",
  SINGING_ROOT: "anim-ring",
  SINGING_TARGET: "anim-ring",
  IDENTIFY: "",
  SUCCESS: "anim-pop",
  MISS: "anim-wiggle",
};

const btn =
  "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
const ghost = `${btn} border border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800`;

export function TrainerApp() {
  const { lang, selection, currentId, phase, evaluation, micError, score, setLang, setSelection, answer } = useTrainer();
  const { startChallenge, replay, playReference } = useTrainerAudio();
  const t = dict[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const def = currentId ? getInterval(currentId) : null;
  const busy = phase === "PLAYING_INTERVAL";
  const finished = phase === "SUCCESS" || phase === "MISS";
  const isRandom = selection === "random";
  const revealed = !isRandom || finished; // surprise mode hides the answer until it is given
  const identifying = phase === "IDENTIFY";
  const options = INTERVALS.map((i) => ({ id: i.id, label: i.name[lang], arrow: i.direction === "asc" ? "↑" : "↓" }));
  const stepLabels = isRandom ? t.stepsRandom : t.steps;
  const order: Phase[] = isRandom
    ? ["PLAYING_INTERVAL", "SINGING_ROOT", "SINGING_TARGET", "IDENTIFY", "SUCCESS"]
    : ["PLAYING_INTERVAL", "SINGING_ROOT", "SINGING_TARGET", "SUCCESS"];
  const stepIndex = phase === "MISS" ? order.length - 1 : order.indexOf(phase);
  const quip = phase === "SUCCESS" ? t.success[score.total % t.success.length] : phase === "MISS" ? t.miss[score.total % t.miss.length] : null;
  const mood: Mood = phase === "SUCCESS" ? "happy" : phase === "MISS" ? "sad" : "neutral";
  const mainLabel = phase === "IDLE" ? t.newChallenge : finished ? t.next : t.skip;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 text-zinc-100">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            {t.title}
          </h1>
          <p className="text-sm text-zinc-400">{t.tagline}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-sm" aria-label={`${t.streak}: ${score.streak}`}>
            <span className="text-zinc-400">{t.streak}</span>
            <span className="font-semibold tabular-nums">{score.streak}</span>
          </div>
          <div role="group" aria-label={t.language} className="flex overflow-hidden rounded-full border border-zinc-700 text-xs">
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
        </div>
      </header>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-4 flex items-center gap-4">
          <div
            key={`${phase}-${score.total}`}
            className={`h-20 w-20 shrink-0 overflow-hidden rounded-full bg-zinc-800 p-1.5 ${ANIM[phase]}`}
          >
            <Mascot heyJude={currentId === "m3-desc" && revealed} mood={mood} />
          </div>
          <div role="status" className="min-w-0">
            <p className={`text-xl font-semibold ${phase === "SUCCESS" ? "text-emerald-300" : phase === "MISS" ? "text-amber-300" : ""}`}>
              {t.phase[phase]}
            </p>
            <p className="text-sm text-zinc-400">
              {quip ??
                (def && !finished
                  ? revealed
                    ? `${def.name[lang]} · ${def.direction === "asc" ? t.ascending : t.descending}`
                    : t.mystery
                  : "")}
            </p>
            {finished && def && evaluation && (
              <p className="mt-1 text-xs text-zinc-500">
                {isRandom ? `${t.wasIt}: ` : ""}{def.name[lang]} ({def.direction === "asc" ? t.ascending : t.descending}) · {t.error}{" "}
                {evaluation.errorCents >= 0 ? "+" : ""}
                {evaluation.errorCents.toFixed(0)} {t.cents}
              </p>
            )}
          </div>
        </div>

        <ol className="mb-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${stepLabels.length}, minmax(0, 1fr))` }} aria-label="progress">
          {stepLabels.map((label, i) => (
            <li key={label} className="flex flex-col gap-1">
              <span className={`h-1.5 rounded-full transition-colors ${i <= stepIndex ? "bg-emerald-400" : "bg-zinc-800"}`} />
              <span className={`text-[11px] ${i === stepIndex ? "text-zinc-100" : "text-zinc-500"}`}>{label}</span>
            </li>
          ))}
        </ol>

        <PitchCanvas idleLabel={t.idleLabel} />

        {micError && <p className="mt-3 rounded-lg bg-red-950/60 p-3 text-sm text-red-300">{t.micDenied}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={startChallenge}
            disabled={busy}
            className={`${btn} bg-emerald-400 px-6 text-base text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-300`}
          >
            {mainLabel}
          </button>
          <button onClick={replay} disabled={busy || !def} className={ghost}>
            {t.replay}
          </button>
          <span className="ml-auto text-sm text-zinc-400">
            {t.score}: <b className="text-zinc-100">{score.correct}/{score.total}</b>
          </span>
        </div>
      </section>

      <section aria-labelledby="pick">
        <h2 id="pick" className="mb-2 text-sm font-medium text-zinc-300">
          {t.pickInterval}
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[{ id: "random", label: t.random, arrow: "" }, ...options].map((o) => (
            <button
              key={o.id}
              onClick={() => setSelection(o.id)}
              aria-pressed={selection === o.id}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                selection === o.id || (finished && isRandom && o.id === currentId)
                  ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {o.label} <span className="text-zinc-500">{o.arrow}</span>
            </button>
          ))}
        </div>
      </section>

      <IdentifyModal open={identifying} title={t.identifyTitle} subtitle={t.phase.IDENTIFY} options={options} onPick={answer} />

      <section className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4">
        <h2 className="text-sm font-semibold text-violet-200">{t.helpTitle}</h2>
        <p className="mb-3 text-sm text-zinc-400">{t.helpText}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={playReference} disabled={busy || !def || !revealed} className={ghost}>
            {t.playReference}
          </button>
          <fieldset className="flex gap-4 text-xs text-zinc-400" aria-label={t.helpTitle}>
            <label className="flex items-center gap-1.5">
              <input type="radio" name="ref" defaultChecked /> {t.instrumental}
            </label>
            <label className="flex items-center gap-1.5 text-zinc-600">
              <input type="radio" name="ref" disabled /> {t.clip}
            </label>
          </fieldset>
        </div>
        {def && (finished || (phase === "SINGING_TARGET" && !isRandom)) && (
          <p className="mt-3 text-sm text-violet-200">
            {t.song}: <b>{def.song.title}</b>
            {def.song.artist ? ` — ${def.song.artist}` : ""}
          </p>
        )}
      </section>

      <footer className="text-center text-xs text-zinc-600">{t.footer}</footer>
    </main>
  );
}
