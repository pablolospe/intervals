"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineId, VoiceInput, VoiceStatus } from "@/lib/speech/types";
import { createWebSpeechInput } from "@/lib/speech/web-speech";
import { createWhisperInput, loadWhisper, type WhisperId } from "@/lib/speech/whisper";

/** Click-to-talk voice input: `toggle()` starts, a second call stops and returns the transcript via `onText`. */
export function useVoiceInput(engine: EngineId, onText: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<VoiceInput | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  // Switching engine aborts any capture in progress.
  useEffect(() => {
    return () => {
      inputRef.current?.cancel();
      inputRef.current = null;
    };
  }, [engine]);

  const preload = useCallback(async () => {
    if (engine === "web-speech") return;
    setStatus({ kind: "loading", progress: null });
    try {
      await loadWhisper(engine as WhisperId, (p) => setStatus({ kind: "loading", progress: p }));
    } finally {
      setStatus((s) => (s.kind === "loading" ? { kind: "idle" } : s));
    }
  }, [engine]);

  const toggle = useCallback(async () => {
    setError(null);
    if (status.kind === "listening" && inputRef.current) {
      const input = inputRef.current;
      inputRef.current = null;
      setStatus({ kind: "transcribing" });
      try {
        const text = await input.stop();
        if (text) onTextRef.current(text);
        else setError("No escuché nada. Probá de nuevo, más cerca del micrófono.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falló la transcripción.");
      } finally {
        setStatus({ kind: "idle" });
      }
      return;
    }
    if (status.kind !== "idle") return;
    try {
      // Start the (possibly large) first-time model download before recording, so audio isn't buffered while it runs.
      if (engine !== "web-speech") await preload();
      const input = engine === "web-speech" ? createWebSpeechInput() : createWhisperInput(engine as WhisperId);
      await input.start();
      inputRef.current = input;
      setStatus({ kind: "listening" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude iniciar el micrófono.");
      setStatus({ kind: "idle" });
    }
  }, [engine, status.kind, preload]);

  return { status, error, toggle };
}
