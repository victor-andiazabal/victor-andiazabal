import { describe, expect, it } from 'vitest';
import { CREW } from '../../data/crew';
import { evaluate } from '../rules';
import { simulateCrew, simulateMember } from '../simulate';
import type { CrewMember, DayRecord, IndicatorId, MissionSettings } from '../types';

const base: MissionSettings = { environment: 'transit', scenario: 'nominal', currentDay: 30, baselineDays: 14, seed: 20261114 };

function withToday(m: CrewMember, patch: Partial<Record<IndicatorId, number>>, symptoms: string[] = [], day = base.currentDay): CrewMember {
  return {
    ...m,
    records: m.records.map((r) => (r.day === day ? { ...r, values: { ...r.values, ...patch }, symptoms, source: 'manual' as const } : r)),
  };
}
const cdr = () => simulateMember(CREW[0], base);
const titles = (m: CrewMember, s = base) => evaluate(m, s).findings.map((f) => f.title);

describe('simulator', () => {
  it('is deterministic for a seed and produces baseline plus mission days', () => {
    const a = simulateCrew(base);
    const b = simulateCrew(base);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a[0].records[0].day).toBe(-13);
    expect(a[0].records.at(-1)!.day).toBe(30);
  });

  it('changes with the seed', () => {
    const a = simulateCrew(base)[0].records[20].values.hr;
    const b = simulateCrew({ ...base, seed: 7 })[0].records[20].values.hr;
    expect(a).not.toBe(b);
  });

  it('uses the environment dose rate in flight and near-zero pre-flight', () => {
    const m = cdr();
    const pre = m.records.find((r) => r.day === -5)!.values.radDose!;
    const inFlight = m.records.find((r) => r.day === 10)!.values.radDose!;
    expect(pre).toBeLessThan(0.05);
    expect(inFlight).toBeGreaterThan(1.4);
    expect(inFlight).toBeLessThan(2.3);
  });
});

describe('reference rules fire at the cited cut-offs', () => {
  it('blood pressure: stage 2 is amber, crisis is red with surgeon flag', () => {
    const m = cdr();
    expect(titles(withToday(m, { bpSys: 118, bpDia: 76 }))).not.toContain('Blood pressure in stage 2 range');
    expect(titles(withToday(m, { bpSys: 142, bpDia: 78 }))).toContain('Blood pressure in stage 2 range');
    const ev = evaluate(withToday(m, { bpSys: 184, bpDia: 90 }), base);
    expect(ev.findings.map((f) => f.title)).toContain('Blood pressure in crisis range');
    expect(ev.overall).toBe('red');
    expect(ev.notifySurgeon).toBe(true);
  });

  it('fever at 38.0 C is amber and notifies; 39.4 C is red', () => {
    const m = cdr();
    expect(titles(withToday(m, { temp: 37.9 }))).not.toContain('Fever');
    const ev = evaluate(withToday(m, { temp: 38.0 }), base);
    expect(ev.findings.find((f) => f.title === 'Fever')?.notifySurgeon).toBe(true);
    expect(evaluate(withToday(m, { temp: 39.4 }), base).overall).toBe('red');
  });

  it('SpO2 below 95 is amber, below 90 is red', () => {
    const m = cdr();
    expect(evaluate(withToday(m, { spo2: 96 }), base).byIndicator.spo2.level).toBe('green');
    expect(evaluate(withToday(m, { spo2: 94 }), base).byIndicator.spo2.level).toBe('amber');
    expect(evaluate(withToday(m, { spo2: 89 }), base).byIndicator.spo2.level).toBe('red');
  });

  it('glucose: 69 amber, 53 red, 126 amber with surgeon, 200 red', () => {
    const m = cdr();
    expect(evaluate(withToday(m, { glucose: 69 }), base).byIndicator.glucose.level).toBe('amber');
    expect(evaluate(withToday(m, { glucose: 53 }), base).byIndicator.glucose.level).toBe('red');
    const ev = evaluate(withToday(m, { glucose: 126 }), base);
    expect(ev.byIndicator.glucose.level).toBe('amber');
    expect(ev.notifySurgeon).toBe(true);
    expect(evaluate(withToday(m, { glucose: 200 }), base).byIndicator.glucose.level).toBe('red');
  });

  it('heart rate above 100 is amber, above 120 is red', () => {
    const m = cdr();
    expect(evaluate(withToday(m, { hr: 101 }), base).byIndicator.hr.level).toBe('amber');
    expect(evaluate(withToday(m, { hr: 121 }), base).byIndicator.hr.level).toBe('red');
  });

  it('radiation spike of 10x the environment rate is red', () => {
    const m = cdr();
    expect(evaluate(withToday(m, { radDose: 19 }), base).byIndicator.radDose.level).toBe('red');
    expect(evaluate(withToday(m, { radDose: 6 }), base).byIndicator.radDose.level).toBe('amber');
  });

  it('a red-flag symptom is red and notifies the surgeon', () => {
    const ev = evaluate(withToday(cdr(), {}, ['chestPain']), base);
    expect(ev.overall).toBe('red');
    expect(ev.notifySurgeon).toBe(true);
    expect(ev.findings[0].title).toBe('Urgent symptom reported');
  });
});

