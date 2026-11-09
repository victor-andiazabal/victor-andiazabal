import type { AppState, MissionSettings } from './types';

export const STATE_KEY = 'vigil:v1';

export const DEFAULT_SETTINGS: MissionSettings = {
  environment: 'transit',
  scenario: 'sleepDebt',
  currentDay: 30,
  baselineDays: 14,
  seed: 20261114,
};

export type Persisted = Pick<AppState, 'settings' | 'selectedCrewId' | 'manual' | 'acknowledged' | 'routineDone' | 'surgeonNotes'>;

export function loadState(): Persisted | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Persisted>;
    if (!p.settings) return null;
    return {
      settings: { ...DEFAULT_SETTINGS, ...p.settings },
      selectedCrewId: p.selectedCrewId ?? 'cdr',
      manual: p.manual ?? {},
      acknowledged: p.acknowledged ?? {},
      routineDone: p.routineDone ?? {},
      surgeonNotes: p.surgeonNotes ?? {},
    };
  } catch {
    return null;
  }
}

export function serializeState(p: Persisted): string {
  return JSON.stringify(p);
}

export function saveState(p: Persisted) {
  try {
    localStorage.setItem(STATE_KEY, serializeState(p));
  } catch {
    /* storage unavailable (private window, etc.) */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    /* ignore */
  }
}
