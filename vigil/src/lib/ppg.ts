/**
 * Pulse estimation from a sequence of mean colour samples (photoplethysmography).
 * Works for a fingertip over the camera (red channel) or a face under ambient light (green channel),
 * following Verkruysse, Svaasand and Nelson (2008).
 */
export interface PpgSample {
  t: number; // ms
  v: number; // mean channel value 0-255
}

export interface PpgResult {
  bpm: number | null;
  /** Ratio of the spectral peak to the mean power in the 42-180 bpm band. Higher is cleaner. */
  snr: number;
  quality: 'good' | 'fair' | 'poor';
  seconds: number;
  samples: number;
  /** Uniformly resampled, detrended signal for plotting. */
  trace: number[];
}

const FS = 30; // Hz after resampling
const MIN_BPM = 42;
const MAX_BPM = 180;

function resample(samples: PpgSample[]): number[] {
  if (samples.length < 2) return [];
  const t0 = samples[0].t;
  const t1 = samples[samples.length - 1].t;
  const n = Math.floor(((t1 - t0) / 1000) * FS);
  const out: number[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + (i * 1000) / FS;
    while (j < samples.length - 2 && samples[j + 1].t < t) j++;
    const a = samples[j];
    const b = samples[j + 1];
    const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
    out.push(a.v + f * (b.v - a.v));
  }
  return out;
}

/** Remove slow drift (moving average over ~1.5 s) and normalise. */
function detrend(x: number[]): number[] {
  const w = Math.round(FS * 1.5);
  const out = new Array<number>(x.length);
  let sum = 0;
  const q: number[] = [];
  for (let i = 0; i < x.length; i++) {
    q.push(x[i]);
    sum += x[i];
    if (q.length > w) sum -= q.shift()!;
    out[i] = x[i] - sum / q.length;
  }
  const sd = Math.sqrt(out.reduce((s, v) => s + v * v, 0) / Math.max(1, out.length)) || 1;
  return out.map((v) => v / sd);
}

/** Power at frequency f (Hz) by direct DFT with a Hann window. */
function power(x: number[], f: number): number {
  let re = 0;
  let im = 0;
  const n = x.length;
  for (let i = 0; i < n; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    const ph = (2 * Math.PI * f * i) / FS;
    re += w * x[i] * Math.cos(ph);
    im -= w * x[i] * Math.sin(ph);
  }
  return (re * re + im * im) / n;
}

export function estimatePulse(samples: PpgSample[]): PpgResult {
  const seconds = samples.length > 1 ? (samples[samples.length - 1].t - samples[0].t) / 1000 : 0;
  const x = detrend(resample(samples));
  // Drop the first second (camera auto-exposure settling).
  const sig = x.slice(FS);
  if (seconds < 8 || sig.length < FS * 6) {
    return { bpm: null, snr: 0, quality: 'poor', seconds, samples: samples.length, trace: sig };
  }
  let best = { bpm: 0, p: 0 };
  let total = 0;
  let count = 0;
  for (let bpm = MIN_BPM; bpm <= MAX_BPM; bpm += 0.5) {
    const p = power(sig, bpm / 60);
    total += p;
    count++;
    if (p > best.p) best = { bpm, p };
  }
  const snr = best.p / (total / count);
  const quality: PpgResult['quality'] = snr >= 12 ? 'good' : snr >= 6 ? 'fair' : 'poor';
  return { bpm: quality === 'poor' ? null : Math.round(best.bpm), snr, quality, seconds, samples: samples.length, trace: sig };
}
