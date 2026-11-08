import { useMemo, useState } from 'react';
import { ENVIRONMENTS, INDICATORS, indicatorById, type IndicatorDef } from '../data/indicators';
import { seriesFor } from '../lib/analytics';
import { evaluate, trendOf } from '../lib/rules';
import { MAX_MISSION_DAY, scenarioById } from '../lib/simulate';
import type { IndicatorId, Level } from '../lib/types';
import { useStore } from '../state/store';
import { routineFor } from './Routine';
import { Avatar } from './Avatar';
import { Sparkline } from './Sparkline';
import { Disclaimer, fmt, LEVEL_LABEL, Pill } from './ui';
import type { View } from '../App';

function readTour(): boolean {
  try { return localStorage.getItem('vigil:tour') !== 'done'; } catch { return true; }
}

const GROUPS: { key: IndicatorDef['group']; title: string; blurb: string }[] = [
  { key: 'vitals', title: 'Your vitals', blurb: 'Heart, blood pressure, oxygen and temperature. These move first when something is brewing.' },
  { key: 'metabolic', title: 'Eating and weight', blurb: 'Morning glucose and body mass. Slow movers that tell you how well you are fuelling and recovering.' },
  { key: 'behavioral', title: 'Sleep, mood and sharpness', blurb: 'How much you slept, how much you moved, how you feel, and how fast you react. Months in a small cabin show up here before anywhere else.' },
  { key: 'environment', title: 'Radiation', blurb: 'What your dosimeter picked up, against what is normal for where you are and the limit for a whole career.' },
];

/** One plain sentence describing where today's value sits against the person's own history. */
function baselineWords(def: IndicatorDef, value: number | null, z: number | null, baseline: { median: number } | null): string {
  if (value === null || !baseline) return 'No baseline yet';
  if (z === null) return `You usually sit around ${fmt(def.id, baseline.median)} ${def.unit}`;
  const abs = Math.abs(z);
  const dir = z > 0 ? 'above' : 'below';
  const b = fmt(def.id, baseline.median);
  if (abs < 1) return `About where you usually are (${b})`;
  if (abs < 2) return `A bit ${dir} your usual ${b}`;
  if (abs < 3) return `Clearly ${dir} your usual ${b}`;
  return `Well ${dir} your usual ${b}`;
}

const TREND_WORDS = { up: 'creeping up this week', down: 'drifting down this week', flat: 'holding steady' } as const;

function summarySentence(name: string, overall: Level, reds: string[], ambers: string[], surgeon: boolean, delay: string): string {
  if (overall === 'green') return `Nothing stands out today, ${name}. Every number is where it normally is for you and inside the published ranges. Keep doing what you're doing.`;
  const parts: string[] = [];
  if (reds.length) parts.push(`${reds.length === 1 ? 'One thing needs you right now' : `${reds.length} things need you right now`}: ${reds.join(', ')}.`);
  if (ambers.length) parts.push(`${ambers.length === 1 ? 'Worth keeping an eye on' : `Also worth keeping an eye on`}: ${ambers.join(', ')}.`);
  parts.push(surgeon ? `Loop in the flight surgeon; a reply will take ${delay} each way, so send everything in one message.` : 'Nothing here needs the ground yet.');
  return parts.join(' ');
}

