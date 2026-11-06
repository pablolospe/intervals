/**
 * Voice input, engine-agnostic. Both engines work the same way for the UI:
 * `start()` begins capturing, `stop()` ends it and resolves with the transcript.
 */
export type EngineId = "web-speech" | "whisper-tiny" | "whisper-base";

export type VoiceStatus =
  | { kind: "idle" }
  | { kind: "loading"; progress: number | null } // model download (Whisper only)
  | { kind: "listening" }
  | { kind: "transcribing" };

export interface VoiceInput {
  /** Begin capturing. Rejects if the mic is denied / engine unsupported. */
  start(): Promise<void>;
  /** Stop capturing and resolve with the final transcript ("" if nothing was heard). */
  stop(): Promise<string>;
  /** Abort without transcribing. */
  cancel(): void;
}

export interface EngineInfo {
  id: EngineId;
  label: string;
  hint: string;
}

export const ENGINES: EngineInfo[] = [
  { id: "web-speech", label: "Navegador (en vivo)", hint: "Sin descarga. Chrome/Safari; en Chrome suele usar servidores de Google." },
  { id: "whisper-tiny", label: "Whisper tiny (local)", hint: "~44–154 MB la primera vez. Offline, rápido, menos preciso." },
  { id: "whisper-base", label: "Whisper base (local)", hint: "Más grande y más preciso que tiny; descarga mayor." },
];
