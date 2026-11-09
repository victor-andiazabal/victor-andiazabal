import { indicatorById } from '../data/indicators';
import type { IndicatorId, Level } from './types';

export const LEVEL_LABEL: Record<Level, string> = { green: 'Normal for you', amber: 'Keep an eye on it', red: 'Needs action' };

/** Format an indicator value with its own decimal places; "--" when missing. */
export function fmt(id: IndicatorId, v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '--';
  return v.toFixed(indicatorById(id).decimals);
}
