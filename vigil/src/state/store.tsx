import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { simulateCrew } from '../lib/simulate';
import { DEFAULT_SETTINGS, loadState, saveState, clearState, type Persisted } from '../lib/storage';
import type { CrewMember, DayRecord, MissionSettings } from '../lib/types';

type Action =
  | { type: 'settings'; patch: Partial<MissionSettings> }
  | { type: 'select'; crewId: string }
  | { type: 'manual'; crewId: string; record: DayRecord }
  | { type: 'ack'; id: string }
  | { type: 'routine'; key: string; done: boolean }
  | { type: 'manualMany'; records: { crewId: string; record: DayRecord }[] }
  | { type: 'surgeonNote'; crewId: string; text: string }
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

  useEffect(() => saveState(state), [state]);

  const crew = useMemo(() => {
    const sim = simulateCrew(state.settings);
    // Manual entries replace the simulated record for that day.
    return sim.map((m) => ({
      ...m,
      records: m.records.map((r) => state.manual[`${m.id}:${r.day}`] ?? r),
    }));
  }, [state.settings, state.manual]);

  const selected = crew.find((c) => c.id === state.selectedCrewId) ?? crew[0];

  const value: Store = useMemo(
    () => ({
      ...state,
      crew,
      selected,
      dispatch: (a) => {
        if (a.type === 'reset') clearState();
        dispatch(a);
      },
    }),
    [state, crew, selected],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
