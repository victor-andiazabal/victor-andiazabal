import { useRef, useState } from 'react';
import { ENVIRONMENTS, INDICATORS } from '../data/indicators';
import { csvCell, parseCsv } from '../lib/csv';
import { MAX_MISSION_DAY, SCENARIOS } from '../lib/simulate';
import type { Environment, ScenarioId } from '../lib/types';
import { useStore } from '../state/store';
import { Segmented } from './controls/Segmented';
import { Check } from './ui';
import './screens.css';
import './settings.css';

const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

function download(name: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

interface SettingsProps {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  onReplayTour: () => void;
}

export function Settings({ theme, setTheme, onReplayTour }: SettingsProps) {
  const { settings, dispatch, crew, manual } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');
  const [fileName, setFileName] = useState('');

  const importCsv = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const { records, skipped } = parseCsv(text, crew.map((c) => c.id));
    if (records.length) dispatch({ type: 'manualMany', records });
    const future = records.filter((r) => r.record.day > settings.currentDay).length;
    setImportMsg(`${records.length} row${records.length === 1 ? '' : 's'} imported${skipped ? `, ${skipped} skipped` : ''}.${future ? ` ${future} of them are for days after today and appear when the mission reaches them.` : ''}`);
  };

  const exportJson = () => download(`vigil-day${settings.currentDay}.json`, JSON.stringify({ settings, crew, manual }, null, 2));
  const exportCsv = () => {
    const head = ['crew', 'day', 'source', ...INDICATORS.map((i) => i.id), 'symptoms', 'notes'];
    const rows = crew.flatMap((c) =>
      c.records.map((r) => [c.id, r.day, r.source, ...INDICATORS.map((i) => r.values[i.id] ?? ''), r.symptoms.join('|'), csvCell(r.notes)].join(',')),
    );
    download(`vigil-day${settings.currentDay}.csv`, [head.join(','), ...rows].join('\n'), 'text/csv');
  };

  const manualCount = Object.keys(manual).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mission settings</h1>
          <p>Choose where the crew is, which demonstration scenario runs, and which mission day you are looking at.</p>
        </div>
      </div>
      <div className="split split-even settings">
        <div className="panel">
          <h2 id="env-title">Environment</h2>
          <div role="radiogroup" aria-labelledby="env-title" className="option-list">
            {(Object.keys(ENVIRONMENTS) as Environment[]).map((k) => (
              <label key={k} className="check-row top option-row">
                <Check type="radio" name="env" checked={settings.environment === k} onChange={() => dispatch({ type: 'settings', patch: { environment: k } })} />
                <span>
                  <span className="option-name">{ENVIRONMENTS[k].label}</span>
                  <small className="option-blurb">{ENVIRONMENTS[k].blurb} Comm delay {ENVIRONMENTS[k].commDelay}; about {ENVIRONMENTS[k].dailyDoseMsv} mSv/day.</small>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2 id="scenario-title">Demonstration scenario</h2>
          <div role="radiogroup" aria-labelledby="scenario-title" className="option-list">
            {SCENARIOS.map((s) => (
              <label key={s.id} className="check-row top option-row">
                <Check type="radio" name="scenario" checked={settings.scenario === s.id} onChange={() => dispatch({ type: 'settings', patch: { scenario: s.id as ScenarioId } })} />
                <span>
                  <span className="option-name">{s.label}</span>
                  <small className="option-blurb">{s.blurb}{s.id !== 'nominal' ? ` Days ${s.startDay}-${s.endDay}.` : ''}</small>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Mission day</h2>
          <div className="field">
            <label htmlFor="day">Day <span className="mono">{settings.currentDay}</span> of <span className="mono">{MAX_MISSION_DAY}</span></label>
            <input id="day" className="range" type="range" min={1} max={MAX_MISSION_DAY} value={settings.currentDay} onChange={(e) => dispatch({ type: 'settings', patch: { currentDay: Number(e.target.value) } })} />
            <span className="hint">Drag to replay the mission day by day. Scenario events land between days 23 and 30.</span>
          </div>
          <div className="settings-row">
            <button type="button" className="btn" onClick={() => dispatch({ type: 'settings', patch: { currentDay: Math.max(1, settings.currentDay - 1) } })}>Previous day</button>
            <button type="button" className="btn" onClick={() => dispatch({ type: 'settings', patch: { currentDay: Math.min(MAX_MISSION_DAY, settings.currentDay + 1) } })}>Next day</button>
          </div>
          <div className="field settings-gap">
            <label htmlFor="seed">Simulation seed</label>
            <input id="seed" className="input mono seed-input" type="number" value={settings.seed} onChange={(e) => dispatch({ type: 'settings', patch: { seed: Number(e.target.value) || 1 } })} />
            <span className="hint">Changes the random day-to-day variation. Same seed, same mission.</span>
          </div>
        </div>
        <div className="panel">
          <h2>Display and data</h2>
          <div className="settings-groups">
            <div className="field">
              <span className="field-label">Theme</span>
              <Segmented label="Theme" options={THEMES} value={theme} onChange={(v) => setTheme(v === 'light' ? 'light' : 'dark')} />
            </div>
            <div className="field">
              <span className="field-label">Tutorial</span>
              <div>
                <button type="button" className="btn" onClick={onReplayTour}>Replay tutorial</button>
              </div>
              <span className="hint">The seven-step tour of Today, the check-in, alerts and the ground link.</span>
            </div>
            <div className="field">
              <span className="field-label">Export</span>
              <div className="settings-row">
                <button type="button" className="btn" onClick={exportJson}>Export JSON</button>
                <button type="button" className="btn" onClick={exportCsv}>Export CSV</button>
              </div>
              <span className="hint">All records for all crew, including your manual entries. Nothing leaves the device unless you export it.</span>
            </div>
            <div className="field">
              <span className="field-label" id="csv-label">Import</span>
              <div className="file-pick">
                <button type="button" className="btn" aria-describedby="csv-label" onClick={() => fileRef.current?.click()}>Choose file</button>
                <span className="file-name">{fileName || 'No file chosen'}</span>
                <input ref={fileRef} id="csv" className="sr-only" tabIndex={-1} aria-hidden="true" type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importCsv(f); }} />
              </div>
              <span className="hint">CSV in the same layout as the export (crew, day, one column per indicator). Rows replace the simulated day for that crew member, which is how wearable or cuff exports get in.</span>
              {importMsg && <span className="hint import-msg" role="status">{importMsg}</span>}
            </div>
            <div className="field">
              <span className="field-label">Reset</span>
              <div>
                <button type="button" className="btn btn-destructive" onClick={() => { if (confirm('Clear manual entries, acknowledgements and settings?')) dispatch({ type: 'reset' }); }}>Clear local data</button>
              </div>
              <span className="hint">{manualCount} manual entr{manualCount === 1 ? 'y' : 'ies'} stored in this browser.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
