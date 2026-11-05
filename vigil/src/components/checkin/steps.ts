import type { IndicatorId } from '../../lib/types';

export type StepId = 'vitals' | 'body' | 'sleep' | 'symptoms' | 'review';

export interface StepDef {
  id: StepId;
  label: string;
  /** One line under the step title. */
  blurb: string;
  /** Fields on the step, in entry order. */
  fields: IndicatorId[];
}

/** The five-step procedure from brief 5.2. Every indicator in INDICATORS appears on exactly one step. */
export const STEPS: StepDef[] = [
  {
    id: 'vitals',
    label: 'Vitals',
    blurb: 'Cuff, oximeter and thermometer. Sit quietly for 5 minutes first.',
    fields: ['bpSys', 'bpDia', 'hr', 'spo2', 'temp'],
  },
  {
    id: 'body',
    label: 'Body',
    blurb: 'Fasting glucose each morning, body mass weekly, exercise and the dosimeter.',
    fields: ['glucose', 'weight', 'exercise', 'radDose'],
  },
  {
    id: 'sleep',
    label: 'Sleep and alertness',
    blurb: 'Honest ratings matter more than good ones.',
    fields: ['sleep', 'kss', 'mood', 'stress', 'pvtRt', 'pvtLapses'],
  },
  { id: 'symptoms', label: 'Symptoms', blurb: 'Tap everything that applies today.', fields: [] },
  { id: 'review', label: 'Review', blurb: 'Every value, and what it will flag, before you save.', fields: [] },
];

export const REVIEW_STEP = STEPS.length - 1;
export const SYMPTOMS_STEP = STEPS.findIndex((s) => s.id === 'symptoms');

/** Rated on a 1-n scale with option buttons instead of a number field. */
export const SCALE_FIELDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>(['kss', 'mood', 'stress']);

/** Filled in by the reaction test; shown behind a disclosure on the sleep step. */
export const PVT_FIELDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>(['pvtRt', 'pvtLapses']);

/** Index of the step that holds an indicator; 0 when none does. */
export function stepOf(id: IndicatorId | undefined): number {
  if (!id) return 0;
  const i = STEPS.findIndex((s) => s.fields.includes(id));
  return i < 0 ? 0 : i;
}

/** In flight, body mass is measured on the first day of each week (the simulator's weekly reading). */
export function isWeighDay(day: number): boolean {
  return ((day % 7) + 7) % 7 === 0;
}

/** The next weekly weigh day after `day`. */
export function nextWeighDay(day: number): number {
  return day + (7 - (((day % 7) + 7) % 7));
}

/** Fields on a step that count for "Confirm all": the weekly body mass only on a weigh day or once it has a value. */
export function visibleFields(step: StepDef, day: number, weight: number | null | undefined): IndicatorId[] {
  return step.fields.filter((id) => id !== 'weight' || isWeighDay(day) || weight != null);
}
