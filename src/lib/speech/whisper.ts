import type { VoiceInput } from "./types";

/** Lazily-created, cached-per-model transcribers so the weights load once. */
type Stt = { load(): Promise<void>; transcribe(a: Blob, o?: { language?: string }): Promise<{ text: string }> };
const cache = new Map<string, Promise<Stt>>();

const MODELS = {
  "whisper-tiny": "onnx-community/whisper-tiny",
  "whisper-base": "onnx-community/whisper-base",
} as const;

export type WhisperId = keyof typeof MODELS;

/** Download + initialize the model. `onProgress` gets 0..1 (or null when unknown). */
export function loadWhisper(id: WhisperId, onProgress?: (p: number | null) => void): Promise<Stt> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      const { SpeechToText } = await import("runonweb/stt");
      const stt = new SpeechToText({
        model: MODELS[id],
        language: "es",
        onProgress: (info) => {
          const v = (info as { progress?: number }).progress;
          onProgress?.(typeof v === "number" ? Math.min(1, v > 1 ? v / 100 : v) : null);
        },
      });
      await stt.load();
      return stt as unknown as Stt;
    })();
    p.catch(() => cache.delete(id)); // allow retry after a failed download
    cache.set(id, p);
  }
  return p;
}

/** Record with MediaRecorder, then transcribe the whole clip locally on stop. */
export function createWhisperInput(id: WhisperId): VoiceInput {
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];

  const release = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    recorder = null;
  };

  return {
    async start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        throw new Error("Permiso de micrófono denegado.");
      }
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.start();
    },
    async stop() {
      const rec = recorder;
      if (!rec) return "";
      const done = new Promise<void>((res) => {
        rec.onstop = () => res();
      });
      rec.stop();
      await done;
      const blob = new Blob(chunks, { type: rec.mimeType });
      release();
      if (blob.size < 1000) return ""; // nothing meaningful recorded
      const stt = await loadWhisper(id);
      const { text } = await stt.transcribe(blob, { language: "es" });
      return text.trim();
    },
    cancel() {
      if (recorder && recorder.state !== "inactive") recorder.stop();
      release();
      chunks = [];
    },
  };
}
