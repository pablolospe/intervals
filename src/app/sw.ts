/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Service worker source. It is NOT part of the app bundle: the route handler in `serwist/[path]/route.ts`
// bundles it with esbuild and serves it at /serwist/sw.js. Type-checked separately (tsconfig.sw.json).
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // No `skipWaiting`: a new version waits until the user accepts it (see <UpdatePrompt />), so the app
  // never swaps its own code in the middle of an exercise.
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
