/**
 * Mutable per-frame data shared between the audio loop and the canvas. Deliberately NOT in
 * React/Zustand state: updating state 60x/s would re-render the tree.
 */
export interface LiveData {
  frequency: number | null;
  progress: number; // 0..1 stabilization
  playStartMs: number;
  playDurationMs: number;
  buffer: Float32Array | null;
}

export const live: LiveData = { frequency: null, progress: 0, playStartMs: 0, playDurationMs: 0, buffer: null };

export function resetLive(): void {
  live.frequency = null;
  live.progress = 0;
  live.playStartMs = 0;
  live.playDurationMs = 0;
}
