"use client";
import { useEffect, useRef } from "react";
import { frequencyToNote } from "@/lib/audio/music-math";
import type { Lang } from "@/lib/i18n";
import { live } from "@/lib/live-pitch";
import type { Phase } from "@/store/trainer-store";

const GOOD = "#34d399";
const WARN = "#fbbf24";
const DIM = "#52525b";

function pillPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}

function getPillState(slot: 1 | 2, phase: Phase | undefined, progress: number, lang: Lang) {
  const en = lang === "en";
  const p1Done = phase === "SINGING_TARGET" || phase === "IDENTIFY" || phase === "SUCCESS" || phase === "MISS";
  const p2Done = phase === "IDENTIFY" || phase === "SUCCESS" || phase === "MISS";
  const done = slot === 1 ? p1Done : p2Done;
  const active = slot === 1 ? phase === "SINGING_ROOT" : phase === "SINGING_TARGET";

  if (done) {
    return {
      progress: 1,
      done: true,
      active: false,
      label: slot === 1 ? (en ? "✓ 1st note" : "✓ 1ª nota lista") : en ? "✓ 2nd note" : "✓ 2ª nota lista",
    };
  }
  if (active) {
    const pct = Math.round(progress * 100);
    return {
      progress,
      done: false,
      active: true,
      label:
        progress > 0
          ? `${en ? "Hold!" : "¡Sostenela!"} ${pct}%`
          : slot === 1
            ? en
              ? "1st note · Hold"
              : "1ª nota · Sostené"
            : en
              ? "2nd note · Hold"
              : "2ª nota · Sostené",
    };
  }
  return {
    progress: 0,
    done: false,
    active: false,
    label: slot === 1 ? (en ? "1st note" : "1ª nota") : en ? "2nd note" : "2ª nota",
  };
}

