"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BASE_INTERVALS, getInterval } from "@/lib/audio/intervals-catalog";
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

const btn = "btn px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm";
const ghost = `${btn} btn-ghost`;

export function TrainerApp() {
  const { lang, selection, direction, currentId, phase, evaluation, micError, score, setSelection, setDirection, answer } = useTrainer();
  const { startChallenge, replay, playReference } = useTrainerAudio();
  const t = dict[lang];
  /** Interval to return to when leaving surprise mode. */
  const [lastPick, setLastPick] = useState(selection === "random" ? "P5" : selection);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const def = currentId ? getInterval(currentId) : null;
  const busy = phase === "PLAYING_INTERVAL";
  const finished = phase === "SUCCESS" || phase === "MISS";
  const isRandom = selection === "random";
  const revealed = !isRandom || finished; // surprise mode hides the answer until it is given
  const identifying = phase === "IDENTIFY";
  const options = BASE_INTERVALS.map((b) => ({ id: b.id, label: b.name[lang] }));
  const asc = direction === "asc";
  const stepLabels = isRandom ? t.stepsRandom : t.steps;
  const order: Phase[] = isRandom
    ? ["PLAYING_INTERVAL", "SINGING_ROOT", "SINGING_TARGET", "IDENTIFY", "SUCCESS"]
    : ["PLAYING_INTERVAL", "SINGING_ROOT", "SINGING_TARGET", "SUCCESS"];
  const stepIndex = phase === "MISS" ? order.length - 1 : order.indexOf(phase);
  const quip = phase === "SUCCESS" ? t.success[score.total % t.success.length] : phase === "MISS" ? t.miss[score.total % t.miss.length] : null;
  const mood: Mood = phase === "SUCCESS" ? "happy" : phase === "MISS" ? "sad" : "neutral";
  const mainLabel = phase === "IDLE" ? t.newChallenge : finished ? t.next : t.skip;

  return (
    <main className="mx-auto flex h-dvh w-full max-w-5xl flex-col gap-3 px-3 py-3 text-zinc-100 sm:px-6 sm:py-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/"
            className="group mb-1 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>Suite</span>
          </Link>
          <h1 className="bg-linear-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-4xl">
            {t.title}
          </h1>
          <p className="hidden text-sm text-zinc-400 sm:block [@media(max-height:480px)]:hidden!">{t.tagline}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs sm:text-sm" aria-label={`${t.score}: ${score.correct}/${score.total}. ${t.streak}: ${score.streak}`}>
            <span className="hidden text-zinc-400 sm:inline">{t.score}</span>
            <b className="tabular-nums">{score.correct}/{score.total}</b>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">{t.streak}</span>
            <b className="tabular-nums">{score.streak}</b>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:grid-rows-1 [@media(max-height:480px)]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] [@media(max-height:480px)]:grid-rows-1">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 p-3 shadow-2xl shadow-black/40 backdrop-blur sm:p-5">
          <div className="mb-2 flex items-center gap-3 sm:mb-4 sm:gap-4">
            <div
              key={`${phase}-${score.total}`}
              className={`[@media(max-height:480px)]:hidden h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800 p-1 sm:h-20 sm:w-20 sm:p-1.5 ${ANIM[phase]}`}
            >
              <Mascot intervalId={currentId} revealed={revealed} mood={mood} />
            </div>
            <div role="status" className="min-w-0">
              <p className={`text-base font-semibold sm:text-xl ${phase === "SUCCESS" ? "text-emerald-300" : phase === "MISS" ? "text-amber-300" : ""}`}>
                {t.phase[phase]}
              </p>
              <p className="text-xs text-zinc-400 sm:text-sm">
                {quip ??
                  (def && !finished
                    ? revealed
                      ? `${def.name[lang]} · ${def.direction === "asc" ? t.ascending : t.descending}`
                      : t.mystery
                    : "")}
              </p>
              {finished && def && evaluation && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {isRandom ? `${t.wasIt}: ` : ""}{def.name[lang]} ({def.direction === "asc" ? t.ascending : t.descending}) · {t.error}{" "}
                  {evaluation.errorCents >= 0 ? "+" : ""}
                  {evaluation.errorCents.toFixed(0)} {t.cents}
                </p>
              )}
            </div>
          </div>

          <ol className="[@media(max-height:480px)]:hidden mb-2 grid gap-1.5 sm:mb-4 sm:gap-2" style={{ gridTemplateColumns: `repeat(${stepLabels.length}, minmax(0, 1fr))` }} aria-label="progress">
            {stepLabels.map((label, i) => (
              <li key={label} className="flex flex-col gap-1">
                <span className={`h-1.5 rounded-full transition-colors ${i <= stepIndex ? "bg-emerald-400" : "bg-zinc-800"}`} />
                <span className={`truncate text-[10px] [@media(max-height:600px)]:hidden sm:text-[11px] ${i === stepIndex ? "text-zinc-100" : "text-zinc-500"}`}>{label}</span>
              </li>
            ))}
          </ol>

          <div className="min-h-20 flex-1">
            <PitchCanvas idleLabel={t.idleLabel} />
          </div>

          {micError && <p className="mt-2 rounded-lg bg-red-950/60 p-2 text-xs text-red-300 sm:text-sm">{t.micDenied}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={startChallenge}
              disabled={busy}
              className={`${btn} btn-primary px-4 text-sm sm:px-5 sm:text-base`}
            >
              {mainLabel}
            </button>
            <button onClick={replay} disabled={busy || !def} className={ghost}>
              {t.replay}
            </button>
          </div>
        </section>

        <div className="flex flex-col gap-3 md:overflow-y-auto [@media(max-height:480px)]:overflow-y-auto">
          <section aria-labelledby="pick">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="pick" className="text-xs font-medium text-zinc-300 sm:text-sm">
                {isRandom ? t.modeRandom : t.pickInterval}
              </h2>
              <div role="radiogroup" aria-label={t.mode} className="flex shrink-0 rounded-full border border-zinc-600 bg-zinc-900 p-0.5 text-xs font-semibold sm:text-sm">
                {([
                  ["pick", t.modePick],
                  ["random", t.random],
                ] as const).map(([m, label]) => {
                  const on = (m === "random") === isRandom;
                  return (
                    <button
                      key={m}
                      role="radio"
                      aria-checked={on}
                      disabled={busy}
                      onClick={() => !on && setSelection(m === "random" ? "random" : lastPick)}
                      className={`rounded-full px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed sm:px-4 sm:py-1.5 ${
                        on ? (m === "random" ? "bg-violet-400 text-zinc-950" : "bg-emerald-400 text-zinc-950") : "text-zinc-300 hover:text-zinc-50"
                      }`}
                    >
                      {m === "random" ? "🎲 " : ""}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-stretch gap-2 sm:gap-3">
            {!isRandom && (
            <button
              onClick={() => setDirection(asc ? "desc" : "asc")}
              disabled={busy}
              aria-label={`${t.direction}: ${asc ? t.ascending : t.descending}. ${t.switchDirection}`}
              title={t.switchDirection}
              className={`btn group w-16 shrink-0 flex-col gap-1 rounded-2xl border-2 px-1 py-2 sm:w-24 ${
                asc
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-200 shadow-[0_4px_0_0_#047857] enabled:active:translate-y-[3px] enabled:active:shadow-[0_1px_0_0_#047857]"
                  : "border-violet-400 bg-violet-400/15 text-violet-200 shadow-[0_4px_0_0_#5b21b6] enabled:active:translate-y-[3px] enabled:active:shadow-[0_1px_0_0_#5b21b6]"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className={`h-10 w-10 transition-transform duration-300 sm:h-14 sm:w-14 ${asc ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20V4M5 11l7-7 7 7" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">{asc ? t.ascending : t.descending}</span>
            </button>
            )}
            {isRandom ? (
              <div className="flex flex-1 flex-col justify-center gap-1 rounded-2xl border border-violet-400/40 bg-violet-400/10 p-3 sm:p-4">
                <p className="text-sm font-semibold text-violet-100 sm:text-base">
                  <span aria-hidden>🎲 </span>
                  {t.randomTitle}
                </p>
                <p className="text-xs text-violet-200/80 sm:text-sm">{t.randomHelp}</p>
                {finished && def && (
                  <p className="mt-1 text-xs text-violet-100 sm:text-sm">
                    {t.wasIt}: <b>{def.name[lang]} {def.direction === "asc" ? "↑" : "↓"}</b>
                  </p>
                )}
              </div>
            ) : (
            <div className="grid flex-1 grid-cols-2 content-start gap-1.5 min-[460px]:grid-cols-3 sm:grid-cols-4 sm:gap-2 md:grid-cols-2">
              {options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setLastPick(o.id);
                    setSelection(o.id);
                  }}
                  disabled={busy}
                  aria-pressed={selection === o.id}
                  className={`truncate rounded-xl border px-2 py-1.5 text-left text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed [@media(max-height:600px)]:py-1 sm:px-3 sm:py-2 sm:text-sm ${
                    selection === o.id
                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]"
                      : "border-zinc-700 bg-zinc-800/80 text-zinc-100 hover:border-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            )}
            </div>
          </section>

          <section className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-2.5 sm:p-4">
            <div className="flex items-center justify-between gap-2 sm:block">
              <h2 className="text-xs font-semibold text-violet-200 sm:text-sm">{t.helpTitle}</h2>
              <p className="mb-2 hidden text-sm text-zinc-400 sm:block [@media(max-height:480px)]:hidden!">{t.helpText}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button onClick={playReference} disabled={busy || !def || !revealed} className={ghost}>
                  {t.playReference}
                </button>
                <fieldset className="hidden gap-4 text-xs text-zinc-400 sm:flex [@media(max-height:480px)]:hidden!" aria-label={t.helpTitle}>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="ref" defaultChecked /> {t.instrumental}
                  </label>
                  <label className="flex items-center gap-1.5 text-zinc-600">
                    <input type="radio" name="ref" disabled /> {t.clip}
                  </label>
                </fieldset>
              </div>
            </div>
            {def && (finished || (phase === "SINGING_TARGET" && !isRandom)) && (
              <p className="mt-2 text-xs text-violet-200 sm:text-sm">
                {t.song}: <b>{def.song.title}</b>
                {def.song.artist ? ` — ${def.song.artist}` : ""}
              </p>
            )}
          </section>
        </div>
      </div>

      <IdentifyModal
        open={identifying}
        labels={{
          title: t.identifyTitle,
          subtitle: t.phase.IDENTIFY,
          direction: t.guessDirection,
          interval: t.guessInterval,
          ascending: t.ascending,
          descending: t.descending,
          submit: t.submitGuess,
        }}
        options={options}
        onAnswer={answer}
      />

      <footer className="hidden text-center text-xs text-zinc-600 md:block">{t.footer}</footer>
    </main>
  );
}
