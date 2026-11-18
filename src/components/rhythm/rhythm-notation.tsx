"use client";
import { useEffect, useRef } from "react";
import { Beam, Dot, Formatter, Fraction, Renderer, Stave, StaveNote, SVGContext, Voice } from "vexflow";
import { getCell, isDotted, vexDuration } from "@/lib/rhythm/cells";

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
    if (svg) {
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      Object.assign(svg.style, { width: "100%", height: "100%", display: "block", margin: "0 auto" });
    }
    ctx.setFillStyle(INK);
    ctx.setStrokeStyle(INK);

    // Invisible 5-line stave used only for positioning; notes sit on its middle line (b/4).
    // VexFlow puts that line at stave.y + 60. Pinning at y=-19 puts midY=41 so stems reach ~y=6
    // and proportional duration bars sit cleanly below rests at y=height-8.
    const pad = line ? 14 : 8;
    const stave = new Stave(0, -19, width);
    stave.setNoteStartX(pad);
    const midY = stave.getYForLine(2);

    const xStart = line ? 10 : 6;
    const xEnd = width - xStart;
    const beatGap = ids.length > 1 ? 5 : 0;
    const beatW = (xEnd - xStart) / ids.length;
    const innerBeatW = beatW - beatGap;
    const slotGap = 2;

    const all: StaveNote[] = [];
    const beams: Beam[] = [];
    const entries: { sn: StaveNote; slotX: number; barW: number; rest: boolean; color: string }[] = [];

    ids.forEach((id, i) => {
      const c = colors?.[i];
      const cell = getCell(id);
      const isTernary = cell.subdivision === "ternary";
      const beatUnits = isTernary ? 6 : 4;
      const beatX = xStart + i * beatW;
      let cursorUnits = 0;

      const notes = cell.slots.map((s) => {
        const dotted = isDotted(s);
        const sn = new StaveNote({
          keys: ["b/4"],
          duration: vexDuration(s),
          dots: dotted ? 1 : 0,
          stemDirection: 1,
        });
        if (dotted) Dot.buildAndAttach([sn], { all: true });
        if (c) {
          sn.setStyle({ fillStyle: c, strokeStyle: c });
          if (dotted) Dot.getDots(sn).forEach((d) => d.setStyle({ fillStyle: c, strokeStyle: c }));
        }

        const slotX = beatX + (cursorUnits / beatUnits) * innerBeatW;
        const slotW = (s.units / beatUnits) * innerBeatW;
        entries.push({
          sn,
          slotX,
          barW: Math.max(3, slotW - slotGap),
          rest: s.rest,
          color: c ?? INK,
        });
        cursorUnits += s.units;
        return sn;
      });
      all.push(...notes);
      const cellBeams = Beam.generateBeams(notes, {
        stemDirection: 1,
        groups: [new Fraction(isTernary ? 3 : 1, isTernary ? 8 : 4)],
      });
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

    const firstIsTernary = ids.length > 0 && getCell(ids[0]).subdivision === "ternary";
    const voice = new Voice(
      firstIsTernary ? { numBeats: ids.length * 3, beatValue: 8 } : { numBeats: ids.length, beatValue: 4 },
    ).setMode(Voice.Mode.SOFT);
    voice.addTickables(all);
    const formatWidth = Math.max(20, width - pad * 2 - 14);
    new Formatter().joinVoices([voice]).format([voice], formatWidth);

    // Snap each notehead/rest to its exact proportional time onset so notes align 1:1 with duration bars below.
    for (const entry of entries) {
      entry.sn.setStave(stave);
      const tc = entry.sn.getTickContext();
      tc.setX(tc.getX() + (entry.slotX - entry.sn.getAbsoluteX()));
    }

    voice.draw(ctx, stave);
    beams.forEach((b) => b.setContext(ctx).draw());

    // Proportional duration bars aligned below each note or rest.
    const barY = height - 8;
    for (const entry of entries) {
      if (entry.rest) {
        ctx.save();
        ctx.setStrokeStyle(entry.color);
        ctx.setLineWidth(1.5);
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(entry.slotX, barY + 1.5);
        ctx.lineTo(entry.slotX + entry.barW, barY + 1.5);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.rect(entry.slotX, barY - 1.5, 1.8, 6, { rx: 0.9, ry: 0.9, fill: entry.color, stroke: "none" });
        ctx.rect(entry.slotX, barY, entry.barW, 3, {
          rx: 1.5,
          ry: 1.5,
          fill: entry.color,
          opacity: 0.75,
          stroke: "none",
        });
      }
    }
  }, [ids, width, height, colors, line]);

  return <div ref={host} aria-hidden className={`pointer-events-none flex items-center justify-center ${className ?? "h-full w-full"}`} />;
}
