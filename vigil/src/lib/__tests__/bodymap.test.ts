import { describe, expect, it } from 'vitest';
import { BODY_SYSTEMS, HAZARDS, type HazardId } from '../../data/bodySystems';
import { COUNTERMEASURES } from '../../data/countermeasures';
import { INDICATORS, SYMPTOMS } from '../../data/indicators';
import { sourceById } from '../../data/sources';
import { CREW } from '../../data/crew';
import { systemStatus, symptomsInFinding, worstSystem } from '../bodymap';
import { evaluate } from '../rules';
import { simulateCrew, simulateMember } from '../simulate';
import type { CrewMember, Finding, MissionSettings } from '../types';

const base: MissionSettings = { environment: 'transit', scenario: 'nominal', currentDay: 30, baselineDays: 14, seed: 20261114 };

function withSymptomsToday(m: CrewMember, symptoms: string[], day = base.currentDay): CrewMember {
  return { ...m, records: m.records.map((r) => (r.day === day ? { ...r, symptoms, source: 'manual' as const } : r)) };
}

describe('body system data', () => {
  const indicatorIds = new Set(INDICATORS.map((i) => i.id));
  const symptomIds = new Set(SYMPTOMS.map((s) => s.id));

  it('references only valid indicators, symptoms, checklists and sources', () => {
    for (const sys of BODY_SYSTEMS) {
      for (const i of sys.indicators) expect(indicatorIds.has(i), `${sys.id}: indicator ${i}`).toBe(true);
      for (const s of sys.symptoms) expect(symptomIds.has(s), `${sys.id}: symptom ${s}`).toBe(true);
      for (const c of sys.checklists) expect(COUNTERMEASURES[c], `${sys.id}: checklist ${c}`).toBeDefined();
      for (const src of sys.sources) expect(sourceById(src), `${sys.id}: source ${src}`).toBeDefined();
      expect(sys.sources.length).toBeGreaterThan(0);
      expect(sys.hazards.length).toBeGreaterThan(0);
      for (const h of sys.hazards) expect(h.effect.length).toBeGreaterThan(20);
    }
  });

  it('has unique system ids', () => {
    expect(new Set(BODY_SYSTEMS.map((s) => s.id)).size).toBe(BODY_SYSTEMS.length);
  });

  it('covers every one of the five HRP hazards', () => {
    const used = new Set(BODY_SYSTEMS.flatMap((s) => s.hazards.map((h) => h.id)));
    for (const h of Object.keys(HAZARDS) as HazardId[]) expect(used.has(h), h).toBe(true);
  });

  it('maps every symptom to at least one system, so no symptom finding is dropped', () => {
    const mapped = new Set(BODY_SYSTEMS.flatMap((s) => s.symptoms));
    for (const s of SYMPTOMS) expect(mapped.has(s.id), s.id).toBe(true);
  });
});

describe('symptomsInFinding', () => {
  const f = (reason: string): Finding => ({
    id: 'x', crewId: 'cdr', day: 1, indicator: 'symptoms', level: 'amber', title: 't', reason, action: 'a', notifySurgeon: false, sources: [], basis: 'symptom',
  });

  it('does not confuse Headache with Worst-ever headache', () => {
    expect(symptomsInFinding(f('You reported: Worst-ever headache.'), ['headache', 'severeHeadache'])).toEqual(['severeHeadache']);
  });

  it('only counts symptoms reported today', () => {
    expect(symptomsInFinding(f('Nausea, Back pain.'), ['nausea'])).toEqual(['nausea']);
  });
});

describe('systemStatus', () => {
  it('is green for every system on a quiet nominal day', () => {
    const quiet = Array.from({ length: 50 }, (_, i) => i + 10)
      .flatMap((day) => {
        const s = { ...base, currentDay: day };
        return simulateCrew(s).map((m) => evaluate(m, s));
      })
      .find((ev) => ev.findings.length === 0);
    expect(quiet).toBeDefined();
    const st = systemStatus(quiet!);
    for (const sys of BODY_SYSTEMS) expect(st[sys.id].level, sys.id).toBe('green');
  });

  it('solar particle event turns the radiation system red on day 25', () => {
    const s = { ...base, scenario: 'spe' as const, currentDay: 25 };
    for (const m of simulateCrew(s)) {
      const st = systemStatus(evaluate(m, s));
      expect(st.skinRadiation.level).toBe('red');
      expect(st.skinRadiation.findings.some((f) => f.indicator === 'radDose')).toBe(true);
    }
  });

  it('early infection flags the immune system for FE1 on day 29', () => {
    const s = { ...base, scenario: 'illness' as const, currentDay: 29 };
    const st = systemStatus(evaluate(simulateCrew(s)[1], s));
    expect(st.immune.level).not.toBe('green');
    expect(st.immune.findings.some((f) => f.title === 'Fever')).toBe(true);
  });

  it('sleep debt turns the brain and behavior system red for the Commander on day 30', () => {
    const s = { ...base, scenario: 'sleepDebt' as const, currentDay: 30 };
    const st = systemStatus(evaluate(simulateCrew(s)[0], s));
    expect(st.neuroBehavioral.level).toBe('red');
    expect(st.neuroBehavioral.findings.some((f) => f.indicator === 'sleep' || f.indicator === 'pvtRt')).toBe(true);
    expect(worstSystem(st)).toBe('neuroBehavioral');
  });

  it('routes breathing rate to the heart and lungs, and HRV to both heart and brain', () => {
    const resp = BODY_SYSTEMS.filter((sys) => sys.indicators.includes('resp')).map((sys) => sys.id);
    const hrv = BODY_SYSTEMS.filter((sys) => sys.indicators.includes('hrv')).map((sys) => sys.id);
    expect(resp).toEqual(['cardio']);
    expect(hrv.sort()).toEqual(['cardio', 'neuroBehavioral']);
  });

  it('fast breathing at rest turns the heart and lungs system red', () => {
    const m = simulateMember(CREW[0], base);
    const fast = { ...m, records: m.records.map((r) => (r.day === base.currentDay ? { ...r, values: { ...r.values, resp: 32 } } : r)) };
    const st = systemStatus(evaluate(fast, base));
    expect(st.cardio.level).toBe('red');
    expect(st.cardio.findings.some((f) => f.indicator === 'resp')).toBe(true);
  });

  it('routes a red-flag symptom to its system only', () => {
    const ev = evaluate(withSymptomsToday(simulateMember(CREW[0], base), ['visionLoss']), base);
    const st = systemStatus(ev);
    expect(st.eyes.level).toBe('red');
    expect(st.cardio.findings.some((f) => f.indicator === 'symptoms')).toBe(false);
  });

  it('never invents a level: no system is worse than the overall evaluation', () => {
    const rank = { green: 0, amber: 1, red: 2 };
    for (const scenario of ['nominal', 'spe', 'sleepDebt', 'illness'] as const) {
      const s = { ...base, scenario, currentDay: 28 };
      for (const m of simulateCrew(s)) {
        const ev = evaluate(m, s);
        const st = systemStatus(ev);
        for (const sys of BODY_SYSTEMS) expect(rank[st[sys.id].level]).toBeLessThanOrEqual(rank[ev.overall]);
        // Every non-routine finding lands in at least one system.
        for (const f of ev.findings.filter((x) => x.indicator !== 'routine')) {
          expect(BODY_SYSTEMS.some((sys) => st[sys.id].findings.includes(f)), f.title).toBe(true);
        }
      }
    }
  });
});
