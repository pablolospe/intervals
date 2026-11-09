import Link from "next/link";

const MODULES = [
  { href: "/intervalos", title: "Intervalos", desc: "Entrená el oído con canciones pegadizas y tu voz." },
  { href: "/partitura", title: "Partitura", desc: "Escribí música dictando: “un tresillo de negras: do mi sol”." },
  { href: "/ritmo", title: "Ritmo", desc: "Escuchá un compás y adiviná las 4 células rítmicas que sonaron." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 text-zinc-100">
      <h1 className="bg-linear-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-4xl font-bold text-transparent">
        suite musical
      </h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className="card group p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
            <h2 className="flex items-center justify-between text-lg font-semibold">
              {m.title}
              <span aria-hidden className="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-emerald-300">→</span>
            </h2>
            <p className="mt-1 text-sm text-zinc-300">{m.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
