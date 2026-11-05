import type { DayRecord, IndicatorId } from './types';

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Median absolute deviation, scaled so it estimates the standard deviation for normal data. */
export function mad(xs: number[], med = median(xs)): number {
  if (xs.length === 0) return NaN;
  const dev = xs.map((x) => Math.abs(x - med));
  return 1.4826 * median(dev);
}

export interface Baseline {
  n: number;
  median: number;
  mad: number;
  min: number;
  max: number;
}

export function baselineOf(values: number[]): Baseline | null {
  const xs = values.filter((v) => Number.isFinite(v));
  if (xs.length < 3) return null;
  const med = median(xs);
  let spread = mad(xs, med);
  // Guard against a flat baseline: fall back to a small fraction of the median.
  if (!Number.isFinite(spread) || spread === 0) spread = Math.max(Math.abs(med) * 0.02, 1e-6);
  return { n: xs.length, median: med, mad: spread, min: Math.min(...xs), max: Math.max(...xs) };
}

/** Robust z-score of x against a baseline (how many "typical deviations" away it is). */
export function robustZ(x: number, b: Baseline): number {
  return (x - b.median) / b.mad;
}

/** Least-squares slope per day of the last `window` points. */
export function slope(points: { day: number; value: number }[], window = 5): number | null {
  const pts = points.slice(-window).filter((p) => Number.isFinite(p.value));
  if (pts.length < 3) return null;
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.day, 0) / n;
  const my = pts.reduce((s, p) => s + p.value, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pts) {
    num += (p.day - mx) * (p.value - my);
    den += (p.day - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

export function seriesFor(records: DayRecord[], id: IndicatorId): { day: number; value: number }[] {
  return records
    .filter((r) => Number.isFinite(r.values[id]))
    .map((r) => ({ day: r.day, value: r.values[id] as number }))
    .sort((a, b) => a.day - b.day);
}

/** Count how many consecutive most-recent days satisfy a predicate. */
export function consecutive(points: { day: number; value: number }[], pred: (v: number) => boolean): number {
  let n = 0;
  for (let i = points.length - 1; i >= 0; i--) {
    if (pred(points[i].value)) n++;
    else break;
  }
  return n;
}

export function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1];
}

export function round(x: number, d = 1): number {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}
