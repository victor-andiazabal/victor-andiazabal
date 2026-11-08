import { CREW } from '../data/crew';
import { ENVIRONMENTS, INDICATORS, indicatorById } from '../data/indicators';
import { gaussian, hashString, mulberry32 } from './prng';
import type { CrewMember, DayRecord, IndicatorId, MissionSettings, ScenarioId } from './types';

export const MAX_MISSION_DAY = 60;

/** Day-to-day noise for each indicator, roughly one standard deviation. */
const NOISE: Record<IndicatorId, number> = {
  hr: 3,
  bpSys: 5,
  bpDia: 3,
  spo2: 0.8,
  resp: 1.1,
  hrv: 5,
  temp: 0.18,
  glucose: 5,
  weight: 0.3,
  sleep: 0.55,
  exercise: 22,
  mood: 0.45,
  stress: 0.45,
  pvtRt: 14,
  pvtLapses: 0.9,
  radDose: 0,
};

export interface ScenarioDef {
  id: ScenarioId;
  label: string;
  blurb: string;
  /** Which crew member is affected; 'all' for crew-wide events. */
  target: 'all' | string;
  startDay: number;
  endDay: number;
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'nominal',
    label: 'Nominal mission',
    blurb: 'Normal day-to-day variation only. Use it to see what a quiet dashboard looks like.',
    target: 'all',
    startDay: 0,
    endDay: 0,
  },
  {
    id: 'spe',
    label: 'Solar particle event',
    blurb: 'A solar storm raises the daily dose for the whole crew for four days. Shelter and EVA rules kick in.',
    target: 'all',
    startDay: 24,
    endDay: 27,
  },
  {
    id: 'sleepDebt',
    label: 'Sleep debt and slowed reactions',
    blurb: 'The Commander loses sleep over a week of long shifts. Reaction-test times and mood drift before anything feels wrong.',
    target: 'cdr',
    startDay: 23,
    endDay: 30,
  },
  {
    id: 'illness',
    label: 'Early infection',
    blurb: 'Flight Engineer 1 develops a fever with rising heart rate and a small SpO2 dip. The flight surgeon is flagged.',
    target: 'fe1',
    startDay: 27,
    endDay: 30,
  },
];

export const scenarioById = (id: ScenarioId) => SCENARIOS.find((s) => s.id === id)!;

function clampRound(id: IndicatorId, v: number): number {
  const def = indicatorById(id);
  const c = Math.min(def.max, Math.max(def.min, v));
  const f = 10 ** def.decimals;
  return Math.round(c * f) / f;
}

function applyScenario(
  scenario: ScenarioId,
  crewId: string,
  day: number,
  v: Record<IndicatorId, number>,
  symptoms: string[],
  rand: () => number,
) {
  const def = scenarioById(scenario);
  if (def.id === 'nominal') return;
  if (def.target !== 'all' && def.target !== crewId) return;
  if (day < def.startDay || day > def.endDay) return;
  const t = day - def.startDay; // 0-based day within the event

  if (def.id === 'spe') {
    const profile = [6.5, 21.0, 13.5, 4.2];
    v.radDose = profile[Math.min(t, profile.length - 1)] * (0.9 + 0.2 * rand());
    if (t === 1 && rand() < 0.6) symptoms.push('headache');
  }

  if (def.id === 'sleepDebt') {
    const sleepProfile = [6.1, 5.6, 5.2, 4.9, 4.7, 4.6, 4.8, 4.6];
    v.sleep = sleepProfile[Math.min(t, sleepProfile.length - 1)] + 0.2 * gaussian(rand);
    const severity = Math.min(1, (t + 1) / 5);
    v.pvtRt += 25 + 70 * severity + 10 * gaussian(rand);
    v.pvtLapses += Math.round(1 + 5 * severity + rand());
    v.mood -= severity >= 0.6 ? 1.6 : 0.8;
    v.stress += severity >= 0.6 ? 1.6 : 0.9;
    v.hr += 3 + 4 * severity;
    v.hrv *= 1 - 0.3 * severity;
    if (t >= 3) symptoms.push('fatigue');
    if (t >= 4 && rand() < 0.5) symptoms.push('headache');
  }

  if (def.id === 'illness') {
    const tempProfile = [37.5, 38.2, 38.6, 38.1];
    const hrProfile = [8, 16, 24, 18];
    const spo2Profile = [-1, -2, -3.5, -2.5];
    v.temp = tempProfile[Math.min(t, 3)] + 0.1 * gaussian(rand);
    v.hr += hrProfile[Math.min(t, 3)];
    v.resp += [3, 6, 9, 7][Math.min(t, 3)];
    v.hrv *= [0.9, 0.75, 0.65, 0.7][Math.min(t, 3)];
    v.spo2 += spo2Profile[Math.min(t, 3)];
    v.sleep -= 0.8;
    v.exercise = t === 0 ? v.exercise * 0.6 : 0;
    v.mood -= 1;
    v.pvtRt += 20 + 10 * t;
    symptoms.push('fatigue');
    if (t >= 1) symptoms.push('congestion');
    if (t >= 1) symptoms.push('headache');
    if (t >= 2) symptoms.push('appetite');
  }
}

