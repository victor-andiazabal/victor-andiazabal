import { useMemo, useState } from 'react';
import { ENVIRONMENTS, INDICATORS, indicatorById, type IndicatorDef } from '../data/indicators';
import { seriesFor } from '../lib/analytics';
import { evaluate, trendOf } from '../lib/rules';
import { MAX_MISSION_DAY, scenarioById } from '../lib/simulate';
import type { IndicatorId, Level } from '../lib/types';
import { useStore } from '../state/store';
import { routineFor } from './Routine';
import { Sparkline } from './Sparkline';
import { Disclaimer, fmt, LEVEL_LABEL, Pill } from './ui';
import type { View } from '../App';

function readTour(): boolean {
  try { return localStorage.getItem('vigil:tour') !== 'done'; } catch { return true; }
}

const GROUPS: { key: IndicatorDef['group']; title: string; blurb: string }[] = [
  { key: 'vitals', title: 'Vitals', blurb: 'Heart, blood pressure, oxygen and temperature. The fastest signals of infection, dehydration or stress.' },
  { key: 'metabolic', title: 'Nutrition', blurb: 'Fasting glucose and body mass. Slow signals of how well the crew member is eating and recovering.' },
  { key: 'behavioral', title: 'Sleep, mood and alertness', blurb: 'Hours slept, exercise, how the person feels, and how fast they react. Isolation and confinement show up here first.' },
  { key: 'environment', title: 'Radiation', blurb: 'Dose from the personal dosimeter, compared with the usual rate for this environment and the career limit.' },
];

/** One plain sentence describing where today's value sits against the person's own history. */
function baselineWords(def: IndicatorDef, value: number | null, z: number | null, baseline: { median: number } | null): string {
  if (value === null || !baseline) return 'No baseline yet';
  if (z === null) return `Baseline ${fmt(def.id, baseline.median)} ${def.unit}`;
  const abs = Math.abs(z);
  const dir = z > 0 ? 'above' : 'below';
  if (abs < 1) return `Within your usual range (baseline ${fmt(def.id, baseline.median)})`;
  if (abs < 2) return `Slightly ${dir} your usual ${fmt(def.id, baseline.median)}`;
  if (abs < 3) return `Noticeably ${dir} your usual ${fmt(def.id, baseline.median)}`;
  return `Far ${dir} your usual ${fmt(def.id, baseline.median)}`;
}

const TREND_WORDS = { up: 'rising', down: 'falling', flat: 'steady' } as const;

