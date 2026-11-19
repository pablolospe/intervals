"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRhythm } from "@/store/rhythm-store";
import { useTrainer } from "@/store/trainer-store";

/**
 * Loads the saved progress from localStorage once the page is mounted.
 * The server (and the first client render) can't read it, so the stores use `skipHydration`
 * and are filled here, which avoids hydration mismatches.
 */
export function StoreHydrator() {
  useEffect(() => {
    void useTrainer.persist.rehydrate();
    void useRhythm.persist.rehydrate();
    // Ask the browser not to evict our data when it is short on space. Best effort: ignore refusals.
    void navigator.storage?.persist?.().catch(() => {});
  }, []);
  return null;
}

function subscribe(onChange: () => void) {
  const offTrainer = useTrainer.persist.onFinishHydration(onChange);
  const offRhythm = useRhythm.persist.onFinishHydration(onChange);
  return () => {
    offTrainer();
    offRhythm();
  };
}

const isHydrated = () => useTrainer.persist.hasHydrated() && useRhythm.persist.hasHydrated();

/** False on the server and until the saved progress has been loaded; use it to avoid flashing zeros. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, isHydrated, () => false);
}
