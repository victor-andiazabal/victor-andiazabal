import { useMemo, useRef, useState } from 'react';
import { COUNTERMEASURES } from '../data/countermeasures';
import { ENVIRONMENTS } from '../data/indicators';
import { buildReport, useComm } from '../lib/comm';
import { evaluate } from '../lib/rules';
import type { Finding } from '../lib/types';
import { useStore } from '../state/store';
import { CommLink } from './CommLink';
import { useCommSender } from './commSender';
import { FoldButton } from './Fold';
import { BtnTrail, Check, Pill, SourceLinks } from './ui';
import './screens.css';
import './alerts.css';

const checklistFor = (f: Finding) => (f.checklist ? COUNTERMEASURES[f.checklist] ?? null : null);

const BASIS_LABEL: Record<string, string> = { baseline: 'vs your baseline', reference: 'published range' };

export function Alerts() {
  const { selected, settings, crew, dispatch, acknowledged } = useStore();
  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);
  // The comm clock re-renders this screen every second; the crew table must not re-run the rules each time.
  const crewEvals = useMemo(() => crew.map((c) => ({ crew: c, ev: evaluate(c, settings) })), [crew, settings]);
  const env = ENVIRONMENTS[settings.environment];
  const [open, setOpen] = useState<string | null>(null);
  const [watchOpen, setWatchOpen] = useState<Record<string, boolean>>({});
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const comm = useComm();
  const sendDraft = useCommSender(comm);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  const jumpToLink = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    linkRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    linkRef.current?.focus({ preventScroll: true });
  };

  const report = useMemo(() => buildReport(selected, ev, settings), [ev, selected, settings]);
  const message = report.body;

  const sendReport = () => {
    const sent = sendDraft({ from: 'crew', crewId: selected.id, kind: 'report', ...report });
    setSentAt(sent.arrivesAt);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const toggleWatch = (id: string) => setWatchOpen((w) => ({ ...w, [id]: !w[id] }));
  const toggleStep = (key: string) => setTicked((t) => ({ ...t, [key]: !t[key] }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Alerts · {selected.name}</h1>
          <p>Every alert says which rule fired, with the numbers, and what to do. Acknowledge the ones you have handled.</p>
        </div>
        <div className="alerts-actions">
          <Pill level={ev.overall} />
          <button type="button" className="link-btn" onClick={jumpToLink}>Link and messages</button>
          <button type="button" className="btn-primary" onClick={sendReport}>Send today's report<BtnTrail /></button>
        </div>
      </div>
      {sentAt !== null && (
        <p className="alerts-sent">
          {/* Only the fixed sentence is announced; the countdown ticks every second and would be read out each time. */}
          <span role="status">Report sent to the flight surgeon.</span>{' '}
          <span role="timer">It arrives {comm.now >= sentAt ? 'now' : `in ${Math.max(0, Math.ceil((sentAt - comm.now) / 1000))} s`}</span>; follow it under In transit below.
        </p>
      )}
      <div className="split alerts-split">
        <div className="stack-sm">
          <h2 className="sr-only">Today's alerts</h2>
          {ev.findings.length === 0 && (
            <article className="alert green finding">
              <header className="finding-head"><Pill level="green" /><h3>Nothing to flag today</h3></header>
              <p className="finding-text">All indicators are within published ranges and within your own usual spread.</p>
            </article>
          )}
          {ev.findings.map((f) => {
            const acked = Boolean(acknowledged[f.id]);
            const cl = checklistFor(f);
            const isOpen = open === f.id && cl;
            const isWatch = f.level !== 'red';
            const expanded = !isWatch || Boolean(watchOpen[f.id]);
            const bodyId = `finding-body-${f.id}`;
            const title = (
              <>
                <Pill level={f.level} />
                <span className="fold-main finding-title">{f.title}</span>
              </>
            );
            return (
              <article key={f.id} className={`alert ${f.level} finding${acked ? ' acked' : ''}${isWatch ? ' is-watch' : ''}`}>
                {isWatch ? (
                  <FoldButton open={expanded} controls={bodyId} onToggle={() => toggleWatch(f.id)}>{title}</FoldButton>
                ) : (
                  <header className="finding-head">
                    <Pill level={f.level} />
                    <h3>{f.title}</h3>
                  </header>
                )}
                {expanded && (
                  <div className="finding-body" id={bodyId}>
                    <div className="finding-tags">
                      <span className="pill neutral">{BASIS_LABEL[f.basis] ?? f.basis}</span>
                      {f.notifySurgeon && <span className="pill red"><span className="dot red" />Notify flight surgeon</span>}
                      {acked && <span className="pill neutral">Acknowledged</span>}
                    </div>
                    <div className="finding-block">
                      <h4 className="finding-label">Why</h4>
                      <p className="finding-text">{f.reason}</p>
                    </div>
                    <div className="finding-block">
                      <h4 className="finding-label">Do now</h4>
                      <p className="finding-text">{f.action}</p>
                    </div>
                    {isOpen && cl && (
                      <div className="finding-checklist">
                        <h4 className="finding-label">{cl.title}</h4>
                        <ol className="checklist">
                          {cl.steps.map((st, i) => {
                            const key = `${f.id}:${i}`;
                            return (
                              <li key={key}>
                                <label className={`check-row${ticked[key] ? ' done' : ''}`}>
                                  <Check type="checkbox" checked={Boolean(ticked[key])} onChange={() => toggleStep(key)} />
                                  <span><span className="step-no mono">{i + 1}</span>{st}</span>
                                </label>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                    <footer className="finding-foot">
                      {cl && <button type="button" className="btn" aria-expanded={Boolean(isOpen)} onClick={() => setOpen(open === f.id ? null : f.id)}>{isOpen ? 'Hide checklist' : 'Open checklist'}</button>}
                      {!acked && <button type="button" className="btn" onClick={() => dispatch({ type: 'ack', id: f.id })}>Acknowledge</button>}
                      <div className="finding-src"><SourceLinks ids={f.sources} compact /></div>
                    </footer>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <div className="stack">
          <div className="panel">
            <h2>Crew overview</h2>
            <div className="table-wrap">
              <table className="table alerts-crew">
                <thead><tr><th>Crew</th><th>Status</th><th className="num">Flags</th></tr></thead>
                <tbody>
                  {crewEvals.map(({ crew: c, ev: e }) => {
                    return (
                      <tr key={c.id}>
                        <td>
                          <button type="button" className="link-btn" aria-label={`Show ${c.name}, ${c.callsign}`} aria-current={c.id === selected.id ? 'true' : undefined} onClick={() => dispatch({ type: 'select', crewId: c.id })}>{c.name}</button>
                        </td>
                        <td><Pill level={e.overall} /></td>
                        <td className="num"><span className="flag-cell"><span className="flag-count">{e.findings.length}</span>{e.notifySurgeon && <span className="pill neutral">Surgeon</span>}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel">
            <h2>Message to the flight surgeon</h2>
            <p className="small-note" style={{ marginTop: 0 }}>
              Ground reply will take at least {env.commDelay} each way. The message bundles today's values and every flag so one exchange is enough.
              If the link is down, copy it and relay it by any other channel.
            </p>
            <label className="sr-only" htmlFor="surgeon-message">Message to the flight surgeon</label>
            <textarea id="surgeon-message" className="input mono" readOnly rows={12} value={message} />
            <button type="button" className="btn alert-copy" onClick={copy}>{copied ? 'Copied' : 'Copy message'}</button>
          </div>
        </div>
      </div>
      <div className="alerts-link" id="alerts-link" ref={linkRef} tabIndex={-1}>
        <CommLink side="crew" comm={comm} sendDraft={sendDraft} />
      </div>
    </>
  );
}
