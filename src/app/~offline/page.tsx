import Link from "next/link";

export const metadata = { title: "Sin conexión" };

/** Shown by the service worker when a page isn't available offline. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center text-zinc-100">
      <h1 className="text-3xl font-extrabold">Sin conexión</h1>
      <p className="text-zinc-300">
        No pudimos cargar esta pantalla. Las secciones que ya abriste siguen funcionando: volvé al inicio e intentá desde ahí.
      </p>
      <Link href="/" className="inline-flex items-center justify-center rounded-full bg-[#14d6cc] px-6 py-3 text-lg font-bold text-zinc-950 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        Ir al inicio
      </Link>
    </main>
  );
}
