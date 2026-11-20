import Link from "next/link";
import { EarArt, MouthArt, RhythmArt, StatsArt } from "@/components/illustrations";
import { SuiteShell } from "@/components/suite-shell";
import { MODULES } from "@/lib/modules";

export const metadata = { title: "BurpEars — entrená tus orejas" };

const ART = { recognize: EarArt, sing: MouthArt, rhythm: RhythmArt, stats: StatsArt } as const;

function MeterArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" aria-hidden className={`select-none ${className}`}>
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M72 136 L88 40 L112 40 L128 136 Z" fill="#18181b" stroke="#52525b" strokeWidth="4" />
        <path d="M96 136 L100 32" stroke="#fbbf24" strokeWidth="4.5" />
        <circle cx="102" cy="68" r="8" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2.5" />
        <path d="M56 136 H144" stroke="#71717a" strokeWidth="5" />
        <text x="144" y="66" fill="#fbbf24" fontSize="28" fontWeight="bold" fontFamily="monospace">4</text>
        <text x="144" y="96" fill="#fbbf24" fontSize="28" fontWeight="bold" fontFamily="monospace">4</text>
      </g>
    </svg>
  );
}

function ScoreArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" aria-hidden className={`select-none ${className}`}>
      <g strokeLinecap="round" strokeLinejoin="round">
        <line x1="25" y1="45" x2="175" y2="45" stroke="#52525b" strokeWidth="3" />
        <line x1="25" y1="65" x2="175" y2="65" stroke="#52525b" strokeWidth="3" />
        <line x1="25" y1="85" x2="175" y2="85" stroke="#52525b" strokeWidth="3" />
        <line x1="25" y1="105" x2="175" y2="105" stroke="#52525b" strokeWidth="3" />
        <line x1="25" y1="125" x2="175" y2="125" stroke="#52525b" strokeWidth="3" />
        <ellipse cx="65" cy="105" rx="11" ry="8" transform="rotate(-20 65 105)" fill="#38bdf8" />
        <line x1="75" y1="102" x2="75" y2="52" stroke="#38bdf8" strokeWidth="4" />
        <ellipse cx="120" cy="85" rx="11" ry="8" transform="rotate(-20 120 85)" fill="#818cf8" />
        <line x1="130" y1="82" x2="130" y2="38" stroke="#818cf8" strokeWidth="4" />
        <line x1="75" y1="52" x2="130" y2="38" stroke="#818cf8" strokeWidth="6" />
      </g>
    </svg>
  );
}

const UPCOMING = [
  {
    title: "Reconocer tipos de compases",
    desc: "Binarios (2/4, 3/4, 4/4) · ternarios (6/8, 9/8, 12/8) · irregulares (5/4, 7/4…)",
    art: MeterArt,
  },
  {
    title: "Partitura",
    desc: "Lectura musical en pentagrama, notas y figuras paso a paso.",
    art: ScoreArt,
  },
] as const;

export default function Home() {
  return (
    <SuiteShell>
      <main className="flex-1 px-4 pb-10 md:overflow-y-auto md:px-8 md:py-8">
        <ul className="mx-auto flex max-w-5xl snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible xl:max-w-6xl xl:grid-cols-4">
          {MODULES.map((m) => {
            const Art = ART[m.id];
            return (
              <li key={m.id} className="w-[82%] shrink-0 snap-center md:w-auto">
                <div className="flex h-full flex-col items-center gap-3 rounded-[2.5rem] border-2 border-zinc-700/70 bg-[#0b0c10] p-6 text-center">
                  <Art className="h-44 w-full" />
                  <h2 className="text-3xl font-extrabold leading-tight text-white">{m.title}</h2>
                  <p className="max-w-[16rem] flex-1 text-base text-zinc-300">{m.desc}</p>
                  <Link href={m.href} style={{ background: m.color }} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-lg font-bold text-zinc-950 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    {m.cta} <span aria-hidden>→</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <section aria-label="Próximos módulos" className="mx-auto mt-4 max-w-5xl md:mt-6 xl:max-w-6xl">
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0">
            {UPCOMING.map((item) => {
              const UpcomingArt = item.art;
              return (
                <li
                  key={item.title}
                  className="w-[82%] shrink-0 snap-center md:w-auto"
                >
                  <div className="flex h-full flex-col items-center justify-between gap-4 rounded-[2.5rem] border-2 border-dashed border-zinc-700/80 bg-zinc-900/40 p-6 text-center md:flex-row md:items-center md:justify-between md:rounded-3xl md:p-5 md:text-left xl:p-6">
                    <UpcomingArt className="h-40 w-full md:hidden" />
                    <div className="flex flex-col items-center gap-2 md:items-start md:gap-1.5">
                      <div className="flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
                        <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/30">
                          Próximamente
                        </span>
                        <h2 className="text-2xl font-extrabold text-zinc-100 sm:text-xl">
                          {item.title}
                        </h2>
                      </div>
                      <p className="max-w-[16rem] text-sm text-zinc-400 md:max-w-none">
                        {item.desc}
                      </p>
                    </div>
                    <span
                      aria-disabled="true"
                      className="inline-flex w-full shrink-0 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/80 py-3 text-sm font-semibold text-zinc-500 md:w-auto md:px-4 md:py-2 md:text-xs"
                    >
                      En desarrollo
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </SuiteShell>
  );
}
