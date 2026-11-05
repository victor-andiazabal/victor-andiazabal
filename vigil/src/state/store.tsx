import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { simulateCrew } from '../lib/simulate';
import { DEFAULT_SETTINGS, STATE_KEY, loadState, saveState, clearState, serializeState, type Persisted } from '../lib/storage';
import type { CrewMember, DayRecord, MissionSettings } from '../lib/types';

type Action =
  | { type: 'settings'; patch: Partial<MissionSettings> }
  | { type: 'select'; crewId: string }
  | { type: 'manual'; crewId: string; record: DayRecord }
  | { type: 'ack'; id: string }
  | { type: 'routine'; key: string; done: boolean }
  | { type: 'manualMany'; records: { crewId: string; record: DayRecord }[] }
  | { type: 'surgeonNote'; crewId: string; text: string }
  | { type: 'hydrate'; state: Persisted }
  | { type: 'reset' };

function reducer(s: Persisted, a: Action): Persisted {
  switch (a.type) {
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch } };
    case 'select':
      return { ...s, selectedCrewId: a.crewId };
    case 'manual':
      return { ...s, manual: { ...s.manual, [`${a.crewId}:${a.record.day}`]: a.record } };
    case 'ack':
      return { ...s, acknowledged: { ...s.acknowledged, [a.id]: Date.now() } };
    case 'routine':
      return { ...s, routineDone: { ...s.routineDone, [a.key]: a.done } };
    case 'manualMany': {
      const manual = { ...s.manual };
      for (const { crewId, record } of a.records) manual[`${crewId}:${record.day}`] = record;
      return { ...s, manual };
    }
    case 'surgeonNote':
      return { ...s, surgeonNotes: { ...s.surgeonNotes, [a.crewId]: a.text } };
    case 'hydrate':
      return a.state;
    case 'reset':
      return initial();
  }
}

function initial(): Persisted {
  return { settings: DEFAULT_SETTINGS, selectedCrewId: 'cdr', manual: {}, acknowledged: {}, routineDone: {}, surgeonNotes: {} };
}

interface Store extends Persisted {
  crew: CrewMember[];
  selected: CrewMember;
  dispatch: (a: Action) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState() ?? initial());

  // Several windows can be open at once (crew tablet and the ?view=ground console), and every change saves the
  // whole blob, so without syncing each window would overwrite the other's edits. Another window's write arrives
  // as a 'storage' event; we adopt it. `lastSerialized` is the last value we saved or adopted: a state that
  // serializes to it is not written again, which stops a hydrate from echoing back and ping-ponging between windows.
  const lastSerialized = useRef<string | null>(null);

  useEffect(() => {
    const json = serializeState(state);
    if (json === lastSerialized.current) return;
    lastSerialized.current = json;
    saveState(state);
  }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STATE_KEY) return;
      const incoming = loadState();
      if (!incoming) return; // key removed (reset in the other window) or unreadable; that window re-saves its fresh state
      const json = serializeState(incoming);
      if (json === lastSerialized.current) return;
      lastSerialized.current = json;
      dispatch({ type: 'hydrate', state: incoming });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const crew = useMemo(() => {
    const sim = simulateCrew(state.settings);
    // Manual entries replace the simulated record for that day.
    return sim.map((m) => {
      const covered = new Set(m.records.map((r) => r.day));
      const extra = Object.entries(state.manual)
        .filter(([k, r]) => k.startsWith(`${m.id}:`) && !covered.has(r.day))
        .map(([, r]) => r);
      const records = [...m.records.map((r) => state.manual[`${m.id}:${r.day}`] ?? r), ...extra].sort((a, b) => a.day - b.day);
      return { ...m, records };
    });
  }, [state.settings, state.manual]);

  const selected = crew.find((c) => c.id === state.selectedCrewId) ?? crew[0];

  const value: Store = useMemo(
    () => ({
      ...state,
      crew,
      selected,
      dispatch: (a) => {
        if (a.type === 'reset') {
          clearState();
          lastSerialized.current = null; // force the fresh state to be written so other windows pick it up
        }
        dispatch(a);
      },
    }),
    [state, crew, selected],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// The hook lives beside its provider on purpose; splitting them would only move the context to a third file.
// oxlint-disable-next-line react/only-export-components
export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