export function Dashboard({ go }: { go: (v: View, indicator?: IndicatorId) => void }) {
  const { crew, selected, settings, dispatch, acknowledged, routineDone } = useStore();
  const [tour, setTour] = useState(readTour);
  const [flipped, setFlipped] = useState<IndicatorId | null>(null);
  const closeTour = () => { try { localStorage.setItem('vigil:tour', 'done'); } catch { /* ignore */ } setTour(false); };
  const evals = useMemo(() => crew.map((c) => ({ crew: c, ev: evaluate(c, settings) })), [crew, settings]);
  const ev = evals.find((e) => e.crew.id === selected.id)!.ev;
  const env = ENVIRONMENTS[settings.environment];
  const scenario = scenarioById(settings.scenario);
  const top = ev.findings.filter((f) => !acknowledged[f.id]).slice(0, 3);
  const tasks = routineFor(settings.environment);
  const done = tasks.filter((t) => routineDone[`${selected.id}:${settings.currentDay}:${t.id}`]).length;
  const dosePct = Math.min(100, (ev.cumulativeDoseMsv / 600) * 100);
  const flight = selected.records.filter((r) => r.day >= 1 && r.day <= settings.currentDay);
  const reds = ev.findings.filter((f) => f.level === 'red').map((f) => f.title.toLowerCase());
  const ambers = ev.findings.filter((f) => f.level === 'amber').map((f) => f.title.toLowerCase());
  const counts = { green: 0, amber: 0, red: 0 } as Record<Level, number>;
  for (const def of INDICATORS) counts[ev.byIndicator[def.id].level]++;

  return (
    <>
      <div className="page-head">
        <div className="profile">
          <Avatar crew={selected} size={64} />
          <div>
            <h1>{selected.name}</h1>
            <p>
              {selected.role} · {selected.agency}
            </p>
            <p className="days">
              <b>{settings.currentDay}</b> day{settings.currentDay === 1 ? '' : 's'} in space · mission day {settings.currentDay} of {MAX_MISSION_DAY}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => go('checkin')}>Daily check-in</button>
          <button className="btn primary" onClick={() => go('pvt')}>Reaction test</button>
        </div>
      </div>

      <div className="mission-strip" aria-label="Mission context">
        <span className="chip"><span className="k">where</span>{env.label}</span>
        <span className="chip"><span className="k">gravity</span>{env.gravity}</span>
        <span className="chip"><span className="k">signal to Earth</span>{env.commDelay} one way</span>
        <span className="chip"><span className="k">mission</span>day {settings.currentDay} of {MAX_MISSION_DAY}</span>
        <span className="chip"><span className="k">scenario</span>{scenario.label}</span>
        <span className="chip muted-chip">simulated crew, not real people</span>
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
        <div className={`panel status-hero hero-${ev.overall}`} style={{ gridColumn: 'span 2' }}>
          <div className={`ring ${ev.overall}`}>
            <span className="ring-word">{ev.overall === 'green' ? 'OK' : ev.overall === 'amber' ? 'WATCH' : 'ACT NOW'}</span>
            <span className="ring-sub">{counts.red ? `${counts.red} red` : counts.amber ? `${counts.amber} amber` : 'all green'}</span>
          </div>
          <div className="meta">
            <span className="big">
              {ev.overall === 'green' && 'You look fine today'}
              {ev.overall === 'amber' && `A few things to keep an eye on, nothing urgent`}
              {ev.overall === 'red' && 'Something needs your attention now'}
            </span>
            <p className="summary">{summarySentence(selected.name.split(' ')[0], ev.overall, reds, ambers, ev.notifySurgeon, env.commDelay)}</p>
            <div className="count-row" aria-label="Indicator counts">
              <span><span className="dot green" />{counts.green} normal for you</span>
              <span><span className="dot amber" />{counts.amber} to watch</span>
              <span><span className="dot red" />{counts.red} need action</span>
            </div>
          </div>
          <div className="actions">
            {ev.notifySurgeon ? (
              <button className="btn danger" onClick={() => go('alerts')}>Write to the flight surgeon</button>
            ) : (
              <button className="btn" onClick={() => go('alerts')}>See the details</button>
            )}
            <button className="btn sm" onClick={() => go('trends')}>Trends</button>
          </div>
        </div>
        <div className="panel">
          <h3>The rest of the crew</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Tap a name to switch. Everyone is measured against their own normal, not each other's.</p>
          {evals.map(({ crew: c, ev: e }) => (
            <button
              key={c.id}
              className={`crew-row ${c.id === selected.id ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'select', crewId: c.id })}
            >
              <Avatar crew={c} size={32} />
              <span className={`dot ${e.overall}`} />
              <span className="name">{c.name}</span>
              <span className="muted sub">{c.callsign}</span>
              <span className={`pill ${e.overall}`} style={{ marginLeft: 'auto' }}>{e.findings.length ? `${e.findings.length} flag${e.findings.length > 1 ? 's' : ''}` : 'clear'}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="legend">
        <span><span className="dot green" /> green means normal for you</span>
        <span><span className="dot amber" /> amber means keep an eye on it</span>
        <span><span className="dot red" /> red means do something now</span>
        <span className="muted">The little chart is your last two weeks; the shaded band is where you sat before launch. Tap a tile for the full picture, or ⓘ to learn what it measures.</span>
      </p>

      {GROUPS.map((g) => (
        <section key={g.key} className="tile-group">
          <div className="group-head">
            <h2>{g.title}</h2>
            <p className="muted">{g.blurb}</p>
          </div>
          <div className="grid tiles">
            {INDICATORS.filter((d) => d.group === g.key).map((def) => {
              const s = ev.byIndicator[def.id];
              const t = trendOf(selected, def.id, settings.currentDay);
              const pts = seriesFor(flight, def.id).slice(-14).map((p) => p.value);
              const isFlipped = flipped === def.id;
              // Radiation has no meaningful pre-flight baseline: compare with the expected rate for this environment.
              const isDose = def.id === 'radDose';
              const doseRef = { median: env.dailyDoseMsv, mad: env.dailyDoseMsv * 0.15 };
              const doseWords = (() => {
                if (s.value === null) return 'No reading today';
                const r = s.value / env.dailyDoseMsv;
                if (r < 1.5) return `A normal day here (about ${env.dailyDoseMsv} mSv is typical)`;
                return `${r.toFixed(1)} times a normal day here (${env.dailyDoseMsv} mSv is typical)`;
              })();
              return (
                <div
                  key={def.id}
                  className={`panel tile ${s.level} ${isFlipped ? 'flipped' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${def.label}: ${fmt(def.id, s.value)} ${def.unit}, ${LEVEL_LABEL[s.level]}. Open trend.`}
                  onClick={() => go('trends', def.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('trends', def.id); } }}
                >
                  <button
                    className="info"
                    aria-label={`What is ${def.label}`}
                    aria-expanded={isFlipped}
                    onClick={(e) => { e.stopPropagation(); setFlipped(isFlipped ? null : def.id); }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    ⓘ
                  </button>
                  {isFlipped ? (
                    <div className="tile-back">
                      <div className="label">{def.label}</div>
                      <p>{def.what}</p>
                      <p className="muted"><b>Range:</b> {def.reference}</p>
                    </div>
                  ) : (
                    <>
                      <div className="label">{def.label}</div>
                      <div className="value-row">
                        <div className="value">
                          {fmt(def.id, s.value)}
                          <small>{def.unit}</small>
                        </div>
                        <Sparkline points={pts} baseline={isDose ? doseRef : s.baseline} level={s.level} />
                      </div>
                      <div className="status-line">
                        <span className={`pill ${s.level}`}>{LEVEL_LABEL[s.level]}</span>
                        {t && <span className="muted">{TREND_WORDS[t]} over 5 days</span>}
                      </div>
                      <div className="sub">{isDose ? doseWords : baselineWords(def, s.value, s.z, s.baseline)}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="grid cols-3" style={{ marginTop: 6 }}>
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <h3>
            What to do about it <Pill level={ev.overall}>{ev.findings.length}</Pill>
          </h3>
          <p className="muted" style={{ fontSize: 13 }}>Every flag explains itself: what tripped it, the actual numbers, and the next step. The sources are one tap away on the Alerts page.</p>
          {top.length === 0 && <p className="muted">Nothing to flag today.</p>}
          {top.map((f) => (
            <div key={f.id} className={`alert ${f.level}`}>
              <div className="head">
                <Pill level={f.level} />
                <h3>{f.title}</h3>
                <span className="pill neutral">{indicatorLabel(f.indicator)}</span>
                {f.notifySurgeon && <span className="pill red">tell the flight surgeon</span>}
              </div>
              <div className="why"><b>Why</b> {f.reason}</div>
              <div className="why"><b>Do</b> {f.action}</div>
            </div>
          ))}
          {ev.findings.length > top.length && (
            <button className="btn sm" onClick={() => go('alerts')}>See all {ev.findings.length}</button>
          )}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <div className="panel">
            <h3>Today's routine</h3>
            <div className="progress" style={{ marginBottom: 8 }}><span style={{ width: `${(done / tasks.length) * 100}%` }} /></div>
            <p className="muted" style={{ margin: 0 }}>
              {done === 0 ? `Nothing ticked off yet, ${tasks.length} things on the list.` : `${done} of ${tasks.length} done.`}{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); go('routine'); }}>Open the list</a>
            </p>
          </div>
          <div className="panel">
            <h3>Dose so far this mission</h3>
            <div className={`progress ${dosePct >= 80 ? 'red' : dosePct >= 50 ? 'amber' : ''}`} style={{ marginBottom: 8 }}>
              <span style={{ width: `${dosePct}%` }} />
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {ev.cumulativeDoseMsv.toFixed(1)} mSv, which is {dosePct.toFixed(1)}% of the 600 mSv NASA allows over a whole career. {env.doseNote}
            </p>
          </div>
        </div>
      </div>
      <Disclaimer />
    </>
  );
}

function indicatorLabel(id: IndicatorId | 'symptoms' | 'routine'): string {
  if (id === 'symptoms') return 'symptoms';
  if (id === 'routine') return 'routine';
  return indicatorById(id).label.toLowerCase();
}