/** 60fps oscilloscope + tuner needle (±50 cents) + hold ring & 2-step duration bars. Reads `live`, never React state. */
export function PitchCanvas({ idleLabel, phase, lang = "es" }: { idleLabel: string; phase?: Phase; lang?: Lang }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ idleLabel, phase, lang });
  stateRef.current = { idleLabel, phase, lang };

  useEffect(() => {
    const canvas = ref.current!;
    const g = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    let raf = 0;

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

    const draw = () => {
      g.clearRect(0, 0, w, h);
      if (w <= 0 || h <= 0) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const { idleLabel: curIdleLabel, phase: curPhase, lang: curLang } = stateRef.current;
      const note = live.frequency ? frequencyToNote(live.frequency) : null;
      const inTune = note !== null && Math.abs(note.cents) <= 35;
      const color = note ? (inTune ? GOOD : WARN) : DIM;

      // Oscilloscope, triggered on the first rising zero crossing for a steady trace.
      const buf = live.buffer;
      const waveH = h * 0.42;
      g.strokeStyle = color;
      g.lineWidth = 2.5;
      g.lineJoin = "round";
      g.shadowColor = color;
      g.shadowBlur = note ? 14 : 0;
      g.beginPath();
      if (buf) {
        let start = 0;
        while (start < buf.length / 2 && !(buf[start] <= 0 && buf[start + 1] > 0)) start++;
        const n = Math.min(1024, buf.length - start);
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) * w;
          const y = waveH / 2 + buf[start + i] * waveH * 0.9;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
      } else {
        g.moveTo(0, waveH / 2);
        g.lineTo(w, waveH / 2);
      }
      g.stroke();
      g.shadowBlur = 0;

      // Note name + circular hold progress ring right where the singer looks.
      const fs = Math.max(18, Math.min(40, h * 0.14));
      const ny = h * 0.56;
      const singing = curPhase === "SINGING_ROOT" || curPhase === "SINGING_TARGET";
      if (singing && live.progress > 0) {
        const ringY = ny - fs * 0.32;
        const ringR = fs * 0.85;
        g.save();
        g.lineWidth = 4;
        g.lineCap = "round";
        g.strokeStyle = "rgba(52, 211, 153, 0.18)";
        g.beginPath();
        g.arc(w / 2, ringY, ringR, 0, Math.PI * 2);
        g.stroke();

        g.strokeStyle = GOOD;
        g.beginPath();
        g.arc(w / 2, ringY, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * live.progress);
        g.stroke();
        g.restore();
      }

      g.fillStyle = color;
      g.textAlign = "center";
      g.font = `600 ${fs}px var(--font-geist-sans), sans-serif`;
      const label = note ? `${note.name}${note.octave}` : "—";
      g.fillText(label, w / 2, ny);
      if (!note) {
        g.font = `${Math.max(11, fs * 0.35)}px var(--font-geist-sans), sans-serif`;
        g.fillText(curIdleLabel, w / 2, ny + fs * 0.48);
      } else {
        const nameW = g.measureText(label).width;
        const centsOffset = Math.max(nameW / 2 + 8, singing && live.progress > 0 ? fs * 0.85 + 8 : 0);
        g.font = `${Math.max(11, fs * 0.4)}px var(--font-geist-mono), monospace`;
        g.textAlign = "left";
        g.fillText(`${note.cents >= 0 ? "+" : ""}${note.cents.toFixed(0)}¢`, w / 2 + centsOffset, ny);
        g.textAlign = "center";
      }

      // Cents gauge: -50..+50, good zone ±35.
      const pad = Math.max(14, Math.min(24, Math.round(w * 0.06)));
      const gy = h * 0.71;
      const x0 = pad;
      const x1 = w - pad;
      const xc = (c: number) => x0 + ((c + 50) / 100) * (x1 - x0);
      g.fillStyle = "rgba(52,211,153,0.18)";
      g.fillRect(xc(-35), gy - 7, xc(35) - xc(-35), 14);
      g.strokeStyle = DIM;
      g.lineWidth = 1;
      g.strokeRect(x0, gy - 7, x1 - x0, 14);
      g.beginPath();
      g.moveTo(xc(0), gy - 11);
      g.lineTo(xc(0), gy + 11);
      g.stroke();
      if (note) {
        const x = xc(Math.max(-50, Math.min(50, note.cents)));
        g.strokeStyle = color;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, gy - 12);
        g.lineTo(x, gy + 12);
        g.stroke();
      }

      // Two large bottom hold pills (1st note + 2nd note) so note duration is unmistakable.
      const bh = 22;
      const by = h - 30;
      const gap = 10;
      const pw = (x1 - x0 - gap) / 2;
      if (pw > 20) {
        const pills = [
          { x: x0, state: getPillState(1, curPhase, live.progress, curLang) },
          { x: x0 + pw + gap, state: getPillState(2, curPhase, live.progress, curLang) },
        ];
        for (const { x, state } of pills) {
          g.save();
          pillPath(g, x, by, pw, bh, bh / 2);
          g.fillStyle = "#18181b";
          g.fill();
          g.clip();

          g.font = `600 11px var(--font-geist-sans), sans-serif`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillStyle = state.active ? "#f4f4f5" : "#a1a1aa";
          g.fillText(state.label, x + pw / 2, by + bh / 2);

          if (state.progress > 0) {
            g.save();
            g.beginPath();
            g.rect(x, by, pw * state.progress, bh);
            g.clip();
            g.fillStyle = GOOD;
            g.fillRect(x, by, pw, bh);
            g.fillStyle = "#09090b";
            g.fillText(state.label, x + pw / 2, by + bh / 2);
            g.restore();
          }
          g.restore();

          pillPath(g, x, by, pw, bh, bh / 2);
          g.strokeStyle =
            state.done || (state.active && state.progress > 0)
              ? GOOD
              : state.active
                ? color === WARN
                  ? WARN
                  : "#a1a1aa"
                : "#3f3f46";
          g.lineWidth = state.active || state.done ? 1.5 : 1;
          g.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="block h-full w-full rounded-2xl border border-zinc-800 bg-zinc-950/80" aria-label="Pitch visualizer" />;
}
