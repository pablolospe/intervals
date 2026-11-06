import { detectPitch, rms, type DetectOptions } from "./pitch-detector";

export interface PitchFrame {
  /** Detected f0 in Hz, or null if unvoiced. */
  frequency: number | null;
  clarity: number;
  rms: number;
  /** Live time-domain buffer (reused between frames; copy if you keep it). */
  buffer: Float32Array;
  sampleRate: number;
  /** performance.now()-style timestamp in ms. */
  time: number;
}

export type PitchListener = (frame: PitchFrame) => void;

/**
 * Thin browser wrapper: raw microphone (no AEC/AGC/NS) -> AnalyserNode -> MPM.
 * The analyser is NOT connected to the destination, so there is no feedback.
 */
export class MicPitchSource {
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private raf = 0;
  private listeners = new Set<PitchListener>();

  constructor(
    private readonly ctx: AudioContext,
    private readonly detectOpts: DetectOptions = {},
    private readonly fftSize = 4096,
  ) {}

  get running(): boolean {
    return this.stream !== null;
  }

  subscribe(fn: PitchListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async start(): Promise<void> {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
    });
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.source.connect(this.analyser);

    const buffer = new Float32Array(this.analyser.fftSize);
    const tick = () => {
      const analyser = this.analyser;
      if (!analyser) return;
      analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);
      const res = detectPitch(buffer, this.ctx.sampleRate, this.detectOpts);
      const frame: PitchFrame = {
        frequency: res?.frequency ?? null,
        clarity: res?.clarity ?? 0,
        rms: rms(buffer),
        buffer,
        sampleRate: this.ctx.sampleRate,
        time: performance.now(),
      };
      this.listeners.forEach((fn) => fn(frame));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = this.source = this.analyser = null;
  }
}
