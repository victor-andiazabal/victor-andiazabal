import { useMemo, useState } from 'react';
import { INDICATORS, indicatorById } from '../../data/indicators';
import { evaluate, type Evaluation } from '../../lib/rules';
import type { CrewMember, DayRecord, IndicatorId } from '../../lib/types';
import { useStore } from '../../state/store';
import type { Prefill } from '../controls/prefill';

export type DraftValues = Partial<Record<IndicatorId, number | null>>;
export type PrefillMap = Partial<Record<IndicatorId, { value: number; source: Prefill }>>;

/**
 * Where each starting value comes from. Today's record wins: a saved entry ('saved'), or the simulated feed, where
 * device indicators read as 'wearable' and hand-entered ones as 'simulated'. With no record today, yesterday's
 * values are offered ('yesterday').
 */
export function buildPrefill(records: DayRecord[], day: number): PrefillMap {
  const today = records.find((r) => r.day === day);
  const yesterday = records.find((r) => r.day === day - 1);
  const out: PrefillMap = {};
  for (const def of INDICATORS) {
    const t = today?.values[def.id];
    if (today && Number.isFinite(t)) {
      const source: Prefill = today.source === 'manual' ? 'saved' : def.entry === 'device' ? 'wearable' : 'simulated';
      out[def.id] = { value: t as number, source };
      continue;
    }
    const y = yesterday?.values[def.id];
    if (!today && Number.isFinite(y) && def.id !== 'radDose') out[def.id] = { value: y as number, source: 'yesterday' };
  }
  return out;
}

export function isOutOfRange(id: IndicatorId, v: number | null | undefined): boolean {
  if (v === null || v === undefined) return false;
  const def = indicatorById(id);
  return !Number.isFinite(v) || v < def.min || v > def.max;
}

/** The record the check-in would save: only finite, in-range values. */
export function draftRecord(day: number, draft: DraftValues, symptoms: string[], notes: string): DayRecord {
  const values: Partial<Record<IndicatorId, number>> = {};
  for (const def of INDICATORS) {
    const v = draft[def.id];
    if (v !== null && v !== undefined && !isOutOfRange(def.id, v)) values[def.id] = v;
  }
  return { day, values, symptoms, notes, source: 'manual' };
}

/** Evaluate the crew member as if this draft were today's record. */
export function previewOf(crew: CrewMember, record: DayRecord, settings: Parameters<typeof evaluate>[1]): Evaluation {
  const has = crew.records.some((r) => r.day === record.day);
  const records = has ? crew.records.map((r) => (r.day === record.day ? record : r)) : [...crew.records, record].sort((a, b) => a.day - b.day);
  return evaluate({ ...crew, records }, settings);
}

export function useCheckinDraft() {
  const { selected, settings, dispatch, manual } = useStore();
  const day = settings.currentDay;
  const existing = selected.records.find((r) => r.day === day);
  const isManual = Boolean(manual[`${selected.id}:${day}`]);

  const [prefill] = useState<PrefillMap>(() => buildPrefill(selected.records, day));
  const [draft, setDraft] = useState<DraftValues>(() =>
    Object.fromEntries(Object.entries(prefill).map(([id, p]) => [id, p!.value])) as DraftValues,
  );
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const record = useMemo(() => draftRecord(day, draft, symptoms, notes), [day, draft, symptoms, notes]);
  const preview = useMemo(() => previewOf(selected, record, settings), [selected, record, settings]);
  const invalid = INDICATORS.filter((d) => isOutOfRange(d.id, draft[d.id])).map((d) => d.id);

  const setValue = (id: IndicatorId, v: number | null) => setDraft((d) => ({ ...d, [id]: v }));
  const toggleSymptom = (id: string) => setSymptoms((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const clearSymptoms = () => setSymptoms([]);
  const save = () => dispatch({ type: 'manual', crewId: selected.id, record });

  /** The chip shows only while the value is still the prefilled one. */
  const prefillOf = (id: IndicatorId): Prefill | null => {
    const p = prefill[id];
    return p && draft[id] === p.value ? p.source : null;
  };

  return { selected, settings, day, isManual, prefill, draft, setValue, prefillOf, symptoms, toggleSymptom, clearSymptoms, notes, setNotes, record, preview, invalid, save };
}

export type CheckinDraft = ReturnType<typeof useCheckinDraft>;
