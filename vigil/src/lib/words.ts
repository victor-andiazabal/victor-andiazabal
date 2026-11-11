import type { IndicatorDef } from '../data/indicators';
import { ENVIRONMENTS } from '../data/indicators';
import { fmt } from './format';
import type { Evaluation } from './rules';
import type { Environment } from './types';

type Status = Evaluation['byIndicator'][keyof Evaluation['byIndicator']];

/** One plain sentence on where today's value sits against the person's own history (or, for dose, the place). */
export function tileNote(def: IndicatorDef, status: Status, environment: Environment): string {
  if (status.value === null) return 'No reading today';
  if (def.id === 'radDose') {
    const env = ENVIRONMENTS[environment];
    const r = status.value / env.dailyDoseMsv;
    return r < 1.5 ? `A normal day here (about ${env.dailyDoseMsv} mSv is typical)` : `${r.toFixed(1)} times a normal day here (${env.dailyDoseMsv} mSv is typical)`;
  }
  const b = status.baseline;
  if (!b) return 'No baseline yet';
  const usual = `${fmt(def.id, b.median)}`;
  if (status.z === null) return `You usually sit around ${usual} ${def.unit}`;
  const abs = Math.abs(status.z);
  const dir = status.z > 0 ? 'above' : 'below';
  if (abs < 1) return `About where you usually are (${usual})`;
  if (abs < 2) return `A bit ${dir} your usual ${usual}`;
  if (abs < 3) return `Clearly ${dir} your usual ${usual}`;
  return `Well ${dir} your usual ${usual}`;
}
