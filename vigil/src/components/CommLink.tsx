import { useMemo, useState } from 'react';
import { LINK_PRESET_IDS, LINK_PRESETS, isLinkPresetId } from '../data/comm';
import { buildReport, createMessage, effectiveDelayMs, inboxFor, messageState, outboxFor, progress, useComm, type CommMessage, type Side, type UseComm } from '../lib/comm';
import { evaluate } from '../lib/rules';
import type { CrewMember } from '../lib/types';
import { useStore } from '../state/store';
import { Pill, SourceLinks } from './ui';
import './screens.css';
import './comm.css';

const EMPTY_HINT = 'Open the ground console in a second window, then send a report.';

function lightTime(seconds: number): string {
  if (seconds < 1) return 'under 1 s';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  return `${Math.round(seconds / 60)} min`;
}

function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function Craft() {
  return (
    <svg className="comm-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="7" width="6" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M3 9h6M3 12h6M3 15h6M15 9h6M15 12h6M15 15h6" stroke="currentColor" strokeWidth="1" />
      <path d="M12 3v4" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function Earth() {
  return (
    <svg className="comm-icon earth" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M7 8c2 1 2 3 4 3s2 2 1 4M14 5c0 2 2 2 3 4M13 19c1-2 3-2 4-4" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function TransitLane({ messages, now, crew }: { messages: CommMessage[]; now: number; crew: CrewMember[] }) {
  const flying = messages.filter((m) => messageState(m, now) === 'in-transit');
  return (
    <div className="panel">
      <h2>In transit</h2>
      {flying.length === 0 && <p className="muted comm-small">No messages in flight.</p>}
      <ul className="comm-lanes">
        {flying.map((m) => {
          const p = progress(m, now);
          const pos = m.from === 'crew' ? p : 1 - p;
          const who = crew.find((c) => c.id === m.crewId)?.callsign ?? m.crewId;
          const left = m.oneWaySeconds !== undefined ? m.oneWaySeconds * (1 - p) : null;
          return (
            <li key={m.id}>
              <div className="comm-lane">
                <Craft />
                <div className="comm-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)} aria-label={`${m.subject}, ${Math.round(p * 100)}% of the way`}>
                  <span className={`comm-dot ${m.from}`} style={{ left: `${pos * 100}%` }} />
                </div>
                <Earth />
              </div>
              <div className="comm-meta">
                <span>{m.from === 'crew' ? `${who} → Earth` : `Earth → ${who}`}: {m.subject}</span>
                <span className="mono">arrives in {clock(m.arrivesAt - now)}{left !== null && left >= 60 ? ` · light time left ${clock(left * 1000)}` : ''}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stamp({ m }: { m: CommMessage }) {
  return <span className="muted comm-small mono">MD {m.missionDay} · sent {time(m.sentAt)} · received {time(m.arrivesAt)}</span>;
}

function DeliveredLog({ side, messages, now, crew }: { side: Side; messages: CommMessage[]; now: number; crew: CrewMember[] }) {
  const done = messages.filter((m) => messageState(m, now) === 'delivered').slice().reverse();
  return (
    <div className="panel">
      <h2>Delivered</h2>
      {done.length === 0 && <p className="muted comm-small">Nothing delivered yet.</p>}
      <ul className="comm-log">
        {done.map((m) => {
          const who = crew.find((c) => c.id === m.crewId)?.callsign ?? m.crewId;
          const incoming = m.from !== side;
          const short = m.kind === 'reply' || !m.findingIds;
          return (
            <li key={m.id}>
              <div className="comm-log-head">
                <span className="pill neutral">{incoming ? 'Received' : 'Sent'}</span>
                <b>{m.from === 'crew' ? `${who} → Earth` : `Earth → ${who}`}</b>
                <span>{m.subject}</span>
              </div>
              <Stamp m={m} />
              {short ? <p className="comm-body">{m.body}</p> : (
                <details className="disclosure"><summary>Full report ({m.findingIds?.length ?? 0} flags)</summary><div className="disclosure-body"><pre className="comm-pre">{m.body}</pre></div></details>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Stamps a draft with the wall clock at the moment the user hits send (called from event handlers only). */
const stampNow = (draft: Parameters<typeof createMessage>[0], delayMs: number) => createMessage(draft, delayMs, Date.now());

type Send = (draft: Omit<CommMessage, 'id' | 'sentAt' | 'arrivesAt' | 'oneWaySeconds' | 'missionDay'>) => void;

function CrewPanel({ comm, sendDraft }: { comm: UseComm; sendDraft: Send }) {
  const { crew, settings, selectedCrewId } = useStore();
  const [crewId, setCrewId] = useState(selectedCrewId);
  const [note, setNote] = useState('');
  const member = crew.find((c) => c.id === crewId) ?? crew[0];
  const ev = useMemo(() => evaluate(member, settings), [member, settings]);
  const report = useMemo(() => buildReport(member, ev, settings), [member, ev, settings]);
  const replies = inboxFor('crew', comm.messages, comm.now).filter((m) => m.kind === 'reply');

  const sendNote = () => {
    const text = note.trim();
    if (!text) return;
    sendDraft({ from: 'crew', crewId: member.id, kind: 'report', subject: `Note from ${member.callsign}`, body: text });
    setNote('');
  };

  return (
    <div className="split split-even">
      <div className="panel">
        <h2>Send to the flight surgeon</h2>
        <label className="comm-field">
          <span className="muted comm-small">Crew member</span>
          <select className="input" value={member.id} onChange={(e) => setCrewId(e.target.value)}>
            {crew.map((c) => <option key={c.id} value={c.id}>{c.callsign} ({c.role})</option>)}
          </select>
        </label>
        <p className="comm-row"><Pill level={ev.overall} /><span className="muted comm-small">Day {settings.currentDay} · {ev.findings.length} flags{ev.notifySurgeon ? ' · surgeon flagged' : ''}</span></p>
        <button type="button" className="btn-primary" onClick={() => sendDraft({ from: 'crew', crewId: member.id, kind: 'report', ...report })}>Send today's report</button>
        <label className="comm-field">
          <span className="muted comm-small">Free-text note</span>
          <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the numbers do not say." />
        </label>
        <button type="button" className="btn" disabled={!note.trim()} onClick={sendNote}>Send note</button>
      </div>
      <div className="panel">
        <h2>From the flight surgeon</h2>
        {replies.length === 0 && <p className="muted comm-small">No replies yet. Assess and act now; the ground confirms later.</p>}
        <ul className="comm-log">
          {replies.slice().reverse().map((m) => (
            <li key={m.id}><b>{crew.find((c) => c.id === m.crewId)?.callsign}</b> · {m.subject}<br /><Stamp m={m} /><p className="comm-body">{m.body}</p></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GroundPanel({ comm, sendDraft }: { comm: UseComm; sendDraft: Send }) {
  const { crew } = useStore();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const inbox = inboxFor('ground', comm.messages, comm.now);
  const sent = outboxFor('ground', comm.messages);

  const reply = (m: CommMessage) => {
    const text = (drafts[m.id] ?? '').trim();
    if (!text) return;
    sendDraft({ from: 'ground', crewId: m.crewId, kind: 'reply', subject: `Re: ${m.subject}`, body: text, replyTo: m.id });
    setDrafts((d) => ({ ...d, [m.id]: '' }));
  };

  if (inbox.length === 0) {
    return <div className="panel"><h2>Ground inbox</h2><p className="muted comm-small">No reports have arrived yet. A report becomes readable here only once its light time has elapsed.</p></div>;
  }
  return (
    <div className="split split-even">
      {crew.filter((c) => inbox.some((m) => m.crewId === c.id)).map((c) => (
        <div key={c.id} className="panel">
          <h2>Inbox · {c.callsign}</h2>
          <ul className="comm-log">
            {inbox.filter((m) => m.crewId === c.id).reverse().map((m) => {
              const answers = sent.filter((r) => r.replyTo === m.id);
              return (
                <li key={m.id}>
                  <div className="comm-log-head"><b>{m.subject}</b></div>
                  <Stamp m={m} />
                  {m.findingIds ? <details className="disclosure"><summary>Full report ({m.findingIds.length} flags)</summary><div className="disclosure-body"><pre className="comm-pre">{m.body}</pre></div></details> : <p className="comm-body">{m.body}</p>}
                  {answers.map((r) => (
                    <p key={r.id} className="comm-small comm-reply">
                      <span className="pill neutral">{messageState(r, comm.now) === 'delivered' ? 'Delivered' : `In transit ${clock(r.arrivesAt - comm.now)}`}</span> {r.body}
                    </p>
                  ))}
                  <textarea className="input" rows={2} aria-label={`Reply to ${m.subject}`} value={drafts[m.id] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))} placeholder="Reply to the crew" />
                  <button type="button" className="btn" disabled={!(drafts[m.id] ?? '').trim()} onClick={() => reply(m)}>Send reply</button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function CommLink({ side }: { side: Side }) {
  const comm = useComm();
  const { crew, settings } = useStore();
  const preset = LINK_PRESETS[comm.preset];
  const delayMs = effectiveDelayMs(preset.oneWaySeconds, comm.compressed);

  const sendDraft: Send = (draft) => {
    comm.send(stampNow({ ...draft, missionDay: settings.currentDay, oneWaySeconds: preset.oneWaySeconds }, delayMs));
  };

  return (
    <div className="comm">
      <div className="panel comm-head">
        <div>
          <h2>{side === 'crew' ? 'Crew tablet ⇄ Earth' : 'Ground console ⇄ spacecraft'}</h2>
          <p className="muted comm-small">
            One-way delay {lightTime(preset.oneWaySeconds)}, {comm.compressed ? `demo time (plays in ${clock(delayMs)})` : 'real time'}. Assess first; the ground confirms later.
          </p>
          <SourceLinks ids={preset.sources} compact />
        </div>
        <div className="comm-controls">
          <label className="comm-field">
            <span className="muted comm-small">Link</span>
            <select className="input" value={comm.preset} onChange={(e) => isLinkPresetId(e.target.value) && comm.setPreset(e.target.value)} title={preset.note}>
              {LINK_PRESET_IDS.map((id) => <option key={id} value={id}>{LINK_PRESETS[id].label}</option>)}
            </select>
          </label>
          <label className="comm-toggle check-row">
            <input className="check" type="checkbox" checked={comm.compressed} onChange={(e) => comm.setCompressed(e.target.checked)} />
            Demo time: 1 s = 1 min
          </label>
          {side === 'crew' && <a className="btn" href="?view=ground" target="_blank" rel="noopener noreferrer">Open ground console in a new window</a>}
          {comm.messages.length > 0 && <button type="button" className="btn btn-destructive" onClick={comm.clear}>Clear link log</button>}
        </div>
      </div>
      {comm.messages.length === 0 && <p className="muted comm-empty">{EMPTY_HINT}</p>}
      <TransitLane messages={comm.messages} now={comm.now} crew={crew} />
      {side === 'crew' ? <CrewPanel comm={comm} sendDraft={sendDraft} /> : <GroundPanel comm={comm} sendDraft={sendDraft} />}
      <DeliveredLog side={side} messages={comm.messages} now={comm.now} crew={crew} />
    </div>
  );
}
