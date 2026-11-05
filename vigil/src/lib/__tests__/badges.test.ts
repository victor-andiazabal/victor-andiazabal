import { describe, expect, it } from 'vitest';
import { CREW } from '../../data/crew';
import { INDICATORS } from '../../data/indicators';
import { PVT_TASK_ID, routineFor } from '../../data/routine';
import { badgeProgress, earnedBadges, EXERCISE_ASSIGNED_MIN } from '../badges';
import { simulateMember } from '../simulate';
import type { CrewMember, DayRecord, IndicatorId, MissionSettings } from '../types';

const settings: MissionSettings = { environment: 'transit', scenario: 'nominal', currentDay: 30, baselineDays: 14, seed: 20261114 };
const member = (s = settings): CrewMember => simulateMember(CREW[0], s);

/** Replace the record for a day with a manual one carrying the given values. */
function withManual(m: CrewMember, day: number, values: Partial<Record<IndicatorId, number>> = {}): CrewMember {
  const rec: DayRecord = { day, values, symptoms: [], source: 'manual' };
  const rest = m.records.filter((r) => r.day !== day);
  return { ...m, records: [...rest, rec].sort((a, b) => a.day - b.day) };
}
const withManualDays = (m: CrewMember, days: number[], values: Partial<Record<IndicatorId, number>> = {}) =>
  days.reduce((acc, d) => withManual(acc, d, values), m);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const ids = (m: CrewMember, done: Record<string, boolean> = {}, s = settings) => earnedBadges(m, done, s).map((b) => b.id);
const prog = (m: CrewMember, id: string, done: Record<string, boolean> = {}, s = settings) =>
  badgeProgress(m, done, s).find((p) => p.badge.id === id)!;
const doneKeys = (m: CrewMember, day: number, taskIds: string[]) =>
  Object.fromEntries(taskIds.map((t) => [`${m.id}:${day}:${t}`, true]));

describe('badges', () => {
  it('awards nothing for a member with no own data in flight days', () => {
    expect(ids(member())).toEqual([]);
    expect(badgeProgress(member(), {}, settings).every((p) => p.current === 0)).toBe(true);
  });

  it('ignores manual entries made before launch', () => {
    expect(ids(withManualDays(member(), [-3, -2, 0]))).toEqual([]);
  });

  it('first check-in comes from a manual entry or a ticked task', () => {
    expect(ids(withManual(member(), 4))).toContain('first-checkin');
    expect(ids(member(), { [`${member().id}:5:water`]: true })).toContain('first-checkin');
  });

  it('streak badges unlock at exactly 7 and 14 consecutive days, not at 6', () => {
    const six = withManualDays(member(), range(10, 15));
    expect(ids(six)).not.toContain('streak-7');
    expect(prog(six, 'streak-7')).toMatchObject({ current: 6, target: 7, earned: false });

    const seven = withManualDays(member(), range(10, 16));
    expect(ids(seven)).toContain('streak-7');
    expect(ids(seven)).not.toContain('streak-14');

    const thirteen = withManualDays(member(), range(1, 13));
    expect(ids(thirteen)).not.toContain('streak-14');
    expect(ids(withManualDays(member(), range(1, 14)))).toContain('streak-14');
  });

  it('a gap breaks the streak', () => {
    const gap = withManualDays(member(), [...range(1, 3), ...range(5, 10)]);
    expect(prog(gap, 'streak-7').current).toBe(6);
  });

  it('routine ticks count toward the streak', () => {
    const m = member();
    const done = Object.assign({}, ...range(1, 7).map((d) => doneKeys(m, d, ['water'])));
    expect(ids(m, done)).toContain('streak-7');
  });

  it('full routine needs every task on one day', () => {
    const m = member();
    const all = routineFor(settings.environment).map((t) => t.id);
    const partial = doneKeys(m, 3, all.slice(1));
    expect(ids(m, partial)).not.toContain('full-routine');
    expect(prog(m, 'full-routine', partial)).toMatchObject({ current: all.length - 1, target: all.length });
    // Tasks split across two days do not add up.
    const split = { ...doneKeys(m, 3, all.slice(0, 3)), ...doneKeys(m, 4, all.slice(3)) };
    expect(ids(m, split)).not.toContain('full-routine');
    expect(ids(m, doneKeys(m, 3, all))).toContain('full-routine');
  });

  it('exercise badge needs 5 consecutive days at or above the ISS assigned time', () => {
    const ok = { exercise: EXERCISE_ASSIGNED_MIN };
    expect(ids(withManualDays(member(), range(10, 14), ok))).toContain('exercise-met');
    expect(ids(withManualDays(member(), range(10, 13), ok))).not.toContain('exercise-met');
    const short = { exercise: EXERCISE_ASSIGNED_MIN - 1 };
    const broken = withManual(withManualDays(member(), range(10, 14), ok), 12, short);
    expect(ids(broken)).not.toContain('exercise-met');
    expect(prog(broken, 'exercise-met').current).toBe(2);
  });

  it('reaction badge needs 3 tested days inside one week', () => {
    const m = member();
    const tested = (days: number[]) => Object.assign({}, ...days.map((d) => doneKeys(m, d, [PVT_TASK_ID])));
    expect(ids(m, tested([5, 7, 9]))).toContain('pvt-week');
    expect(ids(m, tested([5, 7, 13]))).not.toContain('pvt-week');
    expect(prog(m, 'pvt-week', tested([5, 7, 13])).current).toBe(2);
  });

  it('a hand-entered reaction time without the reaction-test routine tick does not count', () => {
    // CheckIn prefills pvtRt from the simulated wearable, so the value alone proves nothing.
    const rt = { pvtRt: 280, pvtLapses: 0 };
    const m = withManualDays(member(), [5, 7, 9], rt);
    expect(ids(m)).not.toContain('pvt-week');
    expect(prog(m, 'pvt-week').current).toBe(0);
  });

  it('complete record needs every daily hand-entered indicator', () => {
    const daily = INDICATORS.filter((i) => i.entry === 'manual' && i.id !== 'weight').map((i) => i.id);
    const full = Object.fromEntries(daily.map((id) => [id, 1])) as Partial<Record<IndicatorId, number>>;
    expect(ids(withManual(member(), 8, full))).toContain('complete-record');
    const { mood: _omitted, ...missing } = full;
    const p = prog(withManual(member(), 8, missing), 'complete-record');
    expect(p.earned).toBe(false);
    expect(p).toMatchObject({ current: daily.length - 1, target: daily.length });
  });

  it('ignores days after the current mission day', () => {
    const early: MissionSettings = { ...settings, currentDay: 8 };
    const m = withManualDays(member(), range(1, 20));
    expect(prog(m, 'streak-7', {}, early).current).toBe(7);
    expect(ids(m, {}, early)).not.toContain('streak-14');
    expect(prog(m, 'streak-14', {}, early).current).toBe(8);
    const late = doneKeys(m, 25, routineFor(settings.environment).map((t) => t.id));
    expect(ids(member(), late, early)).toEqual([]);
  });

  it('never looks at the values themselves, only that they were logged', () => {
    const odd = { exercise: 0, mood: 1, stress: 5 };
    const m = withManualDays(member(), range(1, 7), odd);
    expect(ids(m)).toContain('streak-7');
  });
});
