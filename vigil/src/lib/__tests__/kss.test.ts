import { describe, expect, it } from 'vitest';
import { CREW } from '../../data/crew';
import { indicatorById, kssAnchor } from '../../data/indicators';
import { baselineOf } from '../analytics';
import { evaluate } from '../rules';
import { simulateCrew, simulateMember } from '../simulate';
import type { CrewMember, IndicatorId, MissionSettings } from '../types';

const base: MissionSettings = { environment: 'transit', scenario: 'nominal', currentDay: 30, baselineDays: 14, seed: 20261114 };

function withToday(m: CrewMember, patch: Partial<Record<IndicatorId, number>>): CrewMember {
  return {
    ...m,
    records: m.records.map((r) => (r.day === base.currentDay ? { ...r, values: { ...r.values, ...patch }, symptoms: [], source: 'manual' as const } : r)),
  };
}

const cdr = () => simulateMember(CREW[0], base);
const pvtMedian = (m: CrewMember) => baselineOf(m.records.filter((r) => r.day <= 0).map((r) => r.values.pvtRt!))!.median;
const lapseMedian = (m: CrewMember) => baselineOf(m.records.filter((r) => r.day <= 0).map((r) => r.values.pvtLapses!))!.median;

/** A reaction test right at the person's baseline, so no pvt finding fires. */
const nominalPvt = (m: CrewMember) => ({ pvtRt: pvtMedian(m), pvtLapses: lapseMedian(m) });
/** A reaction test 20% slower than baseline: the amber pvt rule. */
const slowPvt = (m: CrewMember) => ({ pvtRt: Math.round(pvtMedian(m) * 1.2), pvtLapses: lapseMedian(m) });

const keys = (m: CrewMember) => evaluate(m, base).findings.map((f) => f.id.split(':').pop());

describe('Karolinska sleepiness indicator', () => {
  it('is a 1-9 manual scale with standard anchors', () => {
    const def = indicatorById('kss');
    expect([def.min, def.max, def.step, def.decimals, def.entry]).toEqual([1, 9, 1, 0, 'manual']);
    expect(kssAnchor(1)).toBe('extremely alert');
    expect(kssAnchor(7)).toBe('sleepy, but no effort to keep awake');
    expect(kssAnchor(9)).toBe('extremely sleepy, fighting sleep');
    expect(kssAnchor(6)).toBe('between neither alert nor sleepy and sleepy');
    expect(kssAnchor(8)).toBe('between sleepy and extremely sleepy');
  });

  it('is simulated for every day, deterministically, inside 1-9', () => {
    const a = simulateCrew(base);
    expect(JSON.stringify(a)).toBe(JSON.stringify(simulateCrew(base)));
    for (const m of a) {
      for (const r of m.records) {
        expect(Number.isInteger(r.values.kss)).toBe(true);
        expect(r.values.kss).toBeGreaterThanOrEqual(1);
        expect(r.values.kss).toBeLessThanOrEqual(9);
      }
    }
  });

  it('runs higher in the sleep-debt window than before it', () => {
    const s: MissionSettings = { ...base, scenario: 'sleepDebt' };
    const m = simulateCrew(s)[0];
    const mean = (from: number, to: number) => {
      const xs = m.records.filter((r) => r.day >= from && r.day <= to).map((r) => r.values.kss!);
      return xs.reduce((x, y) => x + y, 0) / xs.length;
    };
    expect(mean(26, 30)).toBeGreaterThan(mean(10, 20) + 1.5);
  });
});

describe('KSS rules', () => {
  it('kss-high fires at 7, not at 6', () => {
    const m = cdr();
    expect(keys(withToday(m, { kss: 6, ...nominalPvt(m) }))).not.toContain('kss-high');
    const ev = evaluate(withToday(m, { kss: 7, ...nominalPvt(m) }), base);
    const f = ev.findings.find((x) => x.id.endsWith(':kss-high'));
    expect(f?.level).toBe('amber');
    expect(f?.title).toBe('Sleepy today');
    expect(f?.reason).toContain('7/9');
    expect(f?.reason).toContain('sleepy, but no effort to keep awake');
    expect(f?.sources).toEqual(['kaida-2006']);
    expect(f?.checklist).toBe('alertness');
    expect(ev.byIndicator.kss.level).toBe('amber');
  });

  it('kss-mismatch needs both KSS 4 or lower and a slow reaction test today', () => {
    const m = cdr();
    // Alert rating, slow test: fires and cites both numbers.
    const slow = slowPvt(m);
    const ev = evaluate(withToday(m, { kss: 4, ...slow }), base);
    const f = ev.findings.find((x) => x.id.endsWith(':kss-mismatch'));
    expect(f?.title).toBe('You feel alert but your reaction test is slow');
    expect(f?.level).toBe('amber');
    expect(f?.reason).toContain('4/9');
    expect(f?.reason).toContain(`${slow.pvtRt} ms`);
    expect(f?.sources).toEqual(['dev-2024', 'pvt-b']);
    expect(f?.checklist).toBe('alertness');
    // Alert rating, normal test: no mismatch.
    expect(keys(withToday(m, { kss: 2, ...nominalPvt(m) }))).not.toContain('kss-mismatch');
    // Neither alert nor sleepy (5) with a slow test: no mismatch.
    expect(keys(withToday(m, { kss: 5, ...slow }))).not.toContain('kss-mismatch');
    // Sleepy with a slow test: the high rule, not the mismatch.
    const sleepy = keys(withToday(m, { kss: 8, ...slow }));
    expect(sleepy).toContain('kss-high');
    expect(sleepy).not.toContain('kss-mismatch');
  });

  it('neither rule fires on a nominal day', () => {
    const m = cdr();
    const k = keys(withToday(m, { kss: 3, ...nominalPvt(m) }));
    expect(k).not.toContain('kss-high');
    expect(k).not.toContain('kss-mismatch');
  });
});
