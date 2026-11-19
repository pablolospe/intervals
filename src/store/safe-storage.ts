import { createJSONStorage, type StateStorage } from "zustand/middleware";

/** In-memory fallback for when localStorage is missing (SSR, tests) or throws (private mode, quota, blocked site data). */
function memoryStorage(): StateStorage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

function browserStorage(): StateStorage {
  const fallback = memoryStorage();
  const guard = <T,>(run: () => T, otherwise: () => T): T => {
    try {
      return run();
    } catch {
      return otherwise();
    }
  };
  return {
    getItem: (k) => guard(() => localStorage.getItem(k), () => fallback.getItem(k) as string | null),
    setItem: (k, v) => guard(() => localStorage.setItem(k, v), () => fallback.setItem(k, v) as void),
    removeItem: (k) => guard(() => localStorage.removeItem(k), () => fallback.removeItem(k) as void),
  };
}

/** `createJSONStorage` over localStorage that never throws and degrades to memory. */
export const safeStorage = createJSONStorage(() =>
  typeof window === "undefined" ? memoryStorage() : browserStorage(),
);
