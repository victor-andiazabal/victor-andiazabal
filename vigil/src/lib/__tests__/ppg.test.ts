import { describe, expect, it } from 'vitest';
import { estimatePulse, type PpgSample } from '../ppg';

function synth(bpm: number, seconds: number, noise: number, fps = 28, seed0 = 42, amplitude = 1.5): PpgSample[] {
  const out: PpgSample[] = [];
  let seed = seed0;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
  for (let i = 0; i < seconds * fps; i++) {
    const t = (i / fps) * 1000 + rand() * 6; // jittered camera timestamps
    const drift = 120 + 5 * Math.sin((2 * Math.PI * t) / 9000); // slow exposure drift
    const pulse = amplitude * Math.sin((2 * Math.PI * (bpm / 60) * t) / 1000);
    out.push({ t, v: drift + pulse + noise * rand() });
  }
  return out;
}

describe('pulse estimation', () => {
  it('recovers the heart rate from a clean synthetic signal', () => {
    const r = estimatePulse(synth(72, 20, 0.5));
    expect(r.bpm).not.toBeNull();
    expect(Math.abs(r.bpm! - 72)).toBeLessThanOrEqual(2);
    expect(r.quality).toBe('good');
  });

  it('works across the physiological range', () => {
    for (const bpm of [50, 95, 140]) {
      const r = estimatePulse(synth(bpm, 20, 0.8));
      expect(Math.abs((r.bpm ?? 0) - bpm)).toBeLessThanOrEqual(2);
    }
  });

  it('refuses to guess from noise, across many seeds', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const r = estimatePulse(synth(70, 20, 60, 28, seed, 0));
      expect(r.bpm, `seed ${seed} concentration ${r.concentration.toFixed(2)} snr ${r.snr.toFixed(1)}`).toBeNull();
    }
  });

  it('still finds a pulse under moderate noise', () => {
    let found = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const r = estimatePulse(synth(70, 20, 8, 28, seed));
      if (r.bpm !== null && Math.abs(r.bpm - 70) <= 3) found++;
    }
    expect(found).toBeGreaterThanOrEqual(16);
  });

  it('needs at least eight seconds', () => {
    const r = estimatePulse(synth(70, 5, 0.5));
    expect(r.bpm).toBeNull();
  });
});
