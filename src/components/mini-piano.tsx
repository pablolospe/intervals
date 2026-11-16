"use client";
import { useEffect, useRef } from "react";
import type { IntervalEvaluation } from "@/lib/audio/interval-evaluator";
import { frequencyToMidi, frequencyToNote, pitchClass } from "@/lib/audio/music-math";
import type { Lang } from "@/lib/i18n";
import { live } from "@/lib/live-pitch";
import type { Phase } from "@/store/trainer-store";

export interface MiniPianoProps {
  rootMidi: number | null;
  rootHz: number | null;
  semitones: number | null;
  revealed: boolean;
  phase: Phase;
  evaluation: IntervalEvaluation | null;
  lang: Lang;
}

const NOTE_NAMES: Record<Lang, readonly string[]> = {
  es: ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"],
  en: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
};

const WHITE_SEMITONES = new Set([0, 2, 4, 5, 7, 9, 11]);
const TOTAL_KEYS = 25; // 2 full octaves C..C (15 white + 10 black)
const WHITE_KEY_COUNT = 15;

const SKY = "#38bdf8";
const VIOLET = "#a78bfa";
const GOOD = "#34d399";
const WARN = "#fbbf24";
const IDLE_COLOR = "#a1a1aa";

function isWhiteKey(midi: number): boolean {
  return WHITE_SEMITONES.has(((midi % 12) + 12) % 12);
}

function formatMidi(midi: number, lang: Lang): string {
  const rounded = Math.round(midi);
  const pc = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  return `${NOTE_NAMES[lang][pc]}${octave}`;
}

function foldIntoRange(midi: number, baseMidi: number, anchorMidi: number | null): number {
  if (midi >= baseMidi && midi <= baseMidi + 24) return midi;
  const anchor = anchorMidi ?? baseMidi + 12;
  let folded = midi - 12 * Math.round((midi - anchor) / 12);
  while (folded < baseMidi) folded += 12;
  while (folded > baseMidi + 24) folded -= 12;
  return folded;
}

interface KeyRect {
  midi: number;
  x: number;
  y: number;
  w: number;
  h: number;
  white: boolean;
}

function buildKeyRects(baseMidi: number, width: number, height: number): { whites: KeyRect[]; blacks: KeyRect[] } {
  const kw = width / WHITE_KEY_COUNT;
  const bw = kw * 0.62;
  const bh = height * 0.6;
  const whites: KeyRect[] = [];
  const blacks: KeyRect[] = [];
  let whiteIndex = 0;

  for (let offset = 0; offset < TOTAL_KEYS; offset++) {
    const midi = baseMidi + offset;
    if (isWhiteKey(midi)) {
      whites.push({ midi, x: whiteIndex * kw, y: 0, w: kw, h: height, white: true });
      whiteIndex++;
    } else {
      blacks.push({ midi, x: whiteIndex * kw - bw / 2, y: 0, w: bw, h: bh, white: false });
    }
  }

  return { whites, blacks };
}

