"use client";
import { useEffect, useRef, useState } from "react";
import type { Direction } from "@/lib/audio/intervals-catalog";

export interface IdentifyOption {
  id: string;
  label: string;
}

export interface IdentifyLabels {
  title: string;
  subtitle: string;
  direction: string;
  interval: string;
  ascending: string;
  descending: string;
  submit: string;
}

interface Props {
  open: boolean;
  labels: IdentifyLabels;
  options: IdentifyOption[];
  onAnswer: (id: string, direction: Direction) => void;
}

function Arrow({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-10 w-10 sm:h-12 sm:w-12 ${up ? "" : "rotate-180"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20V4M5 11l7-7 7 7" />
    </svg>
  );
}

/** Blocking "which interval was it, up or down?" dialog built on the native <dialog> (focus trap + inert page). */
export function IdentifyModal({ open, labels, options, onAnswer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [direction, setDirection] = useState<Direction | null>(null);
  const [interval, setInterval] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const dirBtn = (dir: Direction) => {
    const on = direction === dir;
    const up = dir === "asc";
    const color = up
      ? on
        ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 shadow-[0_4px_0_0_var(--accent-edge)]"
        : "border-zinc-600 bg-zinc-800 text-zinc-200 hover:border-emerald-400/70"
      : on
        ? "border-violet-400 bg-violet-400/20 text-violet-100 shadow-[0_4px_0_0_#5b21b6]"
        : "border-zinc-600 bg-zinc-800 text-zinc-200 hover:border-violet-400/70";
    return (
      <button
        key={dir}
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => setDirection(dir)}
        className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${color}`}
      >
        <Arrow up={up} />
        {up ? labels.ascending : labels.descending}
      </button>
    );
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => e.preventDefault()} // Escape must not skip the answer
      aria-labelledby="identify-title"
      className="m-auto w-[min(92vw,34rem)] max-h-[92dvh] overflow-y-auto rounded-3xl border border-violet-400/40 bg-zinc-900 p-5 text-zinc-100 shadow-2xl shadow-black/60 backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:p-6"
    >
      <h2 id="identify-title" className="text-xl font-semibold text-violet-200">
        {labels.title}
      </h2>
      <p className="mb-4 text-sm text-zinc-400">{labels.subtitle}</p>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-300">1 · {labels.direction}</h3>
      <div role="radiogroup" aria-label={labels.direction} className="mb-4 flex gap-2">
        {dirBtn("asc")}
        {dirBtn("desc")}
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-300">2 · {labels.interval}</h3>
      <div role="radiogroup" aria-label={labels.interval} className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={interval === o.id}
            onClick={() => setInterval(o.id)}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
              interval === o.id
                ? "border-emerald-400 bg-emerald-400/15 text-emerald-100"
                : "border-zinc-700 bg-zinc-800 text-zinc-100 hover:border-zinc-400"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!direction || !interval}
        onClick={() => {
          if (!direction || !interval) return;
          onAnswer(interval, direction);
          // Fresh choices for the next round.
          setDirection(null);
          setInterval(null);
        }}
        className="btn btn-accent mt-5 w-full py-3 text-base"
      >
        {labels.submit}
        {direction && interval && (
          <span className="font-normal">
            · {options.find((o) => o.id === interval)?.label} {direction === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    </dialog>
  );
}