describe('baseline rules', () => {
  it('flags a resting heart rate that is normal for the population but high for the person', () => {
    const m = cdr(); // Commander baseline is about 58 bpm
    const ev = evaluate(withToday(m, { hr: 80 }), base);
    expect(ev.byIndicator.hr.level).toBe('amber');
    expect(ev.findings.find((f) => f.indicator === 'hr')?.basis).toBe('baseline');
  });

  it('flags three nights under 6 h of sleep', () => {
    let m = cdr();
    for (const d of [28, 29, 30]) m = withToday(m, { sleep: 5.5 }, [], d);
    expect(titles(m)).toContain('Under 6 hours of sleep for 3 nights');
  });

  it('every finding carries a checklist key that exists', async () => {
    const { COUNTERMEASURES } = await import('../../data/countermeasures');
    const m = withToday(cdr(), { bpSys: 150, temp: 38.5, spo2: 93, glucose: 60, hr: 105, radDose: 19 }, ['chestPain', 'headache', 'nausea', 'dizziness']);
    for (const f of evaluate(m, base).findings) expect(COUNTERMEASURES[f.checklist ?? '']).toBeDefined();
  });

  it('every finding carries a reason, an action and a source', () => {
    const m = withToday(cdr(), { bpSys: 150, temp: 38.5, spo2: 93, glucose: 60, hr: 105 }, ['headache', 'nausea', 'dizziness']);
    const ev = evaluate(m, base);
    expect(ev.findings.length).toBeGreaterThan(4);
    for (const f of ev.findings) {
      expect(f.reason.length).toBeGreaterThan(10);
      expect(f.action.length).toBeGreaterThan(10);
      if (f.indicator !== 'routine') expect(f.sources.length).toBeGreaterThan(0);
    }
  });
});

describe('scenarios', () => {
  it('nominal mission produces no red for any crew member on any day', () => {
    for (let day = 1; day <= 60; day++) {
      const s = { ...base, currentDay: day };
      for (const m of simulateCrew(s)) expect(evaluate(m, s).overall).not.toBe('red');
    }
  });

  it('solar particle event flags every crew member on day 25', () => {
    const s = { ...base, scenario: 'spe' as const, currentDay: 25 };
    for (const m of simulateCrew(s)) {
      const ev = evaluate(m, s);
      expect(ev.byIndicator.radDose.level).toBe('red');
    }
  });

  it('sleep debt makes the Commander red by day 30 with sleep and reaction findings', () => {
    const s = { ...base, scenario: 'sleepDebt' as const, currentDay: 30 };
    const ev = evaluate(simulateCrew(s)[0], s);
    expect(ev.overall).toBe('red');
    expect(ev.findings.some((f) => f.indicator === 'sleep')).toBe(true);
    expect(ev.findings.some((f) => f.indicator === 'pvtRt')).toBe(true);
  });

  it('early infection flags FE1 with fever and notifies the surgeon by day 29', () => {
    const s = { ...base, scenario: 'illness' as const, currentDay: 29 };
    const ev = evaluate(simulateCrew(s)[1], s);
    expect(ev.findings.some((f) => f.title === 'Fever')).toBe(true);
    expect(ev.notifySurgeon).toBe(true);
  });

  it('missed check-ins produce a routine finding', () => {
    const m = cdr();
    const records: DayRecord[] = m.records.filter((r) => r.day < 28);
    const ev = evaluate({ ...m, records }, base);
    expect(ev.missedCheckins).toBe(3);
    expect(ev.findings.some((f) => f.indicator === 'routine')).toBe(true);
  });
});

describe('Bio-Monitor derived indicators', () => {
  it('breathing rate: 21 is amber, 31 is red with surgeon flag', () => {
    const m = cdr();
    expect(evaluate(withToday(m, { resp: 16 }), base).byIndicator.resp.level).toBe('green');
    expect(evaluate(withToday(m, { resp: 21 }), base).byIndicator.resp.level).toBe('amber');
    const ev = evaluate(withToday(m, { resp: 31 }), base);
    expect(ev.byIndicator.resp.level).toBe('red');
    expect(ev.notifySurgeon).toBe(true);
  });

  it('HRV is judged against the personal baseline only, after three low nights', () => {
    let m = cdr(); // Commander baseline HRV about 56 ms
    expect(evaluate(withToday(m, { hrv: 38 }), base).byIndicator.hrv.level).toBe('green');
    for (const d of [28, 29, 30]) m = withToday(m, { hrv: 36 }, [], d);
    expect(evaluate(m, base).byIndicator.hrv.level).toBe('amber');
  });
});
