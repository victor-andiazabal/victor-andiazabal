import { useMemo, useState, type ReactNode } from 'react';
import { LINK_PRESET_IDS, LINK_PRESETS, isLinkPresetId } from '../data/comm';
import { effectiveDelayMs, inboxFor, messageState, outboxFor, progress, type CommMessage, type Side, type UseComm } from '../lib/comm';
import { evaluate } from '../lib/rules';
import type { CrewMember } from '../lib/types';
import { useStore } from '../state/store';
import type { CommDraft } from './commSender';
import { Segmented } from './controls/Segmented';
import { IconCheckCircle, IconGround, IconInbox } from './icons';
import { Check, Pill, Select, SourceLinks } from './ui';
import './screens.css';
import './comm.css';

type Tab = 'transit' | 'inbox' | 'delivered';
type Send = (draft: CommDraft) => void;

const TAB_NAME: Record<Tab, string> = { transit: 'In transit', inbox: 'Inbox', delivered: 'Delivered' };

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

/** One 48px row: a 20px line icon and a single sentence. */
function EmptyRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="comm-empty">
      <span className="comm-empty-icon" aria-hidden="true">{icon}</span>
      {children}
    </p>
  );
}

function TransitList({ messages, now, crew }: { messages: CommMessage[]; now: number; crew: CrewMember[] }) {
  const flying = messages.filter((m) => messageState(m, now) === 'in-transit');
  if (flying.length === 0) return <EmptyRow icon={<IconGround />}>No messages in flight. A sent report shows here until it arrives.</EmptyRow>;
  return (
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
  );
}

function Stamp({ m }: { m: CommMessage }) {
  return <span className="comm-stamp mono">MD {m.missionDay} · sent {time(m.sentAt)} · received {time(m.arrivesAt)}</span>;
}

function FullReport({ m }: { m: CommMessage }) {
  return (
    <details className="disclosure">
      <summary>Full report ({m.findingIds?.length ?? 0} flags)</summary>
      <div className="disclosure-body"><pre className="comm-pre">{m.body}</pre></div>
    </details>
  );
}

function DeliveredList({ side, messages, now, crew }: { side: Side; messages: CommMessage[]; now: number; crew: CrewMember[] }) {
  const done = messages.filter((m) => messageState(m, now) === 'delivered').slice().reverse();
  if (done.length === 0) return <EmptyRow icon={<IconCheckCircle />}>Nothing delivered yet.</EmptyRow>;
  return (
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
            {short ? <p className="comm-body">{m.body}</p> : <FullReport m={m} />}
          </li>
        );
      })}
    </ul>
  );
}

/** Crew side inbox: what the flight surgeon has answered. */
function CrewInbox({ comm, crew }: { comm: UseComm; crew: CrewMember[] }) {
  const replies = inboxFor('crew', comm.messages, comm.now).filter((m) => m.kind === 'reply');
  if (replies.length === 0) return <EmptyRow icon={<IconInbox />}>No replies yet. Assess and act now; the ground confirms later.</EmptyRow>;
  return (
    <ul className="comm-log">
      {replies.slice().reverse().map((m) => (
        <li key={m.id}>
          <div className="comm-log-head"><b>{crew.find((c) => c.id === m.crewId)?.callsign}</b><span>{m.subject}</span></div>
          <Stamp m={m} />
          <p className="comm-body">{m.body}</p>
        </li>
      ))}
    </ul>
  );
}

/** Ground side inbox: reports that have arrived, with a reply box under each. */
function GroundInbox({ comm, sendDraft, crew }: { comm: UseComm; sendDraft: Send; crew: CrewMember[] }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const inbox = inboxFor('ground', comm.messages, comm.now);
  const sent = outboxFor('ground', comm.messages);

  const reply = (m: CommMessage) => {
    const text = (drafts[m.id] ?? '').trim();
    if (!text) return;
    sendDraft({ from: 'ground', crewId: m.crewId, kind: 'reply', subject: `Re: ${m.subject}`, body: text, replyTo: m.id });
    setDrafts((d) => ({ ...d, [m.id]: '' }));
  };

  if (inbox.length === 0) return <EmptyRow icon={<IconInbox />}>No reports yet. A report is readable here once its light time has elapsed.</EmptyRow>;
  return (
    <ul className="comm-log">
      {inbox.slice().reverse().map((m) => {
        const answers = sent.filter((r) => r.replyTo === m.id);
        const who = crew.find((c) => c.id === m.crewId)?.callsign ?? m.crewId;
        return (
          <li key={m.id}>
            <div className="comm-log-head"><b>{who}</b><span>{m.subject}</span></div>
            <Stamp m={m} />
            {m.findingIds ? <FullReport m={m} /> : <p className="comm-body">{m.body}</p>}
            {answers.map((r) => (
              <p key={r.id} className="comm-reply">
                <span className="pill neutral">{messageState(r, comm.now) === 'delivered' ? 'Delivered' : `In transit ${clock(r.arrivesAt - comm.now)}`}</span> {r.body}
              </p>
            ))}
            <textarea className="input" rows={2} aria-label={`Reply to ${m.subject}`} value={drafts[m.id] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))} placeholder="Reply to the crew" />
            <button type="button" className="btn" disabled={!(drafts[m.id] ?? '').trim()} onClick={() => reply(m)}>Send reply</button>
          </li>
        );
      })}
    </ul>
  );
}

