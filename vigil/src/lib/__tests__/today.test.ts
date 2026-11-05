import { describe, expect, it } from 'vitest';
import { CREW } from '../../data/crew';
import { PVT_TASK_ID } from '../../data/routine';
import { baselineOf } from '../analytics';
import { simulateMember } from '../simulate';
import { bandScale, buildStatusHistory, nextAction, reasonLine, STRIP_DAYS } from '../today';
import type { DayRecord, Finding, MissionSettings } from '../types';

const base: MissionSettings = { environment: 'transit', scenario: 'nominal', currentDay: 30, baselineDays: 14, seed: 20261114 };
const rec = (day: number): DayRecord => ({ day, values: {}, symptoms: [], source: 'manual' });
const finding = (p: Partial<Finding>): Finding => ({
  id: 'x', crewId: 'cdr', day: 30, indicator: 'sleep', level: 'amber', title: 'Severe short sleep',
  reason: '', action: '', notifySurgeon: false, sources: [], basis: 'reference', ...p,
});

describe('nextAction', () => {
  const input = { crewId: 'cdr', day: 30, manual: {}, routineDone: {}, findings: [] as Finding[] };

  it('asks for the check-in when there is no manual record today', () => {
    // A red finding from simulated data does not skip the check-in.
    const a = nextAction({ ...input, findings: [finding({ level: 'red' })], manual: { 'cdr:29': rec(29) } });
    expect(a).toMatchObject({ kind: 'checkin', label: 'Start check-in', view: 'checkin' });
  });

  it('asks for the reaction test once the check-in is saved', () => {
    const a = nextAction({ ...input, manual: { 'cdr:30': rec(30) }, routineDone: { [`cdr:29:${PVT_TASK_ID}`]: true } });
    expect(a).toMatchObject({ kind: 'pvt', label: 'Run reaction test', view: 'pvt' });
  });

  const done = { ...input, manual: { 'cdr:30': rec(30) }, routineDone: { [`cdr:30:${PVT_TASK_ID}`]: true } };

  it('asks for a re-measure on any Act now finding today, pointing at its indicator', () => {
    const a = nextAction({ ...done, findings: [finding({ level: 'amber' }), finding({ level: 'red', indicator: 'bpSys' })] });
    expect(a).toEqual({ kind: 'remeasure', label: 'Re-measure in 30 min', view: 'checkin', indicator: 'bpSys' });
  });

  it('has no indicator for a symptom finding and ignores red findings from other days', () => {
    expect(nextAction({ ...done, findings: [finding({ level: 'red', indicator: 'symptoms' })] }).indicator).toBeUndefined();
    expect(nextAction({ ...done, findings: [finding({ level: 'red', day: 29 })] }).kind).toBe('report');
  });

  it("otherwise offers to send today's report", () => {
    expect(nextAction({ ...done, findings: [finding({ level: 'amber' })] })).toMatchObject({ kind: 'report', label: "Send today's report" });
  });
});

describe('reasonLine', () => {
  it('follows the three templates', () => {
    expect(reasonLine([])).toBe('All readings inside your normal range');
    expect(reasonLine([finding({}), finding({ title: 'Fever' })])).toBe('2 to watch: severe short sleep, fever');
    expect(reasonLine([finding({ level: 'red' }), finding({})])).toBe('1 item needs action: severe short sleep');
    expect(reasonLine([finding({ level: 'red' }), finding({ level: 'red', title: 'Fever' })])).toBe('2 items need action: severe short sleep, fever');
  });
});

describe('buildStatusHistory', () => {
  const m = simulateMember(CREW[0], base);

  it('returns one entry per day for the last 14 days, oldest first', () => {
    const h = buildStatusHistory(m, base);
    expect(h.hr).toHaveLength(STRIP_DAYS);
    expect(h.hr[0].day).toBe(17);
    expect(h.hr.at(-1)!.day).toBe(30);
    expect(h.hr.every((d) => d.level !== null)).toBe(true);
    expect(h.hr.at(-1)!.label).toMatch(/^Day 30: \d+ bpm, (Nominal|Watch|Act now)$/);
  });

  it('starts at day 1 early in the mission and marks missing days', () => {
    const early = { ...base, currentDay: 5 };
    const gap = { ...m, records: m.records.filter((r) => r.day !== 3) };
    const h = buildStatusHistory(gap, early);
    expect(h.sleep.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
    expect(h.sleep[2]).toEqual({ day: 3, level: null, label: 'Day 3: no reading' });
  });

  it('marks a day red when that day had a red reading', () => {
    const hot = { ...m, records: m.records.map((r) => (r.day === 28 ? { ...r, values: { ...r.values, temp: 39.8 } } : r)) };
    const h = buildStatusHistory(hot, base);
    expect(h.temp.find((d) => d.day === 28)!.level).toBe('red');
  });
});

describe('bandScale', () => {
  const b = baselineOf([60, 61, 59, 60, 62, 58, 60])!;

  it('centres on the baseline and widens to keep today in view', () => {
    const s = bandScale(60, b, { min: 30, max: 200 });
    expect(s.min).toBeLessThan(60);
    expect(s.max).toBeGreaterThan(60);
    expect(bandScale(110, b, { min: 30, max: 200 }).max).toBeGreaterThan(110);
  });

  it('falls back to the indicator limits without a baseline', () => {
    expect(bandScale(70, null, { min: 30, max: 200 })).toEqual({ min: 30, max: 200 });
  });
});
