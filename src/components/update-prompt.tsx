"use client";
import { useSerwist } from "@serwist/turbopack/react";
import { useEffect, useRef, useState } from "react";

/**
 * A new version of the app is downloaded in the background and waits. This asks before swapping it in,
 * so the page never reloads by itself in the middle of an exercise.
 */
export function UpdatePrompt() {
  const { serwist } = useSerwist();
  const [waiting, setWaiting] = useState(false);
  const accepted = useRef(false);

  useEffect(() => {
    if (!serwist) return;
    const onWaiting = () => setWaiting(true);
    // The new worker took control: reload only if the user asked (the first install also fires this).
    const onControlling = () => {
      if (accepted.current) window.location.reload();
    };
    serwist.addEventListener("waiting", onWaiting);
    serwist.addEventListener("controlling", onControlling);
    return () => {
      serwist.removeEventListener("waiting", onWaiting);
      serwist.removeEventListener("controlling", onControlling);
    };
  }, [serwist]);

  if (!waiting) return null;

  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-3 text-sm shadow-2xl shadow-black/60">
      <span className="text-zinc-200">Hay una versión nueva de BurpEars.</span>
      <span className="flex shrink-0 gap-2">
        <button onClick={() => setWaiting(false)} className="rounded-full px-3 py-1.5 font-semibold text-zinc-300 hover:bg-zinc-800">
          Después
        </button>
        <button
          onClick={() => {
            accepted.current = true;
            serwist?.messageSkipWaiting();
          }}
          className="rounded-full bg-[#14d6cc] px-3 py-1.5 font-bold text-zinc-950 hover:brightness-110"
        >
          Actualizar
        </button>
      </span>
    </div>
  );
}
