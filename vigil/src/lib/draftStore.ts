/**
 * In-progress check-ins, kept outside the component so leaving the screen or switching crew member does not lose
 * them. Keyed by `${crewId}:${day}`, mirrored to sessionStorage so a reload in the same tab keeps them too.
 */
import type { IndicatorId } from './types';

export const DRAFTS_KEY = 'vigil:checkin-drafts';

export type DraftValues = Partial<Record<IndicatorId, number | null>>;

export interface StoredDraft {
  /** Only the values the person changed from the prefill; untouched fields follow the latest prefill on return. */
  edits: DraftValues;
  symptoms: string[];
  notes: string;
  step: number;
  furthest: number;
}

let drafts: Record<string, StoredDraft> | null = null;

function read(): Record<string, StoredDraft> {
  try {
    const raw = sessionStorage.getItem(DRAFTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, StoredDraft>) : {};
  } catch {
    return {};
  }
}

function write(all: Record<string, StoredDraft>) {
  try {
    sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable (private window, quota): the draft still lives in memory for this session */
  }
}

const all = (): Record<string, StoredDraft> => (drafts ??= read());

export const draftKey = (crewId: string, day: number): string => `${crewId}:${day}`;

export function getDraft(key: string): StoredDraft | null {
  return all()[key] ?? null;
}

export function putDraft(key: string, draft: StoredDraft): void {
  drafts = { ...all(), [key]: draft };
  write(drafts);
}

export function clearDraft(key: string): void {
  if (!(key in all())) return;
  const rest = Object.fromEntries(Object.entries(all()).filter(([k]) => k !== key));
  drafts = rest;
  write(rest);
}

/** The values that differ from the prefill, so a later prefill (a reaction test saved meanwhile) still shows through. */
export function editsOf(values: DraftValues, prefill: DraftValues): DraftValues {
  return Object.fromEntries(Object.entries(values).filter(([id, v]) => v !== prefill[id as IndicatorId])) as DraftValues;
}

/** Drops the in-memory copy so the next read comes from sessionStorage (tests). */
export function resetDraftCache(): void {
  drafts = null;
}
