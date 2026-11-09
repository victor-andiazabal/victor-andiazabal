/*
 * Vertical timeline mechanism ported from "Timeline" by kuratlielia (21st.dev id 35051): a marker per row on a
 * 1px rail, a connector that draws down between rows, rows that open on demand. Rebuilt in plain React + CSS;
 * the day grouping, avatars and expandable detail are dropped, a "now" marker from the local clock is added.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { evaluate } from '../lib/rules';
import { useStore } from '../state/store';
import { routineFor, type RoutineTask } from '../data/routine';
import type { View } from '../lib/views';
import { Badges } from './Badges';
import { Check, SourceLinks } from './ui';
import './screens.css';
import './routine.css';

const MINUTE_MS = 60_000;

const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const clockLabel = (ms: number): string => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

type TimelineRow = { kind: 'task'; task: RoutineTask } | { kind: 'now' };

/** Tasks in time order with the "now" marker slotted before the first task that is still ahead. */
function withNowMarker(tasks: RoutineTask[], nowMs: number): TimelineRow[] {
  const d = new Date(nowMs);
  const nowMin = d.getHours() * 60 + d.getMinutes();
  const sorted = [...tasks].sort((a, b) => minutesOf(a.time) - minutesOf(b.time));
  const ahead = sorted.findIndex((t) => minutesOf(t.time) > nowMin);
  const at = ahead === -1 ? sorted.length : ahead;
  const rows: TimelineRow[] = sorted.map((task) => ({ kind: 'task', task }));
  rows.splice(at, 0, { kind: 'now' });
  return rows;
}

export function Routine({ go }: { go: (v: View) => void }) {
  const { selected, settings, routineDone, dispatch, manual } = useStore();
  const tasks = routineFor(settings.environment);
  const key = (id: string) => `${selected.id}:${settings.currentDay}:${id}`;
  const done = tasks.filter((t) => routineDone[key(t.id)]).length;
  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), MINUTE_MS);
    return () => window.clearInterval(timer);
  }, []);
  const rows = useMemo(() => withNowMarker(tasks, nowMs), [tasks, nowMs]);

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
          <p>Prompts for the day. Tick them off; Space Vigil keeps the streak and nudges what is missing.</p>
        </div>
      </div>
      <div className="split routine-split">
        <div className="stack">
        <div className="panel">
          <div className="routine-head">
            <h2>Today</h2>
            <span className="mono routine-count">{done} of {tasks.length} done</span>
          </div>
          <div className="progress routine-progress" role="progressbar" aria-label="Routine tasks done" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={done}>
            <span style={{ width: `${(done / tasks.length) * 100}%` }} />
          </div>
          <ol className="tl" aria-label="Today's routine in time order">
            {rows.map((row, i) => {
              const style = { '--i': i } as CSSProperties;
              if (row.kind === 'now') {
                return (
                  <li key="now" className="tl-now" style={style} aria-label={`Now, ${clockLabel(nowMs)}`}>
                    <span className="tl-now-dot" aria-hidden="true" />
                    <span className="tl-now-label mono">Now {clockLabel(nowMs)}</span>
                    <span className="tl-now-rule" aria-hidden="true" />
                  </li>
                );
              }
              const t = row.task;
              const on = Boolean(routineDone[key(t.id)]);
              return (
                <li key={t.id} className={`tl-item${on ? ' done' : ''}`} style={style}>
                  <span className="tl-dot" aria-hidden="true" />
                  <div className="tl-row">
                    <label className="tl-check">
                      <Check type="checkbox" checked={on} onChange={(e) => dispatch({ type: 'routine', key: key(t.id), done: e.target.checked })} aria-label={t.label} />
                      <span className="tl-time mono">{t.time}</span>
                      <span className="tl-text">
                        <span className="tl-label">{t.label}</span>
                        <small className="tl-why">{t.why}</small>
                      </span>
                    </label>
                    {t.view && !on && <button type="button" className="btn tl-open" onClick={() => go(t.view!)}>Open</button>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        </div>
        <div className="stack">
          <div className="panel">
            <h2>Streak</h2>
            <p className="streak-count mono">
              <span className="num">{streak}</span>
              <span className="unit">day{streak === 1 ? '' : 's'}</span>
            </p>
            <p className="streak-text">In a row with your own entry.</p>
            <p className="small-note">{streak === 0 ? 'Save a check-in or tick a task to start the streak.' : ev.missedCheckins === 0 ? 'No missed days this mission.' : `${ev.missedCheckins} missed day${ev.missedCheckins > 1 ? 's' : ''} this mission.`} {totalDone} routine tasks completed in this session.</p>
          </div>
          <Badges />
          <div className="panel">
            <h2>Why a routine</h2>
            <p>
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
