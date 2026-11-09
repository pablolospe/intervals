import Link from "next/link";
import { RhythmTrainer } from "@/components/rhythm/rhythm-trainer";

export const metadata = { title: "Ritmo — dictado rítmico" };

export default function RhythmPage() {
  return (
    <main className="mx-auto flex h-dvh max-h-screen w-full max-w-5xl flex-col overflow-hidden p-2.5 sm:p-4 text-zinc-100">
      <header className="mb-2 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="group inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>Suite</span>
          </Link>
          <span className="text-zinc-700">·</span>
          <h1 className="bg-linear-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-lg sm:text-2xl font-bold text-transparent">
            ritmo
          </h1>
        </div>
        <p className="hidden text-xs text-zinc-400 sm:block">Escuchá un compás de 4 tiempos y armalo eligiendo la célula de cada tiempo.</p>
      </header>
      <RhythmTrainer />
    </main>
  );
}
