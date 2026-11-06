"use client";
import { useEffect, useRef } from "react";
import { Accidental, Beam, Formatter, Renderer, Stave, StaveNote, Tuplet, Voice } from "vexflow";
import { sameSelection, type Selection } from "@/lib/score/edit";
import { toMeasures } from "@/lib/score/layout";
import type { NoteEvent, RestEvent, Score } from "@/lib/score/types";

const MEASURE_W = 230;
const LINE_H = 130;
const MARGIN = 10;
const INK = "#e4e4e7"; // light ink for the dark theme
const SELECTED = "#34d399";

function toVex(e: NoteEvent | RestEvent, selected: boolean): StaveNote {
  const note =
    e.kind === "rest"
      ? new StaveNote({ keys: ["b/4"], duration: `${e.duration}r` })
      : new StaveNote({ keys: [`${e.pitch.step}/${e.pitch.octave}`], duration: e.duration });
  if (e.kind === "note" && e.pitch.accidental) note.addModifier(new Accidental(e.pitch.accidental), 0);
  if (selected) note.setStyle({ fillStyle: SELECTED, strokeStyle: SELECTED });
  return note;
}

interface Props {
  score: Score;
  width: number;
  selected: Selection | null;
  onSelect: (sel: Selection | null) => void;
}

/** Renders the score with VexFlow into an SVG that reflows with the container width. Notes are clickable. */
export function ScoreView({ score, width, selected, onSelect }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = "";

    const used = toMeasures(score);
    const measures = Array.from({ length: Math.max(score.measures, used.length) }, (_, i) => used[i] ?? []);

    const perLine = Math.max(1, Math.floor((width - MARGIN * 2) / MEASURE_W));
    const lines = Math.ceil(measures.length / perLine);
    const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG);
    renderer.resize(width, lines * LINE_H + 30);
    const ctx = renderer.getContext();
    ctx.setFillStyle(INK);
    ctx.setStrokeStyle(INK);
    const lineW = Math.floor((width - MARGIN * 2) / perLine);

    const clickable: { note: StaveNote; sel: Selection }[] = [];

    measures.forEach((events, idx) => {
      const col = idx % perLine;
      const row = Math.floor(idx / perLine);
      const stave = new Stave(MARGIN + col * lineW, 10 + row * LINE_H, lineW);
      if (col === 0) stave.addClef("treble");
      if (idx === 0) stave.addTimeSignature(`${score.beatsPerMeasure}/4`);
      stave.setContext(ctx).draw();
      if (!events.length) return; // empty measure: bare stave

      const tickables: StaveNote[] = [];
      const tuplets: Tuplet[] = [];
      const beams: Beam[] = [];
      for (const ev of events) {
        const e = score.events.indexOf(ev);
        if (ev.kind === "tuplet") {
          const notes = ev.items.map((it, i) => {
            const sel = { e, i };
            const n = toVex(it, sameSelection(selected, sel));
            clickable.push({ note: n, sel });
            return n;
          });
          tickables.push(...notes);
          tuplets.push(new Tuplet(notes, { numNotes: ev.actual, notesOccupied: ev.normal }));
          beams.push(...Beam.generateBeams(notes));
        } else {
          const sel = { e, i: null };
          const n = toVex(ev, sameSelection(selected, sel));
          clickable.push({ note: n, sel });
          tickables.push(n);
        }
      }
      beams.push(...Beam.generateBeams(tickables.filter((n) => !tuplets.some((t) => t.getNotes().includes(n)))));

      const voice = new Voice({ numBeats: score.beatsPerMeasure, beatValue: 4 }).setMode(Voice.Mode.SOFT);
      voice.addTickables(tickables);
      new Formatter().joinVoices([voice]).format([voice], lineW - (col === 0 ? 80 : 30));
      voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());
      tuplets.forEach((t) => t.setContext(ctx).draw());
    });

    for (const { note, sel } of clickable) {
      const g = note.getSVGElement();
      if (!g) continue;
      g.style.cursor = "pointer";
      g.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelect(sel);
      });
    }
  }, [score, width, selected, onSelect]);

  return <div ref={host} onClick={() => onSelect(null)} />;
}
