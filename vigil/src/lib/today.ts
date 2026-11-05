import { INDICATORS } from '../data/indicators';
import { PVT_TASK_ID } from '../data/routine';
import type { Baseline } from './analytics';
import { fmt, LEVEL_LABEL } from './format';
import { evaluate } from './rules';
import type { CrewMember, DayRecord, Finding, IndicatorId, Level, MissionSettings } from './types';
import type { View } from './views';

/** The baseline band spans median ± BAND_Z typical deviations (MAD scaled to estimate the SD). */
export const BAND_Z = 2;

/** Days shown in each tile's status strip. */
export const STRIP_DAYS = 14;

export type NextActionKind = 'checkin' | 'pvt' | 'remeasure' | 'report';

export interface NextAction {
  kind: NextActionKind;
  label: string;
  view: View;
  /** The flagged indicator a re-measure is about, when there is one. */
  indicator?: IndicatorId;
}

export interface NextActionInput {
  crewId: string;
  day: number;
  manual: Record<string, DayRecord>;
  routineDone: Record<string, boolean>;
  findings: Finding[];
}

/**
 * The single next step on Today, checked in this order: no check-in today, then no reaction test today,
 * then any Act now finding today, otherwise send the report. A "check-in today" is a manual record for the day.
 */
export function nextAction({ crewId, day, manual, routineDone, findings }: NextActionInput): NextAction {
  if (!manual[`${crewId}:${day}`]) return { kind: 'checkin', label: 'Start check-in', view: 'checkin' };
  if (!routineDone[`${crewId}:${day}:${PVT_TASK_ID}`]) return { kind: 'pvt', label: 'Run reaction test', view: 'pvt' };
  const red = findings.find((f) => f.day === day && f.level === 'red');
  if (red) {
    const indicator = red.indicator === 'symptoms' || red.indicator === 'routine' ? undefined : red.indicator;
    return { kind: 'remeasure', label: 'Re-measure in 30 min', view: 'checkin', indicator };
  }
  return { kind: 'report', label: "Send today's report", view: 'alerts' };
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** One line under the status word, following the brief's three templates. */
export function reasonLine(findings: Finding[]): string {
  const red = findings.filter((f) => f.level === 'red');
  const amber = findings.filter((f) => f.level === 'amber');
  const list = (fs: Finding[]) => fs.map((f) => lowerFirst(f.title)).join(', ');
  if (red.length) return `${red.length} item${red.length === 1 ? '' : 's'} need${red.length === 1 ? 's' : ''} action: ${list(red)}`;
  if (amber.length) return `${amber.length} to watch: ${list(amber)}`;
  return 'All readings inside your normal range';
}

export interface StripDay {
  day: number;
  level: Level | null;
  label: string;
}

/**
 * Per-indicator status for the last `days` mission days, from one evaluation per day.
 * A day without a record, or without that reading, has level null.
 */
export function buildStatusHistory(crew: CrewMember, settings: MissionSettings, days = STRIP_DAYS): Record<IndicatorId, StripDay[]> {
  const first = Math.max(1, settings.currentDay - days + 1);
  const out = Object.fromEntries(INDICATORS.map((d) => [d.id, [] as StripDay[]])) as Record<IndicatorId, StripDay[]>;
  for (let day = first; day <= settings.currentDay; day++) {
    const ev = evaluate(crew, { ...settings, currentDay: day });
    const rec = ev.record?.day === day ? ev.record : null;
    for (const def of INDICATORS) {
      const v = rec?.values[def.id];
      const measured = Number.isFinite(v);
      const level = measured ? ev.byIndicator[def.id].level : null;
      const label = level ? `Day ${day}: ${fmt(def.id, v)} ${def.unit}, ${LEVEL_LABEL[level]}` : `Day ${day}: no reading`;
      out[def.id] = [...out[def.id], { day, level, label }];
    }
  }
  return out;
}

/** Display window for a baseline band: about ±4 typical deviations, widened to keep today's value in view. */
export function bandScale(value: number | null, baseline: Baseline | null, limits: { min: number; max: number }): { min: number; max: number } {
  if (!baseline) return limits;
  const reach = baseline.mad * (BAND_Z * 2);
  let min = baseline.median - reach;
  let max = baseline.median + reach;
  if (value !== null && Number.isFinite(value)) {
    min = Math.min(min, value - baseline.mad);
    max = Math.max(max, value + baseline.mad);
  }
  return { min: Math.max(limits.min, min), max: Math.min(limits.max, max) };
}

/** Share of today's measured indicators that are Nominal; drives the status ring arc. */
export function inRangeShare(byIndicator: Record<IndicatorId, { level: Level; value: number | null }>): { inRange: number; measured: number } {
  const measured = INDICATORS.filter((d) => byIndicator[d.id].value !== null);
  return { inRange: measured.filter((d) => byIndicator[d.id].level === 'green').length, measured: measured.length };
}

export interface TileGroups<T> {
  /** Watch and Act now, Act now first; reading order kept inside each level. */
  attention: T[];
  /** Nominal with a reading today. */
  inRange: T[];
  /** No reading today. */
  unmeasured: T[];
}

/** Splits the Today tiles so everything that is not Nominal comes first. */
export function groupTiles<T extends { id: IndicatorId }>(
  defs: readonly T[],
  byIndicator: Record<IndicatorId, { level: Level; value: number | null }>,
): TileGroups<T> {
  const level = (d: T) => byIndicator[d.id].level;
  const measured = (d: T) => byIndicator[d.id].value !== null;
  return {
    attention: [...defs.filter((d) => level(d) === 'red'), ...defs.filter((d) => level(d) === 'amber')],
    inRange: defs.filter((d) => level(d) === 'green' && measured(d)),
    unmeasured: defs.filter((d) => level(d) === 'green' && !measured(d)),
  };
}

/** Tile grids are laid on 12 tracks so a row of 1 to 4 tiles always divides evenly. */
export const GRID_TRACKS = 12;

/**
 * Track span for each of `n` tiles in a grid of at most `maxCols` columns, with no part-filled last row.
 * Uses one column fewer when that divides the count; otherwise the tiles of the last row share it equally.
 * A single row narrower than `maxCols` keeps the standard width unless it is one tile short of full.
 */
export function tileSpans(n: number, maxCols: number): number[] {
  if (n <= 0) return [];
  const full = GRID_TRACKS / maxCols;
  if (n <= maxCols) return Array<number>(n).fill(n >= 2 && n === maxCols - 1 ? GRID_TRACKS / n : full);
  const options = [maxCols, maxCols - 1].filter((c) => c >= 2 && GRID_TRACKS % c === 0);
  const fill = (c: number) => (n % c === 0 ? 1 : (n % c) / c);
  const cols = options.reduce((best, c) => (fill(c) > fill(best) ? c : best));
  const rem = n % cols;
  return Array.from({ length: n }, (_, i) => (rem && i >= n - rem ? GRID_TRACKS / rem : GRID_TRACKS / cols));
}
