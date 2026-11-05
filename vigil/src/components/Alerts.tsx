import { useMemo, useState } from 'react';
import { COUNTERMEASURES } from '../data/countermeasures';
import { ENVIRONMENTS } from '../data/indicators';
import { buildReport } from '../lib/comm';
import { evaluate } from '../lib/rules';
import type { Finding } from '../lib/types';
import { useStore } from '../state/store';
import { CommLink } from './CommLink';
import { Pill, SourceLinks } from './ui';

const checklistFor = (f: Finding) => (f.checklist ? COUNTERMEASURES[f.checklist] ?? null : null);

export function Alerts() {
  const { selected, settings, crew, dispatch, acknowledged } = useStore();
  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);
  const env = ENVIRONMENTS[settings.environment];
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const message = useMemo(() => buildReport(selected, ev, settings).body, [ev, selected, settings]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Alerts · {selected.callsign}</h1>
          <p>Every alert says which rule fired, with the numbers, and what to do. Acknowledge the ones you have handled.</p>
        </div>
        <Pill level={ev.overall} />
      </div>
      <div className="grid cols-3">
        <div style={{ gridColumn: 'span 2' }}>
          {ev.findings.length === 0 && (
            <div className="alert green">
              <div className="head"><Pill level="green" /><h3>Nothing to flag today</h3></div>
              <div className="why">All indicators are within published ranges and within your own usual spread.</div>
            </div>
          )}
          {ev.findings.map((f) => {
            const acked = Boolean(acknowledged[f.id]);
            const cl = checklistFor(f);
            return (
              <div key={f.id} className={`alert ${f.level} ${acked ? 'acked' : ''}`}>
                <div className="head">
                  <Pill level={f.level} />
                  <h3>{f.title}</h3>
                  <span className="pill neutral">{f.basis === 'baseline' ? 'vs your baseline' : f.basis === 'reference' ? 'published range' : f.basis}</span>
                  {f.notifySurgeon && <span className="pill red">notify flight surgeon</span>}
                </div>
                <div className="why"><b>Why</b> {f.reason}</div>
                <div className="why"><b>Do</b> {f.action}</div>
                {open === f.id && cl && (
                  <div className="panel" style={{ marginTop: 8, background: 'var(--bg-2)' }}>
                    <h3>{cl.title}</h3>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      {cl.steps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                    </ol>
                  </div>
                )}
                <div className="foot">
                  {cl && <button className="btn sm" onClick={() => setOpen(open === f.id ? null : f.id)}>{open === f.id ? 'Hide checklist' : 'Open checklist'}</button>}
                  {!acked && <button className="btn sm" onClick={() => dispatch({ type: 'ack', id: f.id })}>Acknowledge</button>}
                  <SourceLinks ids={f.sources} compact />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <div className="panel">
            <h3>Crew overview</h3>
            <table className="table">
              <thead><tr><th>Crew</th><th>Status</th><th>Flags</th></tr></thead>
              <tbody>
                {crew.map((c) => {
                  const e = evaluate(c, settings);
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => dispatch({ type: 'select', crewId: c.id })}>
                      <td>{c.callsign}</td>
                      <td><Pill level={e.overall} /></td>
                      <td>{e.findings.length}{e.notifySurgeon ? ' · surgeon' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <h3>Message to the flight surgeon</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              Ground reply will take at least {env.commDelay} each way. The message bundles today's values and every flag so one exchange is enough.
            </p>
            <textarea readOnly rows={12} value={message} style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 10, padding: 8 }} />
            <button className="btn primary sm" style={{ marginTop: 8 }} onClick={copy}>{copied ? 'Copied' : 'Copy message'}</button>
          </div>
        </div>
      </div>
      <h2 style={{ marginTop: 18 }}>Send to the ground</h2>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        Sends today's report over the delayed link. If the link is down, copy the message above and relay it by any other channel.
      </p>
      <CommLink side="crew" />
    </>
  );
}
