import { describe, expect, it } from 'vitest';
import { baselineOf, consecutive, mad, median, robustZ, slope } from '../analytics';

describe('analytics', () => {
  it('median handles odd and even lengths', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('MAD is scaled to estimate the standard deviation and ignores one outlier', () => {
    const xs = [60, 61, 59, 60, 62, 58, 60, 61, 59, 60, 120];
    const b = baselineOf(xs)!;
    expect(b.median).toBe(60);
    expect(b.mad).toBeLessThan(3);
    expect(robustZ(120, b)).toBeGreaterThan(10);
  });

  it('flat baseline still yields a usable spread', () => {
    const b = baselineOf([70, 70, 70, 70])!;
    expect(b.mad).toBeGreaterThan(0);
    expect(Number.isFinite(robustZ(80, b))).toBe(true);
  });

  it('needs at least three points for a baseline', () => {
    expect(baselineOf([1, 2])).toBeNull();
  });

  it('slope and consecutive work on day series', () => {
    const pts = [1, 2, 3, 4, 5].map((d) => ({ day: d, value: 2 * d }));
    expect(slope(pts)).toBeCloseTo(2);
    expect(consecutive(pts, (v) => v > 5)).toBe(3);
    expect(mad([1, 1, 1, 1])).toBe(0);
  });
});
