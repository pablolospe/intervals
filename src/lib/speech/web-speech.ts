import type { VoiceInput } from "./types";

/** Minimal typing for the (prefixed, non-standard) Web Speech API. */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type Ctor = new () => SpeechRecognitionLike;

const getCtor = (): Ctor | null => {
  const w = globalThis as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const webSpeechSupported = () => getCtor() !== null;

export function createWebSpeechInput(lang = "es-AR"): VoiceInput {
  let rec: SpeechRecognitionLike | null = null;
  let transcript = "";
  let ended: Promise<void> = Promise.resolve();

  return {
    start() {
      const Ctor = getCtor();
      if (!Ctor) return Promise.reject(new Error("Este navegador no soporta reconocimiento de voz. Probá con Whisper."));
      const r = new Ctor();
      r.lang = lang;
      r.interimResults = false;
      r.continuous = true;
      r.maxAlternatives = 1;
      transcript = "";
      return new Promise<void>((resolve, reject) => {
        let started = false;
        ended = new Promise<void>((done) => {
          r.onend = () => done();
        });
        r.onresult = (e) => {
          transcript = Array.from(e.results)
            .map((res) => res[0].transcript)
            .join(" ")
            .trim();
        };
        r.onerror = (e) => {
          if (!started) reject(new Error(e.error === "not-allowed" ? "Permiso de micrófono denegado." : `Error de voz: ${e.error}`));
        };
        try {
          r.start();
          started = true;
          rec = r;
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    },
    async stop() {
      rec?.stop();
      await ended;
      rec = null;
      return transcript;
    },
    cancel() {
      rec?.abort();
      rec = null;
      transcript = "";
    },
  };
}
