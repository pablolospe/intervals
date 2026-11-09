import Link from "next/link";
import { RhythmTrainer } from "@/components/rhythm/rhythm-trainer";

export const metadata = { title: "Ritmo — dictado rítmico" };

export default function RhythmPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 text-zinc-100">
      <header>
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Suite</Link>
        <h1 className="bg-linear-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-3xl font-bold text-transparent">
          ritmo
        </h1>
        <p className="text-sm text-zinc-400">Escuchá un compás de 4 tiempos y armalo eligiendo la célula de cada tiempo.</p>
      </header>
      <RhythmTrainer />
    </main>
  );
}
