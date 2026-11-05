import { useMemo } from 'react';
import { ENVIRONMENTS, INDICATORS } from '../data/indicators';
import { fmt } from '../lib/format';
import { evaluate } from '../lib/rules';
import { useStore } from '../state/store';
import { CommLink } from './CommLink';
import { Pill } from './ui';
import type { View } from '../App';

/**
 * The ground-side view: what the flight surgeon sees at the next downlink.
 * Same rules, same data; the difference is the whole crew at once and a place for notes.
 */
export function Ground({ go }: { go: (v: View) => void }) {
  const { crew, settings, dispatch, surgeonNotes, acknowledged } = useStore();
  const env = ENVIRONMENTS[settings.environment];
  const evals = useMemo(() => crew.map((c) => ({ crew: c, ev: evaluate(c, settings) })), [crew, settings]);
  const queue = evals.flatMap(({ crew: c, ev }) => ev.findings.filter((f) => f.notifySurgeon).map((f) => ({ crew: c, f })));
  const watch = evals.flatMap(({ crew: c, ev }) => ev.findings.filter((f) => !f.notifySurgeon).map((f) => ({ crew: c, f })));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ground view · day {settings.currentDay}</h1>
          <p>What the flight surgeon receives at the downlink. One-way delay {env.commDelay}; every item here was raised by the crew's own device.</p>
        </div>
        <Pill level={queue.length ? 'red' : watch.length ? 'amber' : 'green'}>{queue.length ? `${queue.length} for the surgeon` : watch.length ? `${watch.length} to watch` : 'crew nominal'}</Pill>
      </div>

      <div style={{ marginBottom: 14 }}>
        <CommLink side="ground" />
      </div>

      <div className="panel" style={{ marginBottom: 14, overflowX: 'auto' }}>
        <h3>Crew status grid</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Crew</th>
              <th>Status</th>
              {INDICATORS.map((i) => <th key={i.id} title={i.label}>{i.short}</th>)}
              <th>Dose (mission)</th>
            </tr>
          </thead>
          <tbody>
            {evals.map(({ crew: c, ev }) => (
              <tr key={c.id}>
                <td>
                  <button className="btn sm" style={{ border: 0, background: 'transparent', padding: '2px 4px' }} onClick={() => { dispatch({ type: 'select', crewId: c.id }); go('today'); }}>
                    {c.callsign}
                  </button>
                </td>
                <td><Pill level={ev.overall} /></td>
                {INDICATORS.map((i) => {
                  const st = ev.byIndicator[i.id];
                  return (
                    <td key={i.id} className="mono" title={`${i.label}: ${fmt(i.id, st.value)} ${i.unit}${st.baseline ? ` (baseline ${fmt(i.id, st.baseline.median)})` : ''}`}>
                      <span className={`dot ${st.level}`} style={{ marginRight: 5 }} />
                      {fmt(i.id, st.value)}
                    </td>
                  );
                })}
                <td className="mono">{ev.cumulativeDoseMsv.toFixed(0)} mSv</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>Dot colour is the rule result for that indicator today; hover a cell for the value and baseline.</p>
      </div>

      <div className="grid cols-2">
        <div>
          <h3>Flagged for the surgeon</h3>
          {queue.length === 0 && <p className="muted">Nothing needs the ground today.</p>}
          {queue.map(({ crew: c, f }) => (
            <div key={f.id} className={`alert ${f.level} ${acknowledged[f.id] ? 'acked' : ''}`}>
              <div className="head">
                <Pill level={f.level} />
                <h3>{c.callsign}: {f.title}</h3>
                {acknowledged[f.id] && <span className="pill neutral">acknowledged by crew</span>}
              </div>
              <div className="why"><b>Why</b> {f.reason}</div>
              <div className="why"><b>Crew action</b> {f.action}</div>
            </div>
          ))}
          {watch.length > 0 && (
            <>
              <h3 style={{ marginTop: 14 }}>Watch items (crew handles these)</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {watch.map(({ crew: c, f }) => (
                  <li key={f.id} style={{ marginBottom: 4 }}><span className={`dot ${f.level}`} style={{ marginRight: 6 }} />{c.callsign}: {f.title}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          {crew.map((c) => (
            <div key={c.id} className="panel">
              <h3>Surgeon notes · {c.callsign}</h3>
              <textarea
                rows={3}
                value={surgeonNotes[c.id] ?? ''}
                onChange={(e) => dispatch({ type: 'surgeonNote', crewId: c.id, text: e.target.value })}
                placeholder="Per-crew limits, medication changes, schedule adjustments. Stored on this device."
                style={{ width: '100%', background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 10, padding: 8, font: 'inherit' }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
