import Link from "next/link";

const MODULES = [
  { href: "/intervalos/reconocer", title: "Reconocer intervalos", desc: "Escuchá un intervalo sorpresa y adiviná cuál es." },
  { href: "/intervalos/cantar", title: "Cantar intervalos", desc: "Elegí un intervalo y entrená el oído con canciones pegadizas y tu voz." },
  { href: "/ritmo", title: "Células rítmicas", desc: "Escuchá un compás y adiviná las 4 células rítmicas que sonaron." },
  { href: null, title: "Partitura", desc: "Escribí música dictando: “un tresillo de negras: do mi sol”." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 text-zinc-100">
      <h1 className="bg-linear-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-4xl font-bold text-transparent">
        suite musical
      </h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        {MODULES.map((m) =>
          m.href ? (
            <Link key={m.title} href={m.href} className="card group p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              <h2 className="flex items-center justify-between text-lg font-semibold">
                {m.title}
                <span aria-hidden className="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-emerald-300">→</span>
              </h2>
              <p className="mt-1 text-sm text-zinc-300">{m.desc}</p>
            </Link>
          ) : (
            <div key={m.title} aria-disabled="true" className="card cursor-not-allowed p-5 opacity-50">
              <h2 className="flex items-center justify-between text-lg font-semibold">
                {m.title}
                <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs font-medium text-zinc-300">próximamente</span>
              </h2>
              <p className="mt-1 text-sm text-zinc-300">{m.desc}</p>
            </div>
          ),
        )}
      </div>
    </main>
  );
}
