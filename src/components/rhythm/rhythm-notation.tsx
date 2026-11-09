"use client";
import { useEffect, useRef } from "react";
import { Beam, Formatter, Fraction, Renderer, Stave, StaveNote, Voice } from "vexflow";
import { getCell, vexDuration } from "@/lib/rhythm/cells";

const INK = "#e4e4e7";

interface Props {
  ids: string[];
  width: number;
  height?: number;
  /** Optional per-cell colour (e.g. red for a wrong beat). */
  colors?: (string | undefined)[];
  /** Draw the single rhythm line under the notes. */
  line?: boolean;
}

/** Rhythm-only notation: notes on one line, stems up, beamed per beat. No clef, no pitch. */
export function RhythmNotation({ ids, width, height = 80, colors, line = false }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = "";
    if (!ids.length) return;

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    ctx.setFillStyle(INK);
    ctx.setStrokeStyle(INK);

    // Invisible 5-line stave used only for positioning; notes sit on its middle line (b/4).
    const stave = new Stave(0, height - 90, width);
    stave.setNoteStartX(14);
    const midY = stave.getYForLine(2);

    const all: StaveNote[] = [];
    const beams: Beam[] = [];
    ids.forEach((id, i) => {
      const notes = getCell(id).slots.map((s) => {
        const sn = new StaveNote({ keys: ["b/4"], duration: vexDuration(s), stemDirection: 1 });
        const c = colors?.[i];
        if (c) sn.setStyle({ fillStyle: c, strokeStyle: c });
        return sn;
      });
      all.push(...notes);
      const cellBeams = Beam.generateBeams(notes, { stemDirection: 1, groups: [new Fraction(1, 4)] });
      const c = colors?.[i];
      if (c) cellBeams.forEach((b) => b.setStyle({ fillStyle: c, strokeStyle: c }));
      beams.push(...cellBeams);
    });

    if (line) {
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
    }

    const voice = new Voice({ numBeats: ids.length, beatValue: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables(all);
    new Formatter().joinVoices([voice]).format([voice], width - 28);
    voice.draw(ctx, stave);
    beams.forEach((b) => b.setContext(ctx).draw());
  }, [ids, width, height, colors, line]);

  return <div ref={host} aria-hidden className="pointer-events-none" />;
}
