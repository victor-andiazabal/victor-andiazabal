import type { View } from '../App';
import type { Environment } from '../lib/types';

/** Routine task id of the reaction self-test; ReactionTest ticks it when a run is saved, and the pvt-week badge counts it. */
export const PVT_TASK_ID = 'wake-pvt';

export interface RoutineTask {
  id: string;
  time: string;
  label: string;
  why: string;
  view?: View;
}

/** Daily prompts. Times follow a typical crew day; the flight surgeon adjusts them per mission. */
export function routineFor(env: Environment): RoutineTask[] {
  const base: RoutineTask[] = [
    { id: PVT_TASK_ID, time: '06:15', label: 'Reaction self-test after waking', why: 'Catches sleep loss before it shows in how you feel.', view: 'pvt' },
    { id: 'vitals', time: '06:30', label: 'Vitals: blood pressure, SpO2, temperature, fasting glucose', why: 'Same time each day keeps readings comparable.', view: 'checkin' },
    { id: 'checkin', time: '06:40', label: 'Daily check-in: sleep, mood, stress, symptoms', why: 'Builds the baseline the alerts depend on.', view: 'checkin' },
    { id: 'water', time: '09:00', label: 'Hydration check: 2 L target by end of day', why: 'Fluid shifts and dry cabin air both push toward dehydration.' },
    { id: 'exercise', time: '13:00', label: 'Exercise block: resistive first, then aerobic', why: 'The main countermeasure for bone and muscle loss.', view: 'checkin' },
    { id: 'connect', time: '18:30', label: 'Family or crew social time, 20 minutes', why: 'Isolation and confinement are one of the five hazards.' },
    { id: 'winddown', time: '21:00', label: 'Lights dimmed, screens off, sleep period protected', why: 'ISS crews average only about 6 h; protect the 8.5 h slot.' },
  ];
  if (env === 'transit' || env === 'rover') {
    base.splice(3, 0, { id: 'dose', time: '08:00', label: 'Read the dosimeter and check the space-weather notice', why: 'Deep space has no magnetic shielding; a solar event needs a fast move to shelter.', view: 'checkin' });
  }
  if (env === 'base') {
    base.splice(5, 0, { id: 'mass', time: '12:30', label: 'Weekly body mass (surface scale)', why: 'Tracks nutrition over the long stay.', view: 'checkin' });
  }
  return base;
}
