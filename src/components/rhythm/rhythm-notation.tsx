"use client";
import { useEffect, useRef } from "react";
import { Beam, Formatter, Fraction, Renderer, Stave, StaveNote, SVGContext, Voice } from "vexflow";
import { getCell, vexDuration } from "@/lib/rhythm/cells";

/** Near-black ink: notation is drawn on the light `.paper` surface. */
export const INK = "#18181b";

interface Props {
  ids: string[];
  /** Logical size in notation units; the SVG scales fluidly to its container's width. */
  width: number;
  height?: number;
  /** Optional per-cell colour (e.g. red for a wrong beat). */
  colors?: (string | undefined)[];
  /** Draw the single rhythm line (with barlines) under the notes. */
  line?: boolean;
  className?: string;
}

/** Rhythm-only notation: notes on one line, stems up, beamed per beat. No clef, no pitch. */
export function RhythmNotation({ ids, width, height = 80, colors, line = false, className }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = "";
    if (!ids.length) return;

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext() as SVGContext;
    ctx.setViewBox(0, 0, width, height);
    const svg = el.querySelector("svg");
    if (svg) Object.assign(svg.style, { width: "100%", height: "auto", display: "block" });
    ctx.setFillStyle(INK);
    ctx.setStrokeStyle(INK);

    // Invisible 5-line stave used only for positioning; notes sit on its middle line (b/4).
    const pad = line ? 18 : 14;
    const stave = new Stave(0, height - 90, width);
    stave.setNoteStartX(pad);
    const midY = stave.getYForLine(2);

    const all: StaveNote[] = [];
    const beams: Beam[] = [];
    ids.forEach((id, i) => {
      const c = colors?.[i];
      const notes = getCell(id).slots.map((s) => {
        const sn = new StaveNote({ keys: ["b/4"], duration: vexDuration(s), stemDirection: 1 });
        if (c) sn.setStyle({ fillStyle: c, strokeStyle: c });
        return sn;
      });
      all.push(...notes);
      const cellBeams = Beam.generateBeams(notes, { stemDirection: 1, groups: [new Fraction(1, 4)] });
      if (c) cellBeams.forEach((b) => b.setStyle({ fillStyle: c, strokeStyle: c }));
      beams.push(...cellBeams);
    });

    if (line) {
      ctx.setLineWidth(1.2);
      ctx.beginPath();
      ctx.moveTo(2, midY);
      ctx.lineTo(width - 2, midY);
      for (const x of [2, width - 2]) {
        ctx.moveTo(x, midY - 10);
        ctx.lineTo(x, midY + 10);
      }
      ctx.stroke();
    }

    const voice = new Voice({ numBeats: ids.length, beatValue: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables(all);
    new Formatter().joinVoices([voice]).format([voice], width - pad * 2);
    voice.draw(ctx, stave);
    beams.forEach((b) => b.setContext(ctx).draw());
  }, [ids, width, height, colors, line]);

  return <div ref={host} aria-hidden className={`pointer-events-none w-full ${className ?? ""}`} />;
}