/** Crew side: a free-text note to the flight surgeon, kept closed until needed. */
function NoteComposer({ sendDraft }: { sendDraft: Send }) {
  const { crew, settings, selectedCrewId } = useStore();
  const [crewId, setCrewId] = useState(selectedCrewId);
  const [note, setNote] = useState('');
  const member = crew.find((c) => c.id === crewId) ?? crew[0];
  const ev = useMemo(() => evaluate(member, settings), [member, settings]);
  const send = () => {
    const text = note.trim();
    if (!text) return;
    sendDraft({ from: 'crew', crewId: member.id, kind: 'report', subject: `Note from ${member.callsign}`, body: text });
    setNote('');
  };
  return (
    <details className="disclosure comm-compose">
      <summary>Write a note to the flight surgeon</summary>
      <div className="disclosure-body comm-compose-body">
        <label className="comm-field">
          <span className="field-label">Crew member</span>
          <Select className="input" value={member.id} onChange={(e) => setCrewId(e.target.value)}>
            {crew.map((c) => <option key={c.id} value={c.id}>{c.callsign} ({c.role})</option>)}
          </Select>
        </label>
        <p className="comm-row"><Pill level={ev.overall} /><span className="comm-small">Day {settings.currentDay} · {ev.findings.length} flags{ev.notifySurgeon ? ' · surgeon flagged' : ''}</span></p>
        <label className="comm-field">
          <span className="field-label">Free-text note</span>
          <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the numbers do not say." />
        </label>
        <button type="button" className="btn" disabled={!note.trim()} onClick={send}>Send note</button>
      </div>
    </details>
  );
}

interface CommLinkProps {
  side: Side;
  comm: UseComm;
  sendDraft: Send;
}

/** One panel for the whole link: delay and controls on top, three tabs (In transit, Inbox, Delivered) below. */
export function CommLink({ side, comm, sendDraft }: CommLinkProps) {
  const { crew } = useStore();
  const [tab, setTab] = useState<Tab>('transit');
  const preset = LINK_PRESETS[comm.preset];
  const delayMs = effectiveDelayMs(preset.oneWaySeconds, comm.compressed);

  // A message this side just sent shows in transit straight away, wherever the page's send button lives.
  const sentCount = comm.messages.filter((m) => m.from === side).length;
  const [seenSent, setSeenSent] = useState(sentCount);
  if (sentCount !== seenSent) {
    setSeenSent(sentCount);
    if (sentCount > seenSent) setTab('transit');
  }

  const counts = useMemo(() => {
    const inbox = side === 'crew' ? inboxFor('crew', comm.messages, comm.now).filter((m) => m.kind === 'reply') : inboxFor('ground', comm.messages, comm.now);
    return {
      transit: comm.messages.filter((m) => messageState(m, comm.now) === 'in-transit').length,
      inbox: inbox.length,
      delivered: comm.messages.filter((m) => messageState(m, comm.now) === 'delivered').length,
    };
  }, [comm.messages, comm.now, side]);

  const tabs = (Object.keys(TAB_NAME) as Tab[]).map((value) => ({
    value,
    label: <>{TAB_NAME[value]} <span className="mono comm-count">{counts[value]}</span></>,
  }));

  return (
    <section className="panel comm" aria-labelledby="comm-title">
      <div className="comm-head">
        <div>
          <h2 id="comm-title">Link and messages</h2>
          <p className="comm-lead">
            {side === 'crew' ? 'Crew tablet ⇄ Earth' : 'Ground console ⇄ spacecraft'}. One-way delay {lightTime(preset.oneWaySeconds)},{' '}
            {comm.compressed ? `demo time (plays in ${clock(delayMs)})` : 'real time'}. Assess first; the ground confirms later.
          </p>
          <SourceLinks ids={preset.sources} compact />
        </div>
        <div className="comm-controls">
          <label className="comm-field">
            <span className="field-label">Link</span>
            <Select className="input" value={comm.preset} onChange={(e) => isLinkPresetId(e.target.value) && comm.setPreset(e.target.value)} title={preset.note}>
              {LINK_PRESET_IDS.map((id) => <option key={id} value={id}>{LINK_PRESETS[id].label}</option>)}
            </Select>
          </label>
          <label className="comm-toggle check-row">
            <Check type="checkbox" checked={comm.compressed} onChange={(e) => comm.setCompressed(e.target.checked)} />
            Demo time: 1 s = 1 min
          </label>
          {side === 'crew' && <a className="btn" href="?view=ground" target="_blank" rel="noopener noreferrer">Open ground console in a new window</a>}
          {comm.messages.length > 0 && <button type="button" className="btn btn-destructive" onClick={comm.clear}>Clear link log</button>}
        </div>
      </div>

      <Segmented label="Messages" options={tabs} value={tab} onChange={(v) => setTab(v as Tab)} />

      <div className="comm-pane" role="group" aria-label={TAB_NAME[tab]}>
        {tab === 'transit' && <TransitList messages={comm.messages} now={comm.now} crew={crew} />}
        {tab === 'inbox' && (side === 'crew' ? <CrewInbox comm={comm} crew={crew} /> : <GroundInbox comm={comm} sendDraft={sendDraft} crew={crew} />)}
        {tab === 'delivered' && <DeliveredList side={side} messages={comm.messages} now={comm.now} crew={crew} />}
      </div>

      {side === 'crew' && <NoteComposer sendDraft={sendDraft} />}
    </section>
  );
}
