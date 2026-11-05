import { useEffect, useMemo, useRef, useState } from 'react';
import { INDICATORS, indicatorById } from '../../data/indicators';
import { clearDraft, draftKey, editsOf, getDraft, putDraft, type DraftValues } from '../../lib/draftStore';
import { evaluate, type Evaluation } from '../../lib/rules';
import { isCheckin } from '../../lib/today';
import type { CrewMember, DayRecord, IndicatorId } from '../../lib/types';
import { useStore } from '../../state/store';
import type { Prefill } from '../controls/prefill';
import { PVT_FIELDS } from './steps';

export type { DraftValues } from '../../lib/draftStore';
export type PrefillMap = Partial<Record<IndicatorId, { value: number; source: Prefill }>>;

/**
 * Where each starting value comes from. Today's record wins: a saved entry ('saved'), or the simulated feed, where
 * device indicators read as 'wearable' and hand-entered ones as 'simulated'. A reaction test saved on its own counts
 * as saved for its two values only; the rest of that record is the simulated feed. With no record today, yesterday's
 * values are offered ('yesterday').
 */
export function buildPrefill(records: DayRecord[], day: number): PrefillMap {
  const today = records.find((r) => r.day === day);
  const yesterday = records.find((r) => r.day === day - 1);
  const out: PrefillMap = {};
  for (const def of INDICATORS) {
    const t = today?.values[def.id];
    if (today && Number.isFinite(t)) {
      const saved = today.source === 'manual' || (today.source === 'pvt' && PVT_FIELDS.has(def.id));
      const source: Prefill = saved ? 'saved' : def.entry === 'device' ? 'wearable' : 'simulated';
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

const valuesOf = (prefill: PrefillMap): DraftValues =>
  Object.fromEntries(Object.entries(prefill).map(([id, p]) => [id, p!.value])) as DraftValues;

/**
 * The check-in being filled in. It is restored from the draft store on mount and written back on every change, so
 * leaving the screen or switching crew member keeps it; saving clears it. `startStep` (the re-measure field's step)
 * overrides the stored step.
 */
export function useCheckinDraft(startStep?: number) {
  const { selected, settings, dispatch, manual } = useStore();
  const day = settings.currentDay;
  const key = draftKey(selected.id, day);
  const existing = selected.records.find((r) => r.day === day);
  const isManual = isCheckin(manual[key]);

  const [prefill] = useState<PrefillMap>(() => buildPrefill(selected.records, day));
  const [stored] = useState(() => getDraft(key));
  const [draft, setDraft] = useState<DraftValues>(() => ({ ...valuesOf(prefill), ...stored?.edits }));
  const [symptoms, setSymptoms] = useState<string[]>(() => stored?.symptoms ?? existing?.symptoms ?? []);
  const [notes, setNotes] = useState(() => stored?.notes ?? existing?.notes ?? '');
  const [step, setStep] = useState(() => startStep ?? stored?.step ?? 0);
  const [furthest, setFurthest] = useState(() => Math.max(startStep ?? stored?.step ?? 0, stored?.furthest ?? 0));
  const saved = useRef(false);

  // Write every change back; after a save the draft is gone and must not be written again on the way out.
  useEffect(() => {
    if (saved.current) return;
    putDraft(key, { edits: editsOf(draft, valuesOf(prefill)), symptoms, notes, step, furthest });
  }, [key, prefill, draft, symptoms, notes, step, furthest]);

  const record = useMemo(() => draftRecord(day, draft, symptoms, notes), [day, draft, symptoms, notes]);
  const preview = useMemo(() => previewOf(selected, record, settings), [selected, record, settings]);
  const invalid = INDICATORS.filter((d) => isOutOfRange(d.id, draft[d.id])).map((d) => d.id);

  const setValue = (id: IndicatorId, v: number | null) => setDraft((d) => ({ ...d, [id]: v }));
  const toggleSymptom = (id: string) => setSymptoms((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const clearSymptoms = () => setSymptoms([]);
  const goStep = (to: number) => {
    setStep(to);
    setFurthest((f) => Math.max(f, to));
  };
  const save = () => {
    saved.current = true;
    clearDraft(key);
    dispatch({ type: 'manual', crewId: selected.id, record });
  };

  /** The chip shows only while the value is still the prefilled one. */
  const prefillOf = (id: IndicatorId): Prefill | null => {
    const p = prefill[id];
    return p && draft[id] === p.value ? p.source : null;
  };

  return {
    selected, settings, day, isManual, prefill, draft, setValue, prefillOf, symptoms, toggleSymptom, clearSymptoms, notes, setNotes,
    step, furthest, goStep, record, preview, invalid, save,
  };
}

export type CheckinDraft = ReturnType<typeof useCheckinDraft>;
