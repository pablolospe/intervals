"use client";
import { useEffect, useRef } from "react";

export interface IdentifyOption {
  id: string;
  label: string;
  arrow: string;
}

interface Props {
  open: boolean;
  title: string;
  subtitle: string;
  options: IdentifyOption[];
  onPick: (id: string) => void;
}

/** Blocking "which interval was it?" dialog built on the native <dialog> (focus trap + inert page). */
export function IdentifyModal({ open, title, subtitle, options, onPick }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => e.preventDefault()} // Escape must not skip the answer
      aria-labelledby="identify-title"
      className="m-auto w-[min(92vw,34rem)] max-h-[92dvh] overflow-y-auto rounded-3xl border border-emerald-400/30 bg-zinc-900 p-6 text-zinc-100 shadow-2xl shadow-black/60 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <h2 id="identify-title" className="text-xl font-semibold text-emerald-300">
        {title}
      </h2>
      <p className="mb-4 text-sm text-zinc-400">{subtitle}</p>
      <div className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onPick(o.id)}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-3 text-left text-sm transition hover:border-emerald-400 hover:bg-emerald-400/10"
          >
            {o.label} <span className="text-zinc-500">{o.arrow}</span>
          </button>
        ))}
      </div>
    </dialog>
  );
}