function summarySentence(name: string, overall: Level, reds: string[], ambers: string[], surgeon: boolean, delay: string): string {
  if (overall === 'green') return `${name}: everything is inside published ranges and inside your usual spread today. Keep the routine going.`;
  const parts: string[] = [];
  if (reds.length) parts.push(`${reds.length === 1 ? 'One item needs' : `${reds.length} items need`} action now: ${reds.join(', ')}.`);
  if (ambers.length) parts.push(`${ambers.length === 1 ? 'One item' : `${ambers.length} items`} to watch: ${ambers.join(', ')}.`);
  parts.push(surgeon ? `The flight surgeon should be told; a reply takes ${delay} each way.` : 'Nothing needs the ground today.');
  return `${name}: ${parts.join(' ')}`;
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
        <div>
          <h1>Mission day {settings.currentDay}</h1>
          <p>{selected.callsign} · {selected.role}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => go('checkin')}>Daily check-in</button>
          <button className="btn primary" onClick={() => go('pvt')}>Reaction test</button>
        </div>
      </div>

      <div className="mission-strip" aria-label="Mission context">
        <span className="chip"><span className="k">Where</span>{env.label}</span>
        <span className="chip"><span className="k">Gravity</span>{env.gravity}</span>
        <span className="chip"><span className="k">Signal to Earth</span>{env.commDelay} one way</span>
        <span className="chip"><span className="k">Mission</span>day {settings.currentDay} of {MAX_MISSION_DAY}</span>
        <span className="chip"><span className="k">Scenario</span>{scenario.label}</span>
        <span className="chip muted-chip"><span className="k">Data</span>simulated crew</span>
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
            <span className="ring-word">{LEVEL_LABEL[ev.overall].toUpperCase()}</span>
            <span className="ring-sub">{counts.red ? `${counts.red} red` : counts.amber ? `${counts.amber} amber` : 'all green'}</span>
          </div>
          <div className="meta">
            <span className="big">
              {ev.overall === 'green' && 'All indicators within your usual range'}
              {ev.overall === 'amber' && `${ambers.length} item${ambers.length === 1 ? '' : 's'} to watch, nothing urgent`}
              {ev.overall === 'red' && 'Action needed now'}
            </span>
            <p className="summary">{summarySentence(selected.callsign, ev.overall, reds, ambers, ev.notifySurgeon, env.commDelay)}</p>
            <div className="count-row" aria-label="Indicator counts">
              <span><span className="dot green" />{counts.green} nominal</span>
              <span><span className="dot amber" />{counts.amber} watch</span>
              <span><span className="dot red" />{counts.red} act now</span>
            </div>
          </div>
          <div className="actions">
            {ev.notifySurgeon ? (
              <button className="btn danger" onClick={() => go('alerts')}>Prepare surgeon message</button>
            ) : (
              <button className="btn" onClick={() => go('alerts')}>Open alerts</button>
            )}
            <button className="btn sm" onClick={() => go('trends')}>See trends</button>
          </div>
        </div>
        <div className="panel">
          <h3>Crew status</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Tap a name to switch. Each person is judged against their own baseline.</p>
          {evals.map(({ crew: c, ev: e }) => (
            <button
              key={c.id}
              className={`crew-row ${c.id === selected.id ? 'on' : ''}`}
              onClick={() => dispatch({ type: 'select', crewId: c.id })}
            >
              <span className={`dot ${e.overall}`} />
              <span className="name">{c.callsign}</span>
              <span className="muted sub">{c.role}</span>
              <span className={`pill ${e.overall}`} style={{ marginLeft: 'auto' }}>{e.findings.length ? `${e.findings.length} flag${e.findings.length > 1 ? 's' : ''}` : 'clear'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="legend">
        <b>How to read the tiles</b>
        <span><span className="dot green" /> Nominal: inside the published range and inside your usual spread</span>
        <span><span className="dot amber" /> Watch: unusual for you, or near a published limit</span>
        <span><span className="dot red" /> Act now: outside a published limit or far from your baseline</span>
        <span className="muted">Small chart = last 14 days; shaded band = your pre-flight baseline. Tap a tile for the full trend, or the ⓘ for what it measures.</span>
      </div>

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
                if (r < 1.5) return `Near the expected ${env.dailyDoseMsv} mSv/day for this environment`;
                return `${r.toFixed(1)} times the expected ${env.dailyDoseMsv} mSv/day here`;
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
            Alerts <Pill level={ev.overall}>{ev.findings.length}</Pill>
          </h3>
          <p className="muted" style={{ fontSize: 13 }}>Each alert says which rule fired, with the numbers, and what to do. Sources are linked on the Alerts page.</p>
          {top.length === 0 && <p className="muted">Nothing to flag. Keep the routine going.</p>}
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
            <button className="btn sm" onClick={() => go('alerts')}>See all {ev.findings.length} alerts</button>
          )}
        </div>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <div className="panel">
            <h3>Today's routine</h3>
            <div className="progress" style={{ marginBottom: 8 }}><span style={{ width: `${(done / tasks.length) * 100}%` }} /></div>
            <p className="muted" style={{ margin: 0 }}>
              {done} of {tasks.length} tasks done today.{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); go('routine'); }}>Open routine</a>
            </p>
          </div>
          <div className="panel">
            <h3>Radiation this mission</h3>
            <div className={`progress ${dosePct >= 80 ? 'red' : dosePct >= 50 ? 'amber' : ''}`} style={{ marginBottom: 8 }}>
              <span style={{ width: `${dosePct}%` }} />
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {ev.cumulativeDoseMsv.toFixed(1)} mSv so far, {dosePct.toFixed(1)}% of NASA's 600 mSv career limit. {env.doseNote}
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
