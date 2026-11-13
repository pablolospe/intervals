"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MODULES } from "@/lib/modules";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="BurpEars" className={`inline-flex items-center transition hover:opacity-90 ${className}`}>
      <Image
        src="/images/logo.png"
        alt="BurpEars"
        width={160}
        height={153}
        priority
        className="h-12 w-auto md:h-20"
      />
    </Link>
  );
}

/** Mobile top bar with a hamburger menu + desktop sidebar. */
export function SuiteShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const [open, setOpen] = useState(false);
  const nav = (
    <nav aria-label="Principal" className="flex flex-col gap-1 text-sm font-semibold">
      <Link href="/" onClick={() => setOpen(false)} className={`rounded-full px-4 py-2 ${!active ? "bg-[#14d6cc] text-zinc-950" : "text-zinc-300 hover:text-white"}`}>
        Inicio
      </Link>
      {MODULES.map((m) => (
        <Link key={m.id} href={m.href} onClick={() => setOpen(false)} className={`rounded-full px-4 py-2 ${active === m.id ? "text-zinc-950" : "text-zinc-300 hover:text-white"}`} style={active === m.id ? { background: m.color } : undefined}>
          {m.title}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-dvh text-zinc-100 md:grid md:h-dvh md:grid-cols-[13rem_1fr] md:overflow-hidden">
      <aside className="hidden border-r border-zinc-800/80 p-5 md:flex md:flex-col md:gap-8">
        <Logo className="justify-center" />
        {nav}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800/60 bg-[#0b0c10]/90 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <button aria-label="Menú" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-full p-2 text-zinc-200 hover:bg-zinc-800">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          {open && (
            <>
              {/* Backdrop: tap outside to close. The panel floats over the content instead of pushing it down. */}
              <button aria-label="Cerrar menú" tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 -z-10 cursor-default bg-black/50" />
              <div className="absolute inset-x-4 top-full rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-2xl shadow-black/60">{nav}</div>
            </>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}
