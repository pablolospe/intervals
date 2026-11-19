"use client";
import { SuiteShell } from "@/components/suite-shell";
import { useEffect, useRef, useState } from "react";
import { BASE_INTERVALS, directedId, getInterval, signedSemitones } from "@/lib/audio/intervals-catalog";
import { dict } from "@/lib/i18n";
import { live } from "@/lib/live-pitch";
import { useTrainer, type Phase } from "@/store/trainer-store";
import { useTrainerAudio } from "@/hooks/use-trainer-audio";
import { useHydrated } from "./store-hydrator";
import { IdentifyModal } from "./identify-modal";
import { getMascotCharacter, getMascotReaction, Mascot, type Mood } from "./mascot";
import { MiniPiano } from "./mini-piano";
import { PitchCanvas } from "./pitch-canvas";

/** Small translucent pill that sits on top of the pitch view while it's in use. */
const floating =
  "inline-flex items-center gap-1.5 rounded-full border border-zinc-600/80 bg-zinc-900/80 px-2.5 py-1 text-xs font-semibold text-zinc-100 backdrop-blur transition hover:border-zinc-400 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40";

export function TrainerApp({ mode }: { mode: "recognize" | "sing" }) {
  const { lang, selection, direction, currentId, phase, rootMidi, rootHz, evaluation, micError, scores, setSelection, setDirection, setMode, answer } = useTrainer();
  const score = scores[mode];
  const hydrated = useHydrated();
  const { startChallenge, replay, playReference } = useTrainerAudio();
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [pickOpen, setPickOpen] = useState(false);
  const t = dict[lang];
  /** Interval to return to when leaving surprise mode. */
  const [lastPick, setLastPick] = useState(selection === "random" ? "P5" : selection);

  useEffect(() => {
    // The route decides the game: recognise = surprise interval, sing = the interval chosen last time.
    setMode(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    setSelectedSongIndex(0);
  }, [currentId, selection, direction]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const def = currentId ? getInterval(currentId) : null;
  const busy = phase === "PLAYING_INTERVAL";
  const finished = phase === "SUCCESS" || phase === "MISS";
  const isRandom = mode === "recognize";
  const activeDef = def ?? (!isRandom && selection !== "random" ? getInterval(directedId(selection, direction)) : null);
  const revealed = !isRandom || finished; // surprise mode hides the answer until it is given
  const identifying = phase === "IDENTIFY";
  const options = BASE_INTERVALS.map((b) => ({ id: b.id, label: b.name[lang] }));
  const asc = direction === "asc";
  const stepLabels = isRandom ? t.stepsRandom : t.steps;
  const order: Phase[] = isRandom
    ? ["PLAYING_INTERVAL", "SINGING_ROOT", "SINGING_TARGET", "IDENTIFY"]
    : ["PLAYING_INTERVAL", "SINGING_ROOT", "SINGING_TARGET"];
  const stepIndex = finished ? order.length : order.indexOf(phase);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mood: Mood = phase === "SUCCESS" ? "happy" : phase === "MISS" ? "sad" : "neutral";
  const mainLabel = phase === "IDLE" ? t.newChallenge : t.next;
  /** The pitch view only matters while listening/singing; otherwise it hosts the main actions. */
  const canvasIdle = phase === "IDLE" || finished;

  useEffect(() => {
    let raf = 0;
    const animate = phase === "PLAYING_INTERVAL" || phase === "SINGING_ROOT" || phase === "SINGING_TARGET";

    const update = () => {
      for (let i = 0; i < stepLabels.length; i++) {
        const el = barRefs.current[i];
        if (!el) continue;
        let pct = 0;
        if (i < stepIndex) {
          pct = 100;
        } else if (i === stepIndex) {
          if (phase === "PLAYING_INTERVAL") {
            const p = live.playDurationMs > 0 ? Math.min(1, Math.max(0, (performance.now() - live.playStartMs) / live.playDurationMs)) : 0;
            pct = p * 100;
          } else if (phase === "SINGING_ROOT" || phase === "SINGING_TARGET") {
            pct = Math.min(1, Math.max(0, live.progress)) * 100;
          } else if (phase === "IDENTIFY") {
            pct = 100;
          }
        }
        el.style.width = `${pct}%`;
      }
      if (animate) raf = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(raf);
  }, [phase, stepIndex, stepLabels.length]);

  return (
    <SuiteShell active={mode}>
    <main data-theme={mode} className="mx-auto flex min-h-0 w-full flex-1 max-w-5xl flex-col gap-2.5 p-2.5 text-zinc-100 sm:gap-3 sm:p-5 md:overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <h1 className="whitespace-nowrap text-xl font-extrabold leading-tight tracking-tight text-emerald-400 sm:text-3xl">
            {mode === "recognize" ? "adivinar intervalos" : "cantar intervalos"}
          </h1>
          {/* <p className="hidden text-xs text-zinc-400 sm:block [@media(max-height:480px)]:hidden!">{t.tagline}</p> */}
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs transition-opacity sm:px-3 sm:text-sm ${hydrated ? "" : "opacity-40"}`} aria-label={`${t.score}: ${score.correct}/${score.total}. ${t.streak}: ${score.streak}`}>
          <span className="hidden text-zinc-400 sm:inline">{t.score}</span>
          <b className="tabular-nums">{score.correct}/{score.total}</b>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{t.streak}</span>
          <b className="tabular-nums">{score.streak}</b>
        </div>
      </header>

      <div className="flex flex-col gap-2.5 md:grid md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-3">
        <section className="flex w-full min-w-0 flex-col self-start rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 shadow-xl backdrop-blur sm:rounded-3xl sm:p-5">
          <ol className="[@media(max-height:480px)]:hidden mb-2.5 grid gap-1.5 sm:mb-4 sm:gap-2" style={{ gridTemplateColumns: `repeat(${stepLabels.length}, minmax(0, 1fr))` }} aria-label="progress">
            {stepLabels.map((label, i) => (
              <li key={label} className="flex flex-col gap-1">
                <span className="relative h-2.5 overflow-hidden rounded-full bg-zinc-800">
                  <span
                    ref={(el) => {
                      barRefs.current[i] = el;
                    }}
                    className="block h-full rounded-full bg-emerald-400"
                    style={{ width: i < stepIndex ? "100%" : "0%" }}
                  />
                </span>
                <span className={`truncate text-[11px] sm:text-xs ${i === stepIndex ? "font-bold text-emerald-300" : i < stepIndex ? "font-medium text-zinc-300" : "font-medium text-zinc-500"}`}>{label}</span>
              </li>
            ))}
          </ol>

          {/* Pitch view: action buttons float over it while it's idle, and shrink to the corner while singing. */}
          <div className="relative min-h-40 shrink-0 sm:min-h-52 md:min-h-56 [@media(max-height:600px)]:min-h-40">
            <div className="absolute inset-0">
              <PitchCanvas idleLabel={t.idleLabel} phase={phase} lang={lang} />
            </div>
            {canvasIdle ? (
              <div className="relative z-10 flex min-h-40 flex-col items-center justify-center gap-2.5 rounded-2xl bg-zinc-950/80 p-3 backdrop-blur-[2px] sm:min-h-52 sm:gap-3 md:min-h-56 [@media(max-height:600px)]:min-h-40">
                {finished && def && evaluation && (
                  <div
                    role="status"
                    className={`flex w-full max-w-md items-center gap-3 rounded-2xl border-2 p-2.5 shadow-lg sm:gap-4 sm:p-3 ${
                      phase === "SUCCESS" ? "border-green-400 bg-green-500/15 text-green-100" : "border-red-400 bg-red-500/15 text-red-100"
                    }`}
                  >
                    {getMascotCharacter(currentId) && (
                      <div className={`h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 shadow-lg sm:h-28 sm:w-28 ${phase === "SUCCESS" ? "border-green-400" : "border-red-400"}`}>
                        <Mascot intervalId={currentId} revealed mood={mood} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-center">
                      <p className={`flex items-center justify-center gap-2 text-lg font-extrabold sm:text-2xl ${phase === "SUCCESS" ? "text-green-300" : "text-red-300"}`}>
                        <span aria-hidden>{phase === "SUCCESS" ? "✓" : "✕"}</span>
                        {t.phase[phase]}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold opacity-95">
                        {getMascotReaction(currentId, phase === "SUCCESS" ? "happy" : "sad", def.song.artist ?? def.song.title)}
                      </p>
                      <p className="mt-1.5 text-xs font-medium opacity-80 sm:text-sm">
                        {t.wasIt}: <b>{def.name[lang]}</b> ({def.direction === "asc" ? t.ascending : t.descending}) · {t.error}{" "}
                        {evaluation.errorCents >= 0 ? "+" : ""}
                        {evaluation.errorCents.toFixed(0)} {t.cents}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5 sm:gap-3">
                <button onClick={startChallenge} className="btn btn-primary px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base">
                  <span aria-hidden>▶</span>
                  {phase === "IDLE" ? (
                    mainLabel
                  ) : (
                    <>
                      <span className="lg:hidden">{t.nextShort}</span>
                      <span className="hidden lg:inline">{mainLabel}</span>
                    </>
                  )}
                </button>
                {def && (
                  <button onClick={replay} className="btn btn-ghost px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base">
                    <span aria-hidden>↻</span>
                    <span className="lg:hidden">{t.replayShort}</span>
                    <span className="hidden lg:inline">{t.replay}</span>
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

          {!isRandom && (
            <MiniPiano
              rootMidi={rootMidi ?? (activeDef ? 60 : null)}
              rootHz={rootHz}
              semitones={activeDef ? signedSemitones(activeDef) : null}
              revealed={revealed}
              phase={phase}
              evaluation={evaluation}
              lang={lang}
            />
          )}

          {micError && <p className="mt-2 rounded-xl bg-red-950/60 p-2 text-xs text-red-300 sm:text-sm">{t.micDenied}</p>}
        </section>

        <div className="flex flex-col gap-2.5 sm:gap-3 md:overflow-y-auto [@media(max-height:480px)]:overflow-y-auto">
          <section aria-label={isRandom ? t.modeRandom : t.pickInterval}>
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
              <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 shadow-lg backdrop-blur sm:gap-3.5 sm:rounded-3xl sm:p-4">
                <button
                  type="button"
                  onClick={() => setDirection(asc ? "desc" : "asc")}
                  disabled={busy}
                  aria-label={`${t.direction}: ${asc ? t.ascending : t.descending}. ${t.switchDirection}`}
                  title={t.switchDirection}
                  className={`btn h-12 w-12 shrink-0 rounded-2xl border-2 p-0 sm:h-14 sm:w-14 ${
                    asc
                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-200 shadow-[0_4px_0_0_var(--accent-edge)] enabled:active:translate-y-0.75 enabled:active:shadow-[0_1px_0_0_var(--accent-edge)]"
                      : "border-violet-400 bg-violet-400/15 text-violet-200 shadow-[0_4px_0_0_#5b21b6] enabled:active:translate-y-0.75 enabled:active:shadow-[0_1px_0_0_#5b21b6]"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className={`h-6 w-6 transition-transform duration-300 sm:h-7 sm:w-7 ${asc ? "" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20V4M5 11l7-7 7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setPickOpen(true)}
                  disabled={busy}
                  className="group min-w-0 flex-1 rounded-xl px-1 py-0.5 text-left transition hover:bg-zinc-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed"
                >
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-400 sm:text-[11px]">
                    {lang === "es" ? "Intervalo" : "Interval"}
                    <span className="hidden sm:inline">{lang === "es" ? " a cantar" : " to sing"}</span>
                    {activeDef
                      ? ` · ${activeDef.semitones} ${
                          lang === "es"
                            ? activeDef.semitones === 1
                              ? "semitono"
                              : "semitonos"
                            : activeDef.semitones === 1
                              ? "semitone"
                              : "semitones"
                        }`
                      : ""}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="truncate text-lg font-extrabold leading-tight tracking-tight text-white transition-colors group-hover:text-emerald-200 sm:text-2xl">
                      {activeDef?.name[lang] ?? options.find((o) => o.id === selection)?.label ?? ""}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-xs ${
                        asc ? "bg-emerald-400/15 text-emerald-300" : "bg-violet-400/15 text-violet-300"
                      }`}
                    >
                      {asc ? t.ascending : t.descending} {asc ? "↑" : "↓"}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPickOpen(true)}
                  disabled={busy}
                  className="btn shrink-0 gap-1.5 rounded-xl border border-emerald-400/60 bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-200 shadow-[0_3px_0_0_var(--accent-edge)] transition hover:bg-emerald-400/25 enabled:active:translate-y-0.5 enabled:active:shadow-[0_1px_0_0_var(--accent-edge)] disabled:cursor-not-allowed sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                  {lang === "es" ? "Cambiar" : "Change"}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-2.5 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold text-violet-200 sm:text-sm">{t.helpTitle}</h2>
              </div>
              <p className="hidden text-xs text-zinc-400 sm:block [@media(max-height:480px)]:hidden!">{t.helpText}</p>

              {activeDef && revealed && activeDef.songs && activeDef.songs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {activeDef.songs.map((s, idx) => {
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

              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200/90 sm:gap-3 sm:px-3 sm:py-2 sm:text-xs">
                <span className="grid h-6 w-6 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-base sm:text-2xl shadow-sm select-none" role="img" aria-label="Perezoso">
                  🦥
                </span>
                <p className="leading-snug">
                  Algunos ejemplos aún no han sido revisados por el desarrollador.
                </p>
              </div>

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

      {isRandom ? (
        <IdentifyModal
          open={identifying}
          labels={{
            title: t.identifyTitle,
            direction: t.guessDirection,
            interval: t.guessInterval,
            ascending: t.ascending,
            descending: t.descending,
            submit: t.submitGuess,
          }}
          options={options}
          onAnswer={answer}
        />
      ) : (
        <IdentifyModal
          open={pickOpen}
          labels={{
            title: t.pickInterval,
            direction: t.direction,
            interval: t.guessInterval,
            ascending: t.ascending,
            descending: t.descending,
            submit: lang === "es" ? "Seleccionar" : "Select",
          }}
          options={options}
          initialDirection={direction}
          initialInterval={selection === "random" ? lastPick : selection}
          onClose={() => setPickOpen(false)}
          onAnswer={(id, dir) => {
            setLastPick(id);
            setSelection(id);
            setDirection(dir);
            setPickOpen(false);
          }}
        />
      )}

      <footer className="hidden text-center text-xs text-zinc-600 md:block">{t.footer}</footer>
    </main>
    </SuiteShell>
  );
}
