"use client";
import { useCallback, useEffect, useRef } from "react";
import { directedId, getInterval, intervalNotes, motifNotes } from "@/lib/audio/intervals-catalog";
import { MicPitchSource } from "@/lib/audio/mic-pitch-source";
import { centsOff } from "@/lib/audio/music-math";
import { NoteStabilizer } from "@/lib/audio/note-stabilizer";
import { SynthEngine, type SequenceNote } from "@/lib/audio/synth-engine";
import { live, resetLive } from "@/lib/live-pitch";
import { useTrainer } from "@/store/trainer-store";

/** Glue between the Zustand state machine and the (React-free) audio engines. */
export function useTrainerAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<SynthEngine | null>(null);
  const micRef = useRef<MicPitchSource | null>(null);
  const stabRef = useRef(new NoteStabilizer({ holdMs: 320, toleranceCents: 40, graceMs: 120 }));
  const mutedRef = useRef(false); // true while the app itself is playing sound
  const timerRef = useRef<number | undefined>(undefined);

  const ensureAudio = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      synthRef.current = new SynthEngine(ctx);
      const mic = new MicPitchSource(ctx);
      mic.subscribe((frame) => {
        live.buffer = frame.buffer;
        live.frequency = frame.frequency;
        const { phase, rootHz, confirmNote } = useTrainer.getState();
        if (mutedRef.current || (phase !== "SINGING_ROOT" && phase !== "SINGING_TARGET")) {
          live.progress = 0;
          return;
        }
        // Ignore lingering pitch from the 1st note while waiting for the 2nd note.
        const freq =
          phase === "SINGING_TARGET" &&
          rootHz !== null &&
          frame.frequency !== null &&
          Math.abs(centsOff(frame.frequency, rootHz)) < 50
            ? null
            : frame.frequency;
        const st = stabRef.current.update(frame.time, freq);
        live.progress = st.progress;
        if (st.confirmed && st.confirmedFrequency !== null) {
          confirmNote(st.confirmedFrequency);
          stabRef.current.reset();
          live.progress = 0;
        }
      });
      micRef.current = mic;
    }
    void ctxRef.current.resume();
    return { synth: synthRef.current!, mic: micRef.current! };
  }, []);

  const playNotes = useCallback(
    (notes: SequenceNote[], bpm: number, onDone?: () => void) => {
      const { synth } = ensureAudio();
      window.clearTimeout(timerRef.current);
      synth.stopAll(); // a new example cuts the previous one instead of layering on top
      mutedRef.current = true;
      stabRef.current.reset();
      resetLive();
      const seconds = synth.playSequence(notes, bpm);
      live.playStartMs = performance.now();
      live.playDurationMs = seconds * 1000 + 100;
      timerRef.current = window.setTimeout(() => {
        mutedRef.current = false;
        live.playDurationMs = 0;
        onDone?.();
      }, seconds * 1000 + 100);
    },
    [ensureAudio],
  );

  const playChallenge = useCallback(async () => {
    const st = useTrainer.getState();
    if (!st.currentId || st.rootMidi === null) return;
    const { mic } = ensureAudio();
    try {
      await mic.start();
      st.setMicError(false);
    } catch {
      st.setMicError(true);
    }
    playNotes(intervalNotes(getInterval(st.currentId), st.rootMidi), 80, () =>
      useTrainer.getState().playbackFinished(),
    );
  }, [ensureAudio, playNotes]);

  const startChallenge = useCallback(() => {
    useTrainer.getState().startChallenge();
    return playChallenge();
  }, [playChallenge]);

  const replay = useCallback(() => {
    useTrainer.getState().replay();
    return playChallenge();
  }, [playChallenge]);

  const playReference = useCallback((songIndex = 0) => {
    const { currentId, rootMidi, selection, direction, phase } = useTrainer.getState();
    // Recognise mode: the reference song would give the answer away, so it stays locked until answered.
    if (selection === "random" && phase !== "SUCCESS" && phase !== "MISS") return;
    const id = currentId ?? (selection !== "random" ? directedId(selection, direction) : null);
    if (!id) return;
    playNotes(motifNotes(getInterval(id), rootMidi ?? 60, songIndex), 100);
  }, [playNotes]);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      micRef.current?.stop();
      void ctxRef.current?.close();
    },
    [],
  );

  return { startChallenge, replay, playReference };
}
