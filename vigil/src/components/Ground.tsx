import { useMemo, useState } from 'react';
import type { CrewMember, Finding } from '../lib/types';
import { ENVIRONMENTS, INDICATORS } from '../data/indicators';
import { fmt, LEVEL_LABEL } from '../lib/format';
import { evaluate } from '../lib/rules';
import type { View } from '../lib/views';
import { useStore } from '../state/store';
import { useComm } from '../lib/comm';
import { CommLink } from './CommLink';
import { useCommSender } from './commSender';
import { FoldButton } from './Fold';
import { Pill, SourceLinks } from './ui';
import './screens.css';
import './alerts.css';
import './ground.css';

/** Why, the crew's action and the sources, the same three blocks on every card (sources always on their own line). */
function FindingText({ f, actionLabel }: { f: Finding; actionLabel: string }) {
  return (
    <>
      <div className="finding-block">
        <h4 className="finding-label">Why</h4>
        <p className="finding-text">{f.reason}</p>
      </div>
      <div className="finding-block">
        <h4 className="finding-label">{actionLabel}</h4>
        <p className="finding-text">{f.action}</p>
      </div>
      <div className="finding-src"><SourceLinks ids={f.sources} compact /></div>
    </>
  );
}

/**
 * The ground-side view: what the flight surgeon sees at the next downlink.
 * Same rules, same data; the difference is the whole crew at once and a place for notes.
 */
export function Ground({ go }: { go: (v: View) => void }) {
  const { crew, settings, dispatch, surgeonNotes, acknowledged } = useStore();
  const comm = useComm();
  const sendDraft = useCommSender(comm);
  const env = ENVIRONMENTS[settings.environment];
  const [watchOpen, setWatchOpen] = useState<Record<string, boolean>>({});
  const toggleWatch = (id: string) => setWatchOpen((w) => ({ ...w, [id]: !w[id] }));
  const evals = useMemo(() => crew.map((c) => ({ crew: c, ev: evaluate(c, settings) })), [crew, settings]);
  const queue = evals.flatMap(({ crew: c, ev }) => ev.findings.filter((f) => f.notifySurgeon).map((f) => ({ crew: c, f })));
  const watch = evals.flatMap(({ crew: c, ev }) => ev.findings.filter((f) => !f.notifySurgeon).map((f) => ({ crew: c, f })));

  /** Act now findings stay open; Watch findings are one 48px row that opens in place. */
  const renderFinding = (c: CrewMember, f: Finding) => {
    const isWatch = f.level !== 'red';
    const expanded = !isWatch || Boolean(watchOpen[f.id]);
    const bodyId = `finding-body-${f.id}`;
    const acked = Boolean(acknowledged[f.id]);
    return (
      <article key={f.id} className={`alert ${f.level} finding${acked ? ' acked' : ''}${isWatch ? ' is-watch' : ''}`}>
        {isWatch ? (
          <FoldButton open={expanded} controls={bodyId} onToggle={() => toggleWatch(f.id)}>
            <Pill level={f.level} />
            <span className="fold-main finding-title">{c.callsign}: {f.title}</span>
          </FoldButton>
        ) : (
          <header className="finding-head">
            <Pill level={f.level} />
            <h3>{c.callsign}: {f.title}</h3>
          </header>
        )}
        {expanded && (
          <div className="finding-body" id={bodyId}>
            {acked && <div className="finding-tags"><span className="pill neutral">Acknowledged by crew</span></div>}
            <FindingText f={f} actionLabel="Crew action" />
          </div>
        )}
      </article>
    );
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ground view · day {settings.currentDay}</h1>
          <p>What the flight surgeon receives at the downlink. One-way delay {env.commDelay}; every item here was raised by the crew's own device.</p>
        </div>
        <Pill level={queue.length ? 'red' : watch.length ? 'amber' : 'green'}>{queue.length ? `${queue.length} for the surgeon` : watch.length ? `${watch.length} to watch` : 'Crew nominal'}</Pill>
      </div>

      <div className="panel ground-section">
        <h2>Crew status grid</h2>
        <div className="table-wrap">
          <table className="table ground-table">
            <caption className="sr-only">Today's status and readings for every crew member</caption>
            <thead>
              <tr>
                <th scope="col">Crew</th>
                <th scope="col">Status</th>
                {INDICATORS.map((i) => <th key={i.id} scope="col" className="num" title={i.label}>{i.short}</th>)}
                <th scope="col" className="num">Dose (mission)</th>
              </tr>
            </thead>
            <tbody>
              {evals.map(({ crew: c, ev }) => (
                <tr key={c.id}>
                  <th scope="row">
                    <button type="button" className="link-btn" onClick={() => { dispatch({ type: 'select', crewId: c.id }); go('today'); }}>
                      {c.callsign}
                    </button>
                  </th>
                  <td><Pill level={ev.overall} /></td>
                  {INDICATORS.map((i) => {
                    const st = ev.byIndicator[i.id];
                    return (
                      <td key={i.id} className="num" title={`${i.label}: ${fmt(i.id, st.value)} ${i.unit}${st.baseline ? ` (baseline ${fmt(i.id, st.baseline.median)})` : ''}`}>
                        <span className="cell-val">
                          <span className={`dot ${st.level}`} aria-hidden="true" />
                          <span className="sr-only">{LEVEL_LABEL[st.level]}: </span>
                          {fmt(i.id, st.value)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="num">{ev.cumulativeDoseMsv.toFixed(0)} mSv</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-note">Each dot is the rule result for that indicator today (green Nominal, amber Watch, red Act now). Hover or focus a cell for the value and baseline.</p>
      </div>

      <div className="ground-section">
        <CommLink side="ground" comm={comm} sendDraft={sendDraft} />
      </div>

      <div className="split split-even">
        <div className="stack-sm">
          <h2>Flagged for the surgeon</h2>
          {queue.length === 0 && <p className="muted">Nothing needs the ground today.</p>}
          {queue.map(({ crew: c, f }) => renderFinding(c, f))}
          {watch.length > 0 && (
            <>
              <h3 className="ground-watch-title">Watch items (crew handles these)</h3>
              <div className="stack-sm">{watch.map(({ crew: c, f }) => renderFinding(c, f))}</div>
            </>
          )}
        </div>
        <div className="stack-sm">
          <h2>Surgeon notes</h2>
          {crew.map((c) => (
            <div key={c.id} className="panel">
              <label className="field-label" htmlFor={`note-${c.id}`}>Surgeon notes · {c.callsign}</label>
              <textarea
                id={`note-${c.id}`}
                className="input"
                rows={3}
                value={surgeonNotes[c.id] ?? ''}
                onChange={(e) => dispatch({ type: 'surgeonNote', crewId: c.id, text: e.target.value })}
                placeholder="Per-crew limits, medication changes, schedule adjustments. Stored on this device."
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
