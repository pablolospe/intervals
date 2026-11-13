import Link from "next/link";
import { EarArt, MouthArt, RhythmArt } from "@/components/illustrations";
import { SuiteShell } from "@/components/suite-shell";
import { MODULES } from "@/lib/modules";

export const metadata = { title: "BurpEars — entrená tus orejas" };

const ART = { recognize: EarArt, sing: MouthArt, rhythm: RhythmArt } as const;

export default function Home() {
  return (
    <SuiteShell>
      <main className="flex-1 px-4 pb-10 md:px-8 md:py-8">
        <ul className="mx-auto flex max-w-5xl snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
          {MODULES.map((m) => {
            const Art = ART[m.id];
            return (
              <li key={m.id} className="w-[82%] shrink-0 snap-center md:w-auto">
                <div className="flex h-full flex-col items-center gap-3 rounded-[2.5rem] border-2 border-zinc-700/70 bg-[#0b0c10] p-6 text-center">
                  <Art className="h-44 w-full" />
                  <h2 className="text-3xl font-extrabold leading-tight text-white">{m.title}</h2>
                  <p className="max-w-[16rem] flex-1 text-base text-zinc-300">{m.desc}</p>
                  <Link href={m.href} style={{ background: m.color }} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-lg font-bold text-zinc-950 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    Comenzar <span aria-hidden>→</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mx-auto mt-6 max-w-5xl text-center text-sm text-zinc-500">Partitura — próximamente</p>
      </main>
    </SuiteShell>
  );
}
