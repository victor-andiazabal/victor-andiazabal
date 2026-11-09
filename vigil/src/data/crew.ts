import type { CrewMember, IndicatorId } from '../lib/types';

/**
 * Four simulated crew members. They are fictional people with plausible resting values;
 * nothing here is data from a real astronaut.
 */
const sp = (o: Partial<Record<IndicatorId, number>>): Record<IndicatorId, number> => ({
  hr: 62,
  bpSys: 116,
  bpDia: 74,
  spo2: 97,
  resp: 14,
  hrv: 48,
  temp: 36.7,
  glucose: 88,
  weight: 72,
  sleep: 7.2,
  exercise: 120,
  mood: 4,
  stress: 2,
  kss: 3,
  pvtRt: 265,
  pvtLapses: 1,
  radDose: 0,
  ...o,
});

export const CREW: Omit<CrewMember, 'records'>[] = [
  {
    id: 'cdr',
    callsign: 'Commander',
    seat: 'CDR',
    name: 'Elena Marsh',
    role: 'Commander, pilot',
    agency: 'NASA',
    hue: 262,
    setpoints: sp({ hr: 58, bpSys: 118, bpDia: 76, weight: 78.4, sleep: 6.9, pvtRt: 255, mood: 4, hrv: 56, resp: 13, kss: 3 }),
  },
  {
    id: 'fe1',
    callsign: 'Flight Engineer 1',
    seat: 'FE1',
    name: 'Tomás Reyes',
    role: 'Flight engineer, crew medical officer',
    agency: 'ESA',
    hue: 190,
    setpoints: sp({ hr: 64, bpSys: 112, bpDia: 72, weight: 63.2, sleep: 7.4, glucose: 84, pvtRt: 270, hrv: 44, resp: 15, kss: 3 }),
  },
  {
    id: 'fe2',
    callsign: 'Flight Engineer 2',
    seat: 'FE2',
    name: 'Priya Nair',
    role: 'Flight engineer, EVA lead',
    agency: 'CSA',
    hue: 330,
    setpoints: sp({ hr: 55, bpSys: 121, bpDia: 78, weight: 81.0, sleep: 6.9, exercise: 140, pvtRt: 248, stress: 2, hrv: 62, resp: 12, kss: 3 }),
  },
  {
    id: 'ms1',
    callsign: 'Mission Specialist',
    seat: 'MS1',
    name: 'Kenji Sato',
    role: 'Mission specialist, science',
    agency: 'JAXA',
    hue: 150,
    setpoints: sp({ hr: 68, bpSys: 110, bpDia: 70, weight: 59.8, sleep: 7.6, glucose: 92, pvtRt: 282, mood: 4, hrv: 40, resp: 16, kss: 3 }),
  },
];
