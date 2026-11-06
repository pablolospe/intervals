/**
 * Pitch detection with the McLeod Pitch Method (MPM) over a time-domain buffer.
 * Pure TypeScript on Float32Array so it is unit-testable without a browser.
 */

export interface PitchResult {
  frequency: number; // Hz
  clarity: number; // 0..1, height of the chosen NSDF peak
}

export interface DetectOptions {
  /** Minimum RMS to consider the signal voiced (noise gate). */
  rmsThreshold?: number;
  /** Peak-picking cutoff relative to the highest NSDF peak (MPM "k"). */
  cutoff?: number;
  /** Minimum clarity to accept a result. */
  minClarity?: number;
  minFrequency?: number;
  maxFrequency?: number;
}

export function rms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

/** Normalized square difference function, values in [-1, 1]. */
function nsdf(buffer: Float32Array, maxLag: number): Float32Array {
  const n = buffer.length;
  const out = new Float32Array(maxLag);
  for (let tau = 0; tau < maxLag; tau++) {
    let acf = 0;
    let m = 0;
    for (let i = 0; i < n - tau; i++) {
      acf += buffer[i] * buffer[i + tau];
      m += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
    }
    out[tau] = m > 0 ? (2 * acf) / m : 0;
  }
  return out;
}

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  opts: DetectOptions = {},
): PitchResult | null {
  const {
    rmsThreshold = 0.01,
    cutoff = 0.93,
    minClarity = 0.9,
    minFrequency = 60,
    maxFrequency = 1200,
  } = opts;

  if (rms(buffer) < rmsThreshold) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const maxLag = Math.min(buffer.length - 1, Math.ceil(sampleRate / minFrequency));
  if (maxLag <= minLag + 2) return null;

  const r = nsdf(buffer, maxLag + 1);

  // Collect the highest local maximum in each positive lobe (after the first zero crossing).
  const peaks: number[] = [];
  let tau = 1;
  while (tau < maxLag && r[tau] > 0) tau++; // skip initial lobe around lag 0
  while (tau < maxLag) {
    while (tau < maxLag && r[tau] <= 0) tau++;
    let best = -1;
    while (tau < maxLag && r[tau] > 0) {
      if (tau >= minLag && r[tau] > r[tau - 1] && r[tau] >= r[tau + 1]) {
        if (best < 0 || r[tau] > r[best]) best = tau;
      }
      tau++;
    }
    if (best > 0) peaks.push(best);
  }
  if (peaks.length === 0) return null;

  const highest = Math.max(...peaks.map((p) => r[p]));
  const chosen = peaks.find((p) => r[p] >= cutoff * highest);
  if (chosen === undefined) return null;

  // Parabolic interpolation for sub-sample lag precision.
  const a = r[chosen - 1];
  const b = r[chosen];
  const c = r[chosen + 1];
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const lag = chosen + shift;
  const clarity = b - 0.25 * (a - c) * shift;

  if (clarity < minClarity) return null;
  return { frequency: sampleRate / lag, clarity: Math.min(1, clarity) };
}