/** Build the full record history for one crew member. Deterministic for a given seed. */
export function simulateMember(
  base: Omit<CrewMember, 'records'>,
  settings: MissionSettings,
): CrewMember {
  const rand = mulberry32(settings.seed ^ hashString(base.id));
  const env = ENVIRONMENTS[settings.environment];
  const records: DayRecord[] = [];
  const lastDay = Math.min(settings.currentDay, MAX_MISSION_DAY);
  const sp = base.setpoints;

  for (let day = -settings.baselineDays + 1; day <= lastDay; day++) {
    const v = { ...sp } as Record<IndicatorId, number>;
    const symptoms: string[] = [];
    const inFlight = day >= 1;

    for (const def of INDICATORS) {
      if (def.id === 'radDose') continue;
      v[def.id] = sp[def.id] + NOISE[def.id] * gaussian(rand);
    }

    // Weekly rhythm: one lighter exercise day per week, slightly longer sleep after it.
    const weekday = ((day % 7) + 7) % 7;
    if (weekday === 6) {
      v.exercise = Math.max(0, v.exercise * 0.35);
      v.sleep += 0.5;
    }

    if (inFlight) {
      // Known in-flight tendencies, kept small: shorter sleep than on Earth, slow mass loss, slight HR rise.
      v.sleep -= 0.7;
      v.weight -= 0.018 * day;
      v.hr += 2;
      v.radDose = env.dailyDoseMsv * (0.85 + 0.3 * rand());
    } else {
      // Earth background radiation is about 0.01 mSv/day; shown as a near-zero reading pre-flight.
      v.radDose = 0.01 * (0.8 + 0.4 * rand());
    }

    // Occasional ordinary symptoms so the log is not sterile.
    if (rand() < 0.06) symptoms.push('headache');
    if (inFlight && day <= 3 && rand() < 0.7) symptoms.push('nausea');
    if (inFlight && day <= 5 && rand() < 0.5) symptoms.push('congestion');
    if (inFlight && rand() < 0.08) symptoms.push('backPain');

    applyScenario(settings.scenario, base.id, day, v, symptoms, rand);

    const values: Partial<Record<IndicatorId, number>> = {};
    for (const def of INDICATORS) values[def.id] = clampRound(def.id, v[def.id]);
    // Body mass is only measured weekly in flight.
    if (inFlight && weekday !== 0) delete values.weight;

    records.push({ day, values, symptoms: [...new Set(symptoms)], source: 'simulated' });
  }
  return { ...base, records };
}

export function simulateCrew(settings: MissionSettings): CrewMember[] {
  return CREW.map((c) => simulateMember(c, settings));
}