/** Compact 2-octave guide piano under the pitch waveform showing Root, Target, and live sung note. */
export function MiniPiano({ rootMidi, rootHz, semitones, revealed, phase, evaluation, lang }: MiniPianoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const voiceTextRef = useRef<HTMLSpanElement>(null);

  const effectiveRootMidi = rootHz && rootHz > 0 ? Math.round(frequencyToMidi(rootHz)) : rootMidi;
  const targetMidi =
    effectiveRootMidi !== null && semitones !== null && revealed
      ? effectiveRootMidi + semitones
      : null;
  const minMidi = Math.min(effectiveRootMidi ?? 60, targetMidi ?? effectiveRootMidi ?? 60);
  const baseMidi = Math.floor(minMidi / 12) * 12;

  const finished = phase === "SUCCESS" || phase === "MISS";
  const finalSungMidi =
    finished && effectiveRootMidi !== null && evaluation
      ? Math.round(effectiveRootMidi + evaluation.normalized)
      : null;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    let raf = 0;
    let prevText = "";
    let prevColor = "";

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
      g.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawKey = (k: KeyRect, voiceMidi: number | null, voiceColor: string) => {
      const isRoot = effectiveRootMidi !== null && k.midi === effectiveRootMidi;
      const isTarget = targetMidi !== null && k.midi === targetMidi;
      const isVoice = voiceMidi !== null && k.midi === voiceMidi;

      let fill = k.white ? "#e4e4e7" : "#18181b";
      if (isVoice) fill = voiceColor;
      else if (isTarget) fill = VIOLET;
      else if (isRoot) fill = SKY;

      g.fillStyle = fill;
      g.beginPath();
      g.roundRect(k.x + 0.5, k.y, k.w - 1, k.h, [0, 0, k.white ? 3 : 2, k.white ? 3 : 2]);
      g.fill();

      g.strokeStyle = isVoice ? voiceColor : k.white ? "#27272a" : "#3f3f46";
      g.lineWidth = isVoice ? 1.5 : 1;
      g.stroke();

      // Badge ("1" for root, "2" for target) or base octave hint on leftmost C key.
      const badge = isTarget ? "2" : isRoot ? "1" : null;
      if (badge) {
        g.fillStyle = "#09090b";
        g.font = `700 ${k.white ? 10 : 8.5}px var(--font-geist-sans), sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "bottom";
        g.fillText(badge, k.x + k.w / 2, k.h - (k.white ? 3 : 2));
      } else if (k.midi === baseMidi) {
        g.fillStyle = isVoice ? "#09090b" : "#71717a";
        g.font = `600 8px var(--font-geist-sans), sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "bottom";
        g.fillText(formatMidi(k.midi, lang), k.x + k.w / 2, k.h - 2);
      }
    };

    const draw = () => {
      g.clearRect(0, 0, w, h);

      const liveNote = live.frequency ? frequencyToNote(live.frequency) : null;
      const rawVoiceMidi = finished ? finalSungMidi : liveNote?.midi ?? null;
      const expectedMidi =
        phase === "SINGING_ROOT"
          ? effectiveRootMidi
          : phase === "SINGING_TARGET" || finished
            ? targetMidi
            : revealed
              ? (effectiveRootMidi !== null && rawVoiceMidi !== null && pitchClass(rawVoiceMidi) === pitchClass(effectiveRootMidi)
                  ? effectiveRootMidi
                  : targetMidi)
              : null;

      const matchesExpected =
        finished && evaluation
          ? evaluation.correct
          : expectedMidi !== null &&
            rawVoiceMidi !== null &&
            pitchClass(rawVoiceMidi) === pitchClass(expectedMidi);

      const voiceColor = rawVoiceMidi !== null ? (matchesExpected ? GOOD : WARN) : IDLE_COLOR;
      const anchor = matchesExpected && expectedMidi !== null ? expectedMidi : targetMidi ?? effectiveRootMidi;
      const voiceMidi = rawVoiceMidi !== null ? foldIntoRange(rawVoiceMidi, baseMidi, anchor) : null;

      const nextText = rawVoiceMidi !== null ? formatMidi(rawVoiceMidi, lang) : "—";
      if (voiceTextRef.current && nextText !== prevText) {
        voiceTextRef.current.textContent = nextText;
        prevText = nextText;
      }
      if (voiceColor !== prevColor) {
        if (dotRef.current) dotRef.current.style.backgroundColor = rawVoiceMidi !== null ? voiceColor : "#52525b";
        if (voiceTextRef.current) voiceTextRef.current.style.color = rawVoiceMidi !== null ? voiceColor : "#a1a1aa";
        prevColor = voiceColor;
      }

      if (w > 0 && h > 0) {
        const { whites, blacks } = buildKeyRects(baseMidi, w, h);
        for (const wk of whites) drawKey(wk, voiceMidi, voiceColor);
        for (const bk of blacks) drawKey(bk, voiceMidi, voiceColor);
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [baseMidi, effectiveRootMidi, targetMidi, revealed, phase, evaluation, finished, finalSungMidi, lang]);

  return (
    <div className="mt-2 rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-2 sm:p-2.5">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] sm:text-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-400 text-[10px] font-bold text-zinc-950">
              1
            </span>
            <span className="text-zinc-400">{lang === "es" ? "Raíz" : "Root"}:</span>
            <b className="tabular-nums text-sky-200">
              {effectiveRootMidi !== null ? formatMidi(effectiveRootMidi, lang) : "—"}
            </b>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-400 text-[10px] font-bold text-zinc-950">
              2
            </span>
            <span className="text-zinc-400">{lang === "es" ? "Salto" : "Target"}:</span>
            <b className="tabular-nums text-violet-200">
              {targetMidi !== null ? formatMidi(targetMidi, lang) : "?"}
            </b>
          </span>
        </div>
        <span className="inline-flex items-center gap-1">
          <span ref={dotRef} className="h-2 w-2 rounded-full bg-zinc-600" />
          <span className="text-zinc-400">{lang === "es" ? "Tu voz" : "Voice"}:</span>
          <b ref={voiceTextRef} className="min-w-[2.5ch] tabular-nums text-zinc-400">
            —
          </b>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="block h-12 w-full rounded-lg sm:h-14"
        aria-label={lang === "es" ? "Piano guía" : "Guide piano"}
      />
    </div>
  );
}
