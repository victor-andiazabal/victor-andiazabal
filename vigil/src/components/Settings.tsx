import { ENVIRONMENTS, INDICATORS } from '../data/indicators';
import { MAX_MISSION_DAY, SCENARIOS } from '../lib/simulate';
import type { Environment, ScenarioId } from '../lib/types';
import { useStore } from '../state/store';

function download(name: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Settings({ theme, setTheme }: { theme: 'dark' | 'light'; setTheme: (t: 'dark' | 'light') => void }) {
  const { settings, dispatch, crew, manual } = useStore();

  const exportJson = () => download(`vigil-day${settings.currentDay}.json`, JSON.stringify({ settings, crew, manual }, null, 2));
  const exportCsv = () => {
    const head = ['crew', 'day', 'source', ...INDICATORS.map((i) => i.id), 'symptoms', 'notes'];
    const rows = crew.flatMap((c) =>
      c.records.map((r) => [c.id, r.day, r.source, ...INDICATORS.map((i) => r.values[i.id] ?? ''), r.symptoms.join('|'), JSON.stringify(r.notes ?? '')].join(',')),
    );
    download(`vigil-day${settings.currentDay}.csv`, [head.join(','), ...rows].join('\n'), 'text/csv');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mission settings</h1>
          <p>Choose where the crew is, which demonstration scenario runs, and which mission day you are looking at.</p>
        </div>
      </div>
      <div className="grid cols-2">
        <div className="panel">
          <h3>Environment</h3>
          <div className="form">
            {(Object.keys(ENVIRONMENTS) as Environment[]).map((k) => (
              <label key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="radio" name="env" checked={settings.environment === k} onChange={() => dispatch({ type: 'settings', patch: { environment: k } })} style={{ marginTop: 4 }} />
                <div>
                  <div><b>{ENVIRONMENTS[k].label}</b></div>
                  <small className="muted">{ENVIRONMENTS[k].blurb} Comm delay {ENVIRONMENTS[k].commDelay}; about {ENVIRONMENTS[k].dailyDoseMsv} mSv/day.</small>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Demonstration scenario</h3>
          <div className="form">
            {SCENARIOS.map((s) => (
              <label key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="radio" name="scenario" checked={settings.scenario === s.id} onChange={() => dispatch({ type: 'settings', patch: { scenario: s.id as ScenarioId } })} style={{ marginTop: 4 }} />
                <div>
                  <div><b>{s.label}</b></div>
                  <small className="muted">{s.blurb}{s.id !== 'nominal' ? ` Days ${s.startDay}-${s.endDay}.` : ''}</small>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Mission day</h3>
          <div className="field">
            <label htmlFor="day">Day {settings.currentDay} of {MAX_MISSION_DAY}</label>
            <input id="day" type="range" min={1} max={MAX_MISSION_DAY} value={settings.currentDay} onChange={(e) => dispatch({ type: 'settings', patch: { currentDay: Number(e.target.value) } })} />
            <span className="hint">Drag to replay the mission day by day. Scenario events land between days 23 and 30.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn sm" onClick={() => dispatch({ type: 'settings', patch: { currentDay: Math.max(1, settings.currentDay - 1) } })}>Previous day</button>
            <button className="btn sm" onClick={() => dispatch({ type: 'settings', patch: { currentDay: Math.min(MAX_MISSION_DAY, settings.currentDay + 1) } })}>Next day</button>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="seed">Simulation seed</label>
            <input id="seed" type="number" value={settings.seed} onChange={(e) => dispatch({ type: 'settings', patch: { seed: Number(e.target.value) || 1 } })} />
            <span className="hint">Changes the random day-to-day variation. Same seed, same mission.</span>
          </div>
        </div>
        <div className="panel">
          <h3>Display and data</h3>
          <div className="form">
            <div className="field">
              <label>Theme</label>
              <div className="scale">
                <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>Dark (cabin)</button>
                <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>Light</button>
              </div>
            </div>
            <div className="field">
              <label>Export</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn sm" onClick={exportJson}>JSON</button>
                <button className="btn sm" onClick={exportCsv}>CSV</button>
              </div>
              <span className="hint">All records for all crew, including your manual entries. Nothing leaves the device unless you export it.</span>
            </div>
            <div className="field">
              <label>Reset</label>
              <button className="btn sm danger" onClick={() => { if (confirm('Clear manual entries, acknowledgements and settings?')) dispatch({ type: 'reset' }); }}>Clear local data</button>
              <span className="hint">{Object.keys(manual).length} manual entr{Object.keys(manual).length === 1 ? 'y' : 'ies'} stored in this browser.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
