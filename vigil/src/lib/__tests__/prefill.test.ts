import { describe, expect, it } from 'vitest';
import { buildPrefill } from '../../components/checkin/useCheckinDraft';
import type { DayRecord } from '../types';

const day = (d: number, source: DayRecord['source'], values: DayRecord['values']): DayRecord => ({ day: d, values, symptoms: [], source });

describe('buildPrefill', () => {
  it('marks every value of a saved check-in as saved', () => {
    const p = buildPrefill([day(30, 'manual', { hr: 64, sleep: 7, pvtRt: 250 })], 30);
    expect(p.hr?.source).toBe('saved');
    expect(p.sleep?.source).toBe('saved');
    expect(p.pvtRt?.source).toBe('saved');
  });

  it('treats a reaction-test-only record as saved for its two values only', () => {
    const p = buildPrefill([day(30, 'pvt', { hr: 64, mood: 4, pvtRt: 262, pvtLapses: 1 })], 30);
    expect(p.pvtRt).toEqual({ value: 262, source: 'saved' });
    expect(p.pvtLapses).toEqual({ value: 1, source: 'saved' });
    expect(p.hr?.source).toBe('wearable');
    expect(p.mood?.source).toBe('simulated');
  });

  it("offers yesterday's values when there is no record today", () => {
    const p = buildPrefill([day(29, 'simulated', { hr: 60, radDose: 0.5 })], 30);
    expect(p.hr).toEqual({ value: 60, source: 'yesterday' });
    expect(p.radDose).toBeUndefined();
  });
});
