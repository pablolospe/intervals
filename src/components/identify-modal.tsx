"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Direction } from "@/lib/audio/intervals-catalog";

export interface IdentifyOption {
  id: string;
  label: string;
}

export interface IdentifyLabels {
  title: string;
  subtitle?: string;
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
  initialDirection?: Direction | null;
  initialInterval?: string | null;
  onClose?: () => void;
  onAnswer: (id: string, direction: Direction) => void;
}

function Arrow({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-5 w-5 sm:h-6 sm:w-6 ${up ? "" : "rotate-180"}`}
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

/** Direction + interval dialog built on native <dialog> (blocking for guess mode, dismissible with `onClose` for picker mode). */
export function IdentifyModal({
  open,
  labels,
  options,
  initialDirection = null,
  initialInterval = null,
  onClose,
  onAnswer,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [direction, setDirection] = useState<Direction | null>(initialDirection);
  const [interval, setInterval] = useState<string | null>(initialInterval);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      setDirection(initialDirection ?? null);
      setInterval(initialInterval ?? null);
      if (!d.open) d.showModal();
    } else if (d.open) {
      d.close();
    }
  }, [open, initialDirection, initialInterval]);

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
        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:py-3 sm:text-sm ${color}`}
      >
        <Arrow up={up} />
        {up ? labels.ascending : labels.descending}
      </button>
    );
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (onClose) onClose(); // Escape skips only when dismissible
      }}
      onClick={(e) => {
        if (onClose && e.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      className="m-auto w-[min(92vw,34rem)] max-h-[92dvh] overflow-y-auto rounded-3xl border border-violet-400/40 bg-zinc-900 p-0 text-zinc-100 shadow-2xl shadow-black/60 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-3.5 sm:p-6">
        <h2 id={titleId} className="sr-only">
          {labels.title}
        </h2>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">1 · {labels.direction}</h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-400 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:h-8 sm:w-8 sm:text-sm"
            >
              ✕
            </button>
          )}
        </div>
      <div role="radiogroup" aria-label={labels.direction} className="mb-3 flex gap-2 sm:mb-4">
        {dirBtn("asc")}
        {dirBtn("desc")}
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-300">2 · {labels.interval}</h3>
      <div role="radiogroup" aria-label={labels.interval} className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={interval === o.id}
            onClick={() => setInterval(o.id)}
            className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:px-3 sm:py-2.5 sm:text-sm ${
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
        className="btn btn-accent mt-3.5 w-full py-2.5 text-sm sm:mt-5 sm:py-3 sm:text-base"
      >
        {labels.submit}
        {direction && interval && (
          <span className="font-normal">
            · {options.find((o) => o.id === interval)?.label} {direction === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
      </div>
    </dialog>
  );
}
