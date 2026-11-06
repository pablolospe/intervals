"use client";
import { useEffect, useRef } from "react";
import { frequencyToNote } from "@/lib/audio/music-math";
import { live } from "@/lib/live-pitch";

const GOOD = "#34d399";
const WARN = "#fbbf24";
const DIM = "#52525b";

/** 60fps oscilloscope + tuner needle (±50 cents) + stabilization bar. Reads `live`, never React state. */
export function PitchCanvas({ idleLabel }: { idleLabel: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

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
      const note = live.frequency ? frequencyToNote(live.frequency) : null;
      const inTune = note !== null && Math.abs(note.cents) <= 35;
      const color = note ? (inTune ? GOOD : WARN) : DIM;

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
      g.font = "600 40px var(--font-geist-sans), sans-serif";
      g.fillText(note ? `${note.name}${note.octave}` : "—", w / 2, h * 0.68);
      if (!note) {
        g.font = "14px var(--font-geist-sans), sans-serif";
        g.fillText(idleLabel, w / 2, h * 0.68 + 24);
      }

      // Cents gauge: -50..+50, good zone ±35.
      const pad = 24;
      const gy = h * 0.82;
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
        g.fillStyle = color;
        g.font = "12px var(--font-geist-mono), monospace";
        g.fillText(`${note.cents >= 0 ? "+" : ""}${note.cents.toFixed(0)}¢`, x, gy + 30);
      }

      // Stabilization bar.
      const by = h - 14;
      g.fillStyle = "#27272a";
      g.fillRect(x0, by, x1 - x0, 6);
      g.fillStyle = GOOD;
      g.fillRect(x0, by, (x1 - x0) * live.progress, 6);

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [idleLabel]);

  return <canvas ref={ref} className="h-72 w-full rounded-2xl border border-zinc-800 bg-zinc-950/80" aria-label="Pitch visualizer" />;
}
