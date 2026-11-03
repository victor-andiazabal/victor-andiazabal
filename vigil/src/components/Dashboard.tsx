import { useMemo, useState } from 'react';
import { ENVIRONMENTS, INDICATORS } from '../data/indicators';
import { evaluate, trendOf } from '../lib/rules';
import { scenarioById } from '../lib/simulate';
import type { IndicatorId } from '../lib/types';
import { useStore } from '../state/store';
import { routineFor } from './Routine';
import { Disclaimer, fmt, LEVEL_LABEL, Pill, Trend } from './ui';
import type { View } from '../App';

function readTour(): boolean {
  try { return localStorage.getItem('vigil:tour') !== 'done'; } catch { return true; }
}

export function Dashboard({ go }: { go: (v: View, indicator?: IndicatorId) => void }) {
  const { crew, selected, settings, dispatch, acknowledged, routineDone } = useStore();
  const [tour, setTour] = useState(readTour);
  const closeTour = () => { try { localStorage.setItem('vigil:tour', 'done'); } catch { /* ignore */ } setTour(false); };
  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);
  const env = ENVIRONMENTS[settings.environment];
  const scenario = scenarioById(settings.scenario);
  const top = ev.findings.filter((f) => !acknowledged[f.id]).slice(0, 3);
  const tasks = routineFor(settings.environment);
  const done = tasks.filter((t) => routineDone[`${selected.id}:${settings.currentDay}:${t.id}`]).length;
  const dosePct = Math.min(100, (ev.cumulativeDoseMsv / 600) * 100);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mission day {settings.currentDay}</h1>
          <p>
            {env.label} · one-way comm delay {env.commDelay} · scenario: {scenario.label}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => go('checkin')}>
            Daily check-in
          </button>
          <button className="btn primary" onClick={() => go('pvt')}>
            Reaction test
          </button>
        </div>
      </div>

      {tour && (
        <div className="panel tour">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <b>Three things to try</b>
            <span className="muted">Simulated crew, mission day {settings.currentDay}, scenario "{scenario.label}".</span>
            <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={closeTour} aria-label="Dismiss tour">Dismiss</button>
          </div>
          <ol>
            <li><a href="#" onClick={(e) => { e.preventDefault(); go('alerts'); }}>Open the alerts</a> and read why each one fired and what to do.</li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); dispatch({ type: 'settings', patch: { scenario: 'spe', currentDay: 25 } }); }}>Replay the solar storm</a> on day 25, then drag the day slider in Settings.</li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); go('pvt'); }}>Run the 60-second reaction test</a> and save it into today's check-in.</li>
          </ol>
        </div>
      )}
      <div className="grid cols-3" style={{ marginBottom: 14 }}>
        <div className="panel status-hero" style={{ gridColumn: 'span 2' }}>
          <div className={`ring ${ev.overall}`}>{LEVEL_LABEL[ev.overall].toUpperCase()}</div>
          <div className="meta">
            <span className="muted">{selected.callsign} · {selected.role}</span>
            <span className="big">
              {ev.overall === 'green' && 'All indicators within your usual range'}
              {ev.overall === 'amber' && `${ev.findings.filter((f) => f.level === 'amber').length} item${ev.findings.filter((f) => f.level === 'amber').length === 1 ? '' : 's'} to watch`}
              {ev.overall === 'red' && 'Action needed now'}
            </span>
            <span className="muted">
              {ev.notifySurgeon
                ? `Flight surgeon should be notified. One-way delay to the ground: ${env.commDelay}.`
                : 'No ground notification needed. Next private medical conference as scheduled.'}
            </span>
          </div>
          <div className="actions">
            <Pill level={ev.overall} />
            {ev.notifySurgeon && (
              <button className="btn sm danger" onClick={() => go('alerts')}>
                Prepare surgeon message
              </button>
            )}
          </div>
        </div>
        <div className="panel">
          <h3>Crew status</h3>
          {crew.map((c) => {
            const e = evaluate(c, settings);
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <span className={`dot ${e.overall}`} />
                <button
                  className="btn sm"
                  style={{ border: 0, background: c.id === selected.id ? 'var(--panel-2)' : 'transparent', padding: '4px 8px' }}
                  onClick={() => dispatch({ type: 'select', crewId: c.id })}
                >
                  {c.callsign}
                </button>
                <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
                  {e.findings.length ? `${e.findings.length} flag${e.findings.length > 1 ? 's' : ''}` : 'clear'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <h2 style={{ marginTop: 6 }}>Today's indicators</h2>
      <div className="grid tiles" style={{ marginBottom: 14 }}>
        {INDICATORS.map((def) => {
          const s = ev.byIndicator[def.id];
          const t = trendOf(selected, def.id, settings.currentDay);
          return (
            <div key={def.id} className={`panel tile ${s.level}`} onClick={() => go('trends', def.id)} title={`Open ${def.label} trend`}>
              <div className="label">{def.short}</div>
              <div className="value">
                {fmt(def.id, s.value)}
                <small>{def.unit}</small>
              </div>
              <div className="sub">
                <Trend dir={t} />
                {s.baseline ? <span>baseline {fmt(def.id, s.baseline.median)}</span> : <span>no baseline</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid cols-3">
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <h3>
            Alerts <Pill level={ev.overall}>{ev.findings.length}</Pill>
          </h3>
          {top.length === 0 && <p className="muted">Nothing to flag. Keep the routine going.</p>}
          {top.map((f) => (
            <div key={f.id} className={`alert ${f.level}`}>
              <div className="head">
                <Pill level={f.level} />
                <h3>{f.title}</h3>
              </div>
              <div className="why">
                <b>Why</b> {f.reason}
              </div>
              <div className="why">
                <b>Do</b> {f.action}
              </div>
            </div>
          ))}
          {ev.findings.length > top.length && (
            <button className="btn sm" onClick={() => go('alerts')}>
              See all {ev.findings.length} alerts
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="panel">
            <h3>Today's routine</h3>
            <div className="progress" style={{ marginBottom: 8 }}>
              <span style={{ width: `${(done / tasks.length) * 100}%` }} />
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {done} of {tasks.length} tasks done.{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); go('routine'); }}>
                Open routine
              </a>
            </p>
          </div>
          <div className="panel">
            <h3>Radiation this mission</h3>
            <div className={`progress ${dosePct >= 80 ? 'red' : dosePct >= 50 ? 'amber' : ''}`} style={{ marginBottom: 8 }}>
              <span style={{ width: `${dosePct}%` }} />
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {ev.cumulativeDoseMsv.toFixed(1)} mSv of the 600 mSv career limit ({dosePct.toFixed(1)}%). {env.doseNote}
            </p>
          </div>
        </div>
      </div>
      <Disclaimer />
    </>
  );
}
