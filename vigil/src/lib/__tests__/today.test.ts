import { describe, expect, it } from 'vitest';
import { CREW } from '../../data/crew';
import { PVT_TASK_ID } from '../../data/routine';
import { baselineOf } from '../analytics';
import { simulateMember } from '../simulate';
import { bandScale, buildStatusHistory, GRID_TRACKS, groupTiles, nextAction, reasonLine, STRIP_DAYS, tileSpans } from '../today';
import type { DayRecord, Finding, IndicatorId, Level, MissionSettings } from '../types';
import { INDICATORS } from '../../data/indicators';

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

describe('groupTiles', () => {
  const by = (over: Partial<Record<IndicatorId, { level: Level; value: number | null }>>) =>
    Object.fromEntries(INDICATORS.map((d) => [d.id, over[d.id] ?? { level: 'green' as Level, value: 1 }])) as Record<
      IndicatorId,
      { level: Level; value: number | null }
    >;

  it('puts Act now first, then Watch, keeping reading order inside each level', () => {
    const g = groupTiles(INDICATORS, by({ sleep: { level: 'amber', value: 4 }, hr: { level: 'amber', value: 90 }, pvtRt: { level: 'red', value: 400 } }));
    expect(g.attention.map((d) => d.id)).toEqual(['pvtRt', 'hr', 'sleep']);
    expect(g.inRange).toHaveLength(INDICATORS.length - 3);
    expect(g.inRange.some((d) => d.id === 'hr')).toBe(false);
  });

  it('keeps tiles without a reading out of "In range" unless they carry a flag', () => {
    const g = groupTiles(INDICATORS, by({ weight: { level: 'green', value: null }, bpDia: { level: 'red', value: null } }));
    expect(g.unmeasured.map((d) => d.id)).toEqual(['weight']);
    expect(g.attention.map((d) => d.id)).toEqual(['bpDia']);
    expect(g.attention.length + g.inRange.length + g.unmeasured.length).toBe(INDICATORS.length);
  });
});

describe('tileSpans', () => {
  const rows = (spans: number[]) => {
    const out: number[] = [];
    let acc = 0;
    for (const s of spans) {
      acc += s;
      if (acc >= GRID_TRACKS) {
        out.push(acc);
        acc = 0;
      }
    }
    if (acc) out.push(acc);
    return out;
  };

  it('uses one column fewer when that divides the count', () => {
    expect(tileSpans(9, 4)).toEqual(Array(9).fill(4));
    expect(tileSpans(6, 4)).toEqual(Array(6).fill(4));
    expect(tileSpans(8, 4)).toEqual(Array(8).fill(3));
  });

  it('never leaves a part-filled row once there is more than one row', () => {
    for (const max of [2, 3, 4]) {
      for (let n = max + 1; n <= 15; n++) expect(rows(tileSpans(n, max)).every((r) => r === GRID_TRACKS)).toBe(true);
    }
    expect(tileSpans(7, 4).slice(-3)).toEqual([4, 4, 4]);
    expect(tileSpans(9, 2).at(-1)).toBe(12);
  });

  it('keeps a short single row at the standard width', () => {
    expect(tileSpans(0, 4)).toEqual([]);
    expect(tileSpans(1, 4)).toEqual([3]);
    expect(tileSpans(2, 4)).toEqual([3, 3]);
    expect(tileSpans(3, 4)).toEqual([4, 4, 4]);
    expect(tileSpans(1, 2)).toEqual([6]);
  });
});
