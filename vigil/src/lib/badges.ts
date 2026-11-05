import { routineFor } from '../components/Routine';
import { INDICATORS } from '../data/indicators';
import type { CrewMember, DayRecord, IndicatorId, MissionSettings } from './types';

export interface Badge {
  id: string;
  label: string;
  icon: string;
  /** What to do to earn it. */
  how: string;
  /** One line tying the behaviour to the health countermeasure. */
  why: string;
  /** Ids into data/sources.ts */
  sources?: string[];
}

export interface BadgeProgress {
  badge: Badge;
  earned: boolean;
  current: number;
  target: number;
}

/** ISS schedules assign about 147 min/day of exercise (source `iss-exercise`; same value as the Trends reference line). */
export const EXERCISE_ASSIGNED_MIN = 147;
export const STREAK_SHORT = 7;
export const STREAK_LONG = 14;
export const PVT_TESTS_PER_WEEK = 3;
export const EXERCISE_DAYS_RUNNING = 5;
const WEEK = 7;

/**
 * Badges reward behaviours only: measuring, finishing routine tasks, testing, exercising. None looks at whether a
 * value is "good" or whether symptoms were reported, so there is no reward for under-reporting.
 */
export const BADGES: Badge[] = [
  { id: 'first-checkin', label: 'First check-in', icon: '1', how: 'Save your first check-in or tick a routine task on a flight day.', why: 'Your own entries build the personal baseline every alert is compared against.' },
  { id: 'streak-7', label: '7-day streak', icon: '7', how: `Log an entry on ${STREAK_SHORT} flight days in a row.`, why: 'Readings taken every day are comparable; gaps hide slow drifts.' },
  { id: 'streak-14', label: '14-day streak', icon: '14', how: `Log an entry on ${STREAK_LONG} flight days in a row.`, why: 'Two weeks of steady data is enough to see your own trend, not just single readings.' },
  { id: 'full-routine', label: 'Full routine day', icon: '✓', how: 'Tick every routine task on a single day.', why: 'The routine mirrors what crews already do: measure, exercise, rest and stay connected.', sources: ['hfbp'] },
  { id: 'pvt-week', label: 'Steady reflexes', icon: 'RT', how: `Run the reaction self-test on ${PVT_TESTS_PER_WEEK} days within one week.`, why: 'Repeated reaction tests catch sleep loss before it shows in how you feel. The speed of the result does not matter.', sources: ['reaction-self-test'] },
  { id: 'exercise-met', label: 'Countermeasure met', icon: 'EX', how: `Log at least ${EXERCISE_ASSIGNED_MIN} min of exercise on ${EXERCISE_DAYS_RUNNING} days in a row.`, why: 'Exercise is the main countermeasure for bone and muscle loss; ISS crews are assigned about 147 min/day.', sources: ['iss-exercise'] },
  { id: 'complete-record', label: 'Complete record', icon: '▦', how: 'Log every hand-entered indicator on a single day.', why: 'A full set of readings shows the whole picture, including values you expect to be unremarkable.' },
];

const badgeById = (id: string): Badge => BADGES.find((b) => b.id === id)!;

type Tasks = ReturnType<typeof routineFor>;

/** Flight days only: after launch (> 0) and up to the current mission day. */
function flightDays(settings: MissionSettings): number[] {
  return Array.from({ length: Math.max(0, settings.currentDay) }, (_, i) => i + 1);
}

/** Records the person entered themselves. Simulated history never earns a badge. */
function ownRecords(crew: CrewMember, settings: MissionSettings): Map<number, DayRecord> {
  const own = crew.records.filter((r) => r.source === 'manual' && r.day >= 1 && r.day <= settings.currentDay);
  return new Map(own.map((r) => [r.day, r]));
}

const doneCount = (crew: CrewMember, routineDone: Record<string, boolean>, day: number, tasks: Tasks) =>
  tasks.filter((t) => routineDone[`${crew.id}:${day}:${t.id}`]).length;

/** Longest run of consecutive days (in the given ascending list) that satisfy `ok`. */
function longestRun(days: number[], ok: (d: number) => boolean): number {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = ok(d) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** Hand-entered indicators expected every day. Body mass is weekly in flight, so it is not required daily. */
const MANUAL_DAILY: IndicatorId[] = INDICATORS.filter((i) => i.entry === 'manual' && i.id !== 'weight').map((i) => i.id);

/** Most days with a reaction test inside any single 7-day window. */
function bestWeekOfTests(days: number[], tested: (d: number) => boolean): number {
  return days.reduce((best, d) => {
    const inWindow = days.filter((x) => x > d - WEEK && x <= d && tested(x)).length;
    return Math.max(best, inWindow);
  }, 0);
}

/**
 * Same "entered" rule as the streak in components/Routine.tsx: a day counts when the person saved a manual entry or
 * ticked any routine task. Duplicated here because that logic is not exported; the integrator can dedupe later.
 * (Routine.tsx counts back from today; badges use the longest run so an earned patch is never lost.)
 */
export function badgeProgress(crew: CrewMember, routineDone: Record<string, boolean>, settings: MissionSettings): BadgeProgress[] {
  const days = flightDays(settings);
  const own = ownRecords(crew, settings);
  const tasks = routineFor(settings.environment);
  const entered = (d: number) => own.has(d) || doneCount(crew, routineDone, d, tasks) > 0;
  const finite = (d: number, id: IndicatorId) => Number.isFinite(own.get(d)?.values[id]);

  const enteredDays = days.filter(entered).length;
  const run = longestRun(days, entered);
  const bestRoutine = Math.max(0, ...days.map((d) => doneCount(crew, routineDone, d, tasks)));
  const pvtWeek = bestWeekOfTests(days, (d) => finite(d, 'pvtRt'));
  const exRun = longestRun(days, (d) => (own.get(d)?.values.exercise ?? 0) >= EXERCISE_ASSIGNED_MIN);
  const bestRecord = Math.max(0, ...days.map((d) => MANUAL_DAILY.filter((id) => finite(d, id)).length));

  const row = (id: string, current: number, target: number): BadgeProgress => ({
    badge: badgeById(id),
    earned: current >= target,
    current: Math.min(current, target),
    target,
  });

  return [
    row('first-checkin', enteredDays, 1),
    row('streak-7', run, STREAK_SHORT),
    row('streak-14', run, STREAK_LONG),
    row('full-routine', bestRoutine, tasks.length),
    row('pvt-week', pvtWeek, PVT_TESTS_PER_WEEK),
    row('exercise-met', exRun, EXERCISE_DAYS_RUNNING),
    row('complete-record', bestRecord, MANUAL_DAILY.length),
  ];
}

export function earnedBadges(crew: CrewMember, routineDone: Record<string, boolean>, settings: MissionSettings): Badge[] {
  return badgeProgress(crew, routineDone, settings).filter((p) => p.earned).map((p) => p.badge);
}
