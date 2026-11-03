import { useMemo } from 'react';
import { evaluate } from '../lib/rules';
import type { Environment } from '../lib/types';
import { useStore } from '../state/store';
import { SourceLinks } from './ui';
import type { View } from '../App';

export interface RoutineTask {
  id: string;
  time: string;
  label: string;
  why: string;
  view?: View;
}

/** Daily prompts. Times follow a typical crew day; the flight surgeon adjusts them per mission. */
export function routineFor(env: Environment): RoutineTask[] {
  const base: RoutineTask[] = [
    { id: 'wake-pvt', time: '06:15', label: 'Reaction self-test after waking', why: 'Catches sleep loss before it shows in how you feel.', view: 'pvt' },
    { id: 'vitals', time: '06:30', label: 'Vitals: blood pressure, SpO2, temperature, fasting glucose', why: 'Same time each day keeps readings comparable.', view: 'checkin' },
    { id: 'checkin', time: '06:40', label: 'Daily check-in: sleep, mood, stress, symptoms', why: 'Builds the baseline the alerts depend on.', view: 'checkin' },
    { id: 'water', time: '09:00', label: 'Hydration check: 2 L target by end of day', why: 'Fluid shifts and dry cabin air both push toward dehydration.' },
    { id: 'exercise', time: '13:00', label: 'Exercise block: resistive first, then aerobic', why: 'The main countermeasure for bone and muscle loss.', view: 'checkin' },
    { id: 'connect', time: '18:30', label: 'Family or crew social time, 20 minutes', why: 'Isolation and confinement are one of the five hazards.' },
    { id: 'winddown', time: '21:00', label: 'Lights dimmed, screens off, sleep period protected', why: 'ISS crews average only about 6 h; protect the 8.5 h slot.' },
  ];
  if (env === 'transit' || env === 'rover') {
    base.splice(3, 0, { id: 'dose', time: '08:00', label: 'Read the dosimeter and check the space-weather notice', why: 'Deep space has no magnetic shielding; a solar event needs a fast move to shelter.', view: 'checkin' });
  }
  if (env === 'base') {
    base.splice(5, 0, { id: 'mass', time: '12:30', label: 'Weekly body mass (surface scale)', why: 'Tracks nutrition over the long stay.', view: 'checkin' });
  }
  return base;
}

export function Routine({ go }: { go: (v: View) => void }) {
  const { selected, settings, routineDone, dispatch, manual } = useStore();
  const tasks = routineFor(settings.environment);
  const key = (id: string) => `${selected.id}:${settings.currentDay}:${id}`;
  const done = tasks.filter((t) => routineDone[key(t.id)]).length;
  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);

  // Streak: consecutive mission days, counting back from today, on which this person saved a check-in
  // or ticked a routine task. Simulated history does not count.
  const streak = useMemo(() => {
    let n = 0;
    for (let d = settings.currentDay; d >= 1; d--) {
      const entered = Boolean(manual[`${selected.id}:${d}`]) || tasks.some((t) => routineDone[`${selected.id}:${d}:${t.id}`]);
      if (entered) n++;
      else break;
    }
    return n;
  }, [manual, routineDone, selected.id, settings.currentDay, tasks]);

  const totalDone = Object.entries(routineDone).filter(([k, v]) => v && k.startsWith(`${selected.id}:`)).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Routine · day {settings.currentDay}</h1>
          <p>Prompts for the day. Tick them off; VIGIL keeps the streak and nudges what is missing.</p>
        </div>
      </div>
      <div className="grid cols-3">
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <h3>Today</h3>
          <div className="progress" style={{ marginBottom: 10 }}><span style={{ width: `${(done / tasks.length) * 100}%` }} /></div>
          <ul className="routine-list">
            {tasks.map((t) => {
              const on = Boolean(routineDone[key(t.id)]);
              return (
                <li key={t.id} className={on ? 'done' : ''}>
                  <input type="checkbox" checked={on} onChange={(e) => dispatch({ type: 'routine', key: key(t.id), done: e.target.checked })} aria-label={t.label} />
                  <span className="time">{t.time}</span>
                  <div style={{ flex: 1 }}>
                    <div>{t.label}</div>
                    <small className="muted">{t.why}</small>
                  </div>
                  {t.view && !on && <button className="btn sm" onClick={() => go(t.view!)}>Open</button>}
                </li>
              );
            })}
          </ul>
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <div className="panel">
            <h3>Streak</h3>
            <div className="streak">
              <div className="num">{streak}</div>
              <div>
                <div>day{streak === 1 ? '' : 's'} in a row with your own entry</div>
                <small className="muted">{streak === 0 ? 'Save a check-in or tick a task to start the streak.' : ev.missedCheckins === 0 ? 'No missed days this mission.' : `${ev.missedCheckins} missed day${ev.missedCheckins > 1 ? 's' : ''} this mission.`}</small>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{totalDone} routine tasks completed in this session.</p>
          </div>
          <div className="panel">
            <h3>Why a routine</h3>
            <p style={{ fontSize: 14 }}>
              Self-monitoring only works if readings are taken the same way at the same time every day. The prompts mirror what crews already
              do on the ISS: a reaction test around sleep shifts, daily exercise, and scheduled private conferences with the ground.
            </p>
            <SourceLinks ids={['reaction-self-test', 'iss-exercise', 'hfbp']} />
          </div>
        </div>
      </div>
    </>
  );
}
