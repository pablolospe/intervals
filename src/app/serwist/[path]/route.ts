import { createSerwistRoute } from "@serwist/turbopack";
import { cacheLife } from "next/cache";

// Pages worth having ready offline. Their HTML is a static shell (cacheComponents), so it can be precached.
const PAGES = ["/", "/intervalos/adivinar", "/intervalos/cantar", "/ritmo", "/resultados", "/~offline"];

// Versions the precached pages: a new value per build makes the service worker refresh them.
// (Hashed files under /_next/static keep their own hash and are not re-downloaded.)
const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? crypto.randomUUID();

const route = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  additionalPrecacheEntries: PAGES.map((url) => ({ url, revision })),
  // The defaults skip fonts, which next/font self-hosts under /_next/static/media.
  globPatterns: [
    ".next/static/**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,avif,gif,json,webmanifest,woff,woff2}",
    "public/**/*",
  ],
  // A single output file: no sourcemap, so there is nothing that could be built apart from sw.js.
  esbuildOptions: { sourcemap: false },
  useNativeEsbuild: true,
});

/** The only file this route serves. */
const FILES = ["sw.js"];

export const generateStaticParams = () => FILES.map((path) => ({ path }));

/**
 * Bundling the worker (esbuild + a glob of the build output) is I/O that Cache Components would treat as dynamic,
 * making the route render on every request, which needs esbuild and `sw.ts` at runtime. Inside `use cache` it runs
 * once at build time and the result is served as a static file.
 */
async function buildFile(path: string) {
  "use cache";
  cacheLife("max");
  const response = await route.GET(new Request("http://localhost"), { params: Promise.resolve({ path }) });
  return { body: await response.text(), contentType: response.headers.get("Content-Type") ?? "application/javascript" };
}

export async function GET(_request: Request, context: { params: Promise<{ path: string }> }) {
  const { path } = await context.params;
  if (!FILES.includes(path)) return new Response("Not found", { status: 404 });
  const { body, contentType } = await buildFile(path);
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      // The script lives under /serwist/, so it needs this header to control the whole site.
      "Service-Worker-Allowed": "/",
    },
  });
}
