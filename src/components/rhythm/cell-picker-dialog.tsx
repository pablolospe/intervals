"use client";
import { useEffect, useRef, useState } from "react";
import { basicDisabled, cellsFor, hasRest, MIN_CELLS, type RhythmCell } from "@/lib/rhythm/cells";
import { useRhythm } from "@/store/rhythm-store";
import { RhythmNotation } from "./rhythm-notation";

const NOTICE = `Dejá al menos ${MIN_CELLS} células activas (y alguna que no sea un silencio de negra).`;

export function CellPickerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const subdivision = useRhythm((s) => s.subdivision);
  const disabled = useRhythm((s) => s.disabledCells[subdivision]);
  const [notice, setNotice] = useState(false);

  // The dialog is opened and closed through the DOM API; `open` only mirrors it.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Safari has no `closedby="any"`: close when the press starts and ends outside the dialog box.
  useEffect(() => {
    const d = ref.current;
    if (!d || "closedBy" in HTMLDialogElement.prototype) return;
    const outside = (e: PointerEvent) => {
      const r = d.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    const down = (e: PointerEvent) => (pressedOutside = outside(e));
    const up = (e: PointerEvent) => {
      if (pressedOutside && outside(e)) d.close();
    };
    d.addEventListener("pointerdown", down);
    d.addEventListener("pointerup", up);
    return () => {
      d.removeEventListener("pointerdown", down);
      d.removeEventListener("pointerup", up);
    };
  }, []);

  const all = cellsFor(subdivision);
  const plain = all.filter((c) => !hasRest(c));
  const rests = all.filter(hasRest);
  const active = all.length - disabled.length;

  /** Runs a store change and tells the user when it was refused for leaving too few cells. */
  const run = (ok: boolean) => setNotice(!ok);

  const toggle = (c: RhythmCell) => run(useRhythm.getState().setCellsEnabled([c.id], disabled.includes(c.id)));

  const toggleGroup = (group: RhythmCell[]) => {
    const ids = group.map((c) => c.id);
    const allOn = ids.every((id) => !disabled.includes(id));
    run(useRhythm.getState().setCellsEnabled(ids, !allOn));
  };

  const preset = (ids: string[]) => run(useRhythm.getState().selectCells(ids));

  return (
    <dialog
      ref={ref}
      aria-labelledby="cells-title"
      // Click outside closes it (Chrome/Firefox natively, Safari via the effect above).
      {...({ closedby: "any" } as object)}
      onClose={() => {
        setNotice(false);
        onClose();
      }}
      className="m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-3xl border border-zinc-700 bg-zinc-900 p-0 text-zinc-100 shadow-2xl shadow-black/50 sm:m-auto sm:max-w-2xl sm:rounded-3xl"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 pb-3 pt-4 sm:px-5">
          <div>
            <h2 id="cells-title" className="text-base font-extrabold text-emerald-400 sm:text-lg">
              Células del dictado
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {subdivision === "ternary" ? "Ternaria (12/8)" : "Binaria (4/4)"} · tocá una célula para activarla o quitarla.
            </p>
          </div>
          <form method="dialog">
            <button className="chip h-8 w-8 px-0! text-sm" aria-label="Cerrar">
              <span aria-hidden>✕</span>
            </button>
          </form>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Atajos">
            <button className="chip" onClick={() => preset(all.map((c) => c.id))}>Todas</button>
            <button className="chip" onClick={() => preset(all.map((c) => c.id).filter((id) => !basicDisabled(subdivision).includes(id)))}>
              Básicas
            </button>
          </div>

          {([
            ["Sin silencios", plain],
            ["Con silencios", rests],
          ] as const).map(([title, group]) => {
            const on = group.filter((c) => !disabled.includes(c.id)).length;
            return (
              <section key={title} className="mb-4 last:mb-1" aria-label={title}>
                <div className="mb-1.5 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-200">
                    {title} <span className="font-normal text-zinc-500">· {on}/{group.length}</span>
                  </h3>
                  <button
                    className="chip h-7"
                    aria-pressed={on === group.length ? true : on === 0 ? false : "mixed"}
                    onClick={() => toggleGroup(group)}
                  >
                    {on === group.length ? "Quitar todas" : "Activar todas"}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2">
                  {group.map((c) => {
                    const isOn = !disabled.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        aria-pressed={isOn}
                        onClick={() => toggle(c)}
                        className={`paper relative flex flex-col items-center gap-0.5 p-1 pb-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                          isOn ? "ring-2 ring-emerald-400" : "opacity-40 ring-1 ring-zinc-300 grayscale hover:opacity-70"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold ${
                            isOn ? "bg-emerald-400 text-zinc-950" : "border border-zinc-400 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <div className="flex h-10 w-full items-center justify-center sm:h-11">
                          <RhythmNotation ids={[c.id]} width={84} height={72} className="h-full w-auto" />
                        </div>
                        <span className="max-w-full truncate px-0.5 text-center text-[9.5px] font-medium leading-none text-zinc-600 sm:text-[10px]">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3 sm:px-5">
          <p role="status" className={`text-xs ${notice ? "font-semibold text-amber-300" : "text-zinc-400"}`}>
            {notice ? NOTICE : `${active} de ${all.length} células activas`}
          </p>
          <form method="dialog">
            <button className="btn btn-primary btn-sm px-5" autoFocus>Listo</button>
          </form>
        </footer>
      </div>
    </dialog>
  );
}
