import Link from "next/link";
import { ScoreEditor } from "@/components/score/score-editor";

export const metadata = { title: "Partitura — dictá y se escribe" };

export default function ScorePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 text-zinc-100">
      <header>
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Suite</Link>
        <h1 className="bg-linear-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-3xl font-bold text-transparent">
          partitura
        </h1>
        <p className="text-sm text-zinc-400">Decile qué escribir: figuras, notas, tresillos y silencios.</p>
      </header>
      <ScoreEditor />
    </main>
  );
}
