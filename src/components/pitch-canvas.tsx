"use client";
import { useEffect, useRef } from "react";
import { frequencyToNote } from "@/lib/audio/music-math";
import type { Lang } from "@/lib/i18n";
import { live } from "@/lib/live-pitch";
import type { Phase } from "@/store/trainer-store";

const GOOD = "#34d399";
const WARN = "#fbbf24";
const DIM = "#52525b";
const SHOW_CIRCULAR_PROGRESS = false;

/** 60fps oscilloscope + tuner needle (±50 cents) + large translucent hold circle. Reads `live`, never React state. */
export function PitchCanvas({ idleLabel, phase }: { idleLabel: string; phase?: Phase; lang?: Lang }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ idleLabel, phase });
  stateRef.current = { idleLabel, phase };

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

      const { idleLabel: curIdleLabel, phase: curPhase } = stateRef.current;
      const note = live.frequency ? frequencyToNote(live.frequency) : null;
      const inTune = note !== null && Math.abs(note.cents) <= 35;
      const color = note ? (inTune ? GOOD : WARN) : DIM;
      const singing = curPhase === "SINGING_ROOT" || curPhase === "SINGING_TARGET";

      // Large, semi-transparent circular hold progress centered behind the tuner.
      if (SHOW_CIRCULAR_PROGRESS && singing) {
        const ringX = w / 2;
        const ringY = h * 0.48;
        const ringR = Math.min(w, h) * 0.38;
        g.save();
        g.lineWidth = 10;
        g.strokeStyle = "rgba(255, 255, 255, 0.07)";
        g.beginPath();
        g.arc(ringX, ringY, ringR, 0, Math.PI * 2);
        g.stroke();

        if (live.progress > 0) {
          const startAng = -Math.PI / 2;
          const endAng = startAng + Math.PI * 2 * live.progress;
          g.fillStyle = "rgba(52, 211, 153, 0.16)";
          g.beginPath();
          g.moveTo(ringX, ringY);
          g.arc(ringX, ringY, ringR, startAng, endAng);
          g.closePath();
          g.fill();

          g.lineCap = "round";
          g.strokeStyle = "rgba(52, 211, 153, 0.55)";
          g.beginPath();
          g.arc(ringX, ringY, ringR, startAng, endAng);
          g.stroke();
        }
        g.restore();
      }

      // Oscilloscope, triggered on the first rising zero crossing for a steady trace.
      const buf = live.buffer;
      const waveH = h * 0.5;
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

      // Note name.
      g.fillStyle = color;
      g.textAlign = "center";
      const fs = Math.max(18, Math.min(40, h * 0.14));
      const ny = h * 0.62;
      g.font = `600 ${fs}px var(--font-geist-sans), sans-serif`;
      const label = note ? `${note.name}${note.octave}` : "—";
      g.fillText(label, w / 2, ny);
      if (!note) {
        g.font = `${Math.max(11, fs * 0.35)}px var(--font-geist-sans), sans-serif`;
        g.fillText(curIdleLabel, w / 2, ny + fs * 0.52);
      } else {
        const nameW = g.measureText(label).width;
        g.font = `${Math.max(11, fs * 0.4)}px var(--font-geist-mono), monospace`;
        g.textAlign = "left";
        g.fillText(`${note.cents >= 0 ? "+" : ""}${note.cents.toFixed(0)}¢`, w / 2 + nameW / 2 + 8, ny);
        g.textAlign = "center";
      }

      // Cents gauge: -50..+50, good zone ±35.
      const pad = 24;
      const gy = h * 0.84;
      const x0 = pad;
      const x1 = w - pad;
      const xc = (c: number) => x0 + ((c + 50) / 100) * (x1 - x0);
      g.fillStyle = "rgba(52,211,153,0.18)";
      g.fillRect(xc(-35), gy - 8, xc(35) - xc(-35), 16);
      g.strokeStyle = DIM;
      g.lineWidth = 1;
      g.strokeRect(x0, gy - 8, x1 - x0, 16);
      g.beginPath();
      g.moveTo(xc(0), gy - 12);
      g.lineTo(xc(0), gy + 12);
      g.stroke();
      if (note) {
        const x = xc(Math.max(-50, Math.min(50, note.cents)));
        g.strokeStyle = color;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, gy - 14);
        g.lineTo(x, gy + 14);
        g.stroke();
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
