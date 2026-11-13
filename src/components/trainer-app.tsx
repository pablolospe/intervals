"use client";
import { SuiteShell } from "@/components/suite-shell";
import { useEffect, useState } from "react";
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

/** Small translucent pill that sits on top of the pitch view while it's in use. */
const floating =
  "inline-flex items-center gap-1.5 rounded-full border border-zinc-600/80 bg-zinc-900/80 px-2.5 py-1 text-xs font-semibold text-zinc-100 backdrop-blur transition hover:border-zinc-400 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40";

export function TrainerApp({ mode }: { mode: "recognize" | "sing" }) {
  const { lang, selection, direction, currentId, phase, evaluation, micError, score, setSelection, setDirection, answer } = useTrainer();
  const { startChallenge, replay, playReference } = useTrainerAudio();
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const t = dict[lang];
  /** Interval to return to when leaving surprise mode. */
  const [lastPick, setLastPick] = useState(selection === "random" ? "P5" : selection);

  useEffect(() => {
    // The route decides the game: recognise = surprise interval, sing = chosen interval.
    if (mode === "recognize") setSelection("random");
    else if (useTrainer.getState().selection === "random") setSelection("P5");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    setSelectedSongIndex(0);
  }, [currentId]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const def = currentId ? getInterval(currentId) : null;
  const busy = phase === "PLAYING_INTERVAL";
  const finished = phase === "SUCCESS" || phase === "MISS";
  const isRandom = mode === "recognize";
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
  const mainLabel = phase === "IDLE" ? t.newChallenge : t.next;
  /** The pitch view only matters while listening/singing; otherwise it hosts the main actions. */
  const canvasIdle = phase === "IDLE" || finished;

  return (
    <SuiteShell active={mode}>
    <main data-theme={mode} className="mx-auto flex min-h-0 w-full flex-1 max-w-5xl flex-col gap-2.5 p-2.5 text-zinc-100 sm:gap-3 sm:p-5 md:overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight text-emerald-400 sm:text-3xl">
            {mode === "recognize" ? "reconocer intervalos" : "cantar intervalos"}
          </h1>
          <p className="hidden text-xs text-zinc-400 sm:block [@media(max-height:480px)]:hidden!">{t.tagline}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs sm:px-3 sm:text-sm" aria-label={`${t.score}: ${score.correct}/${score.total}. ${t.streak}: ${score.streak}`}>
          <span className="hidden text-zinc-400 sm:inline">{t.score}</span>
          <b className="tabular-nums">{score.correct}/{score.total}</b>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{t.streak}</span>
          <b className="tabular-nums">{score.streak}</b>
        </div>
      </header>

      <div className="flex flex-col gap-2.5 md:grid md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-3">
        <section className="flex w-full min-w-0 flex-col self-start rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 shadow-xl backdrop-blur sm:rounded-3xl sm:p-5">
          <div className="mb-2 flex items-center gap-3 sm:mb-4 sm:gap-4">
            <div
              key={`${phase}-${score.total}`}
              className={`[@media(max-height:480px)]:hidden h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800 p-1 sm:h-20 sm:w-20 sm:p-1.5 ${ANIM[phase]}`}
            >
              <Mascot intervalId={currentId} revealed={revealed} mood={mood} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold sm:text-xl">
                {finished ? def?.name[lang] ?? "" : t.phase[phase]}
              </p>
              <p className="text-xs text-zinc-400 sm:text-sm">
                {finished
                  ? def
                    ? def.direction === "asc"
                      ? t.ascending
                      : t.descending
                    : ""
                  : def
                    ? revealed
                      ? `${def.name[lang]} · ${def.direction === "asc" ? t.ascending : t.descending}`
                      : t.mystery
                    : ""}
              </p>
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

          {/* Pitch view: action buttons float over it while it's idle, and shrink to the corner while singing. */}
          <div className="relative h-52 shrink-0 sm:h-56 md:h-60 [@media(max-height:600px)]:h-44">
            <PitchCanvas idleLabel={t.idleLabel} />
            {canvasIdle ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl bg-zinc-950/80 p-3 backdrop-blur-[2px]">
                {finished && def && evaluation && quip && (
                  <div
                    role="status"
                    className={`w-full max-w-md rounded-2xl border-2 px-3 py-2 text-center shadow-lg sm:px-4 sm:py-3 ${
                      phase === "SUCCESS" ? "border-green-400 bg-green-500/15 text-green-100" : "border-red-400 bg-red-500/15 text-red-100"
                    }`}
                  >
                    <p className={`flex items-center justify-center gap-2 text-xl font-extrabold sm:text-2xl ${phase === "SUCCESS" ? "text-green-300" : "text-red-300"}`}>
                      <span aria-hidden>{phase === "SUCCESS" ? "✓" : "✕"}</span>
                      {t.phase[phase]}
                    </p>
                    <p className="mt-0.5 text-sm opacity-90">{quip}</p>
                    <p className="mt-1.5 text-xs font-medium opacity-80 sm:text-sm">
                      {t.wasIt}: <b>{def.name[lang]}</b> ({def.direction === "asc" ? t.ascending : t.descending}) · {t.error}{" "}
                      {evaluation.errorCents >= 0 ? "+" : ""}
                      {evaluation.errorCents.toFixed(0)} {t.cents}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2.5 sm:gap-3">
                <button onClick={startChallenge} className="btn btn-primary px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base">
                  <span aria-hidden>▶</span>
                  {phase === "IDLE" ? (
                    mainLabel
                  ) : (
                    <>
                      <span className="sm:hidden">{t.nextShort}</span>
                      <span className="hidden sm:inline">{mainLabel}</span>
                    </>
                  )}
                </button>
                {def && (
                  <button onClick={replay} className="btn btn-ghost px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base">
                    <span aria-hidden>↻</span>
                    <span className="sm:hidden">{t.replayShort}</span>
                    <span className="hidden sm:inline">{t.replay}</span>
                  </button>
                )}
                </div>
              </div>
            ) : (
              <div className="absolute right-2 top-2 flex gap-1.5">
                <button onClick={replay} disabled={busy || !def} className={floating} aria-label={t.replay} title={t.replay}>
                  <span aria-hidden>↻</span>
                  <span className="hidden sm:inline">{t.replay}</span>
                </button>
                <button onClick={startChallenge} disabled={busy} className={floating} aria-label={t.skip} title={t.skip}>
                  <span aria-hidden>⏭</span>
                  <span className="hidden sm:inline">{t.skip}</span>
                </button>
              </div>
            )}
          </div>

          {micError && <p className="mt-2 rounded-xl bg-red-950/60 p-2 text-xs text-red-300 sm:text-sm">{t.micDenied}</p>}
        </section>

        <div className="flex flex-col gap-3 md:overflow-y-auto [@media(max-height:480px)]:overflow-y-auto">
          <section aria-labelledby="pick">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="pick" className="text-xs font-medium text-zinc-300 sm:text-sm">
                {isRandom ? t.modeRandom : t.pickInterval}
              </h2>
              <div hidden role="radiogroup" aria-label={t.mode} className="flex shrink-0 rounded-full border border-zinc-600 bg-zinc-900 p-0.5 text-xs font-semibold sm:text-sm">
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
              className={`btn group w-1/3 shrink-0 flex-col justify-center gap-1 rounded-2xl border-2 px-1 py-2 sm:w-28 ${
                asc
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-200 shadow-[0_4px_0_0_var(--accent-edge)] enabled:active:translate-y-0.75 enabled:active:shadow-[0_1px_0_0_var(--accent-edge)]"
                  : "border-violet-400 bg-violet-400/15 text-violet-200 shadow-[0_4px_0_0_#5b21b6] enabled:active:translate-y-0.75 enabled:active:shadow-[0_1px_0_0_#5b21b6]"
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
              <span className="text-[10px] font-bold uppercase tracking-tight sm:text-xs sm:tracking-wide">{asc ? t.ascending : t.descending}</span>
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
            <div className="grid w-2/3 flex-1 grid-cols-2 content-start gap-1.5 sm:gap-2">
              {options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setLastPick(o.id);
                    setSelection(o.id);
                  }}
                  disabled={busy}
                  aria-pressed={selection === o.id}
                  className={`truncate rounded-xl border px-1.5 py-1.5 text-center text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed [@media(max-height:600px)]:py-1 sm:px-3 sm:py-2 sm:text-left sm:text-sm ${
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold text-violet-200 sm:text-sm">{t.helpTitle}</h2>
              </div>
              <p className="hidden text-xs text-zinc-400 sm:block [@media(max-height:480px)]:hidden!">{t.helpText}</p>

              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
                <span className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-xl sm:text-2xl shadow-sm select-none" role="img" aria-label="Perezoso">
                  🦥
                </span>
                <p className="leading-snug">
                  Algunos ejemplos aún no han sido revisados por el desarrollador.
                </p>
              </div>

              {def && revealed && def.songs && def.songs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {def.songs.map((s, idx) => {
                    const isSel = selectedSongIndex === idx;
                    return (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => {
                          setSelectedSongIndex(idx);
                          playReference(idx);
                        }}
                        disabled={busy || !revealed}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          isSel
                            ? "border border-violet-400 bg-violet-400/25 text-violet-100 shadow-sm"
                            : "border border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        <span aria-hidden className="mr-1 text-[10px]">♫</span>
                        {s.title}
                      </button>
                    );
                  })}
                </div>
              )}

              {def && (finished || (phase === "SINGING_TARGET" && !isRandom)) && (
                <p className="mt-0.5 text-xs text-violet-200 sm:text-sm">
                  {t.song}: <b>{(def.songs[selectedSongIndex] ?? def.song).title}</b>
                  {(def.songs[selectedSongIndex] ?? def.song).artist ? ` — ${(def.songs[selectedSongIndex] ?? def.song).artist}` : ""}
                </p>
              )}
            </div>
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
    </SuiteShell>
  );
}
