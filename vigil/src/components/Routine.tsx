import { useMemo } from 'react';
import { evaluate } from '../lib/rules';
import { useStore } from '../state/store';
import { routineFor } from '../data/routine';
import { Badges } from './Badges';
import { SourceLinks } from './ui';
import type { View } from '../App';

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
          <Badges />
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
