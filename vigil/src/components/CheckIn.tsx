import { useMemo, useState } from 'react';
import { INDICATORS, SYMPTOMS } from '../data/indicators';
import { evaluate } from '../lib/rules';
import type { DayRecord, IndicatorId } from '../lib/types';
import { useStore } from '../state/store';
import { Pill, SourceLinks } from './ui';
import type { View } from '../App';

type Draft = Partial<Record<IndicatorId, string>>;

export function CheckIn({ go }: { go: (v: View) => void }) {
  const { selected, settings, dispatch, manual } = useStore();
  const day = settings.currentDay;
  const existing = selected.records.find((r) => r.day === day);
  const isManual = Boolean(manual[`${selected.id}:${day}`]);

  const [draft, setDraft] = useState<Draft>(() => {
    const d: Draft = {};
    for (const def of INDICATORS) {
      const v = existing?.values[def.id];
      if (Number.isFinite(v)) d[def.id] = String(v);
    }
    return d;
  });
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const record: DayRecord = useMemo(() => {
    const values: Partial<Record<IndicatorId, number>> = {};
    for (const def of INDICATORS) {
      const raw = draft[def.id];
      if (raw === undefined || raw === '') continue;
      const n = Number(raw);
      if (Number.isFinite(n)) values[def.id] = n;
    }
    return { day, values, symptoms, notes, source: 'manual' };
  }, [draft, symptoms, notes, day]);

  // Live preview: evaluate the crew member as if this draft were today's record.
  const preview = useMemo(() => {
    const copy = { ...selected, records: selected.records.map((r) => (r.day === day ? record : r)) };
    return evaluate(copy, settings);
  }, [selected, record, settings, day]);

  const set = (id: IndicatorId, v: string) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [id]: v }));
  };

  const save = () => {
    dispatch({ type: 'manual', crewId: selected.id, record });
    setSaved(true);
  };

  const groups: { key: (typeof INDICATORS)[number]['group']; title: string; blurb: string }[] = [
    { key: 'vitals', title: 'Vitals', blurb: 'Cuff, oximeter and thermometer. Sit quietly for 5 minutes first.' },
    { key: 'metabolic', title: 'Nutrition', blurb: 'Fasting glucose each morning; body mass weekly.' },
    { key: 'behavioral', title: 'Sleep, mood and alertness', blurb: 'Honest ratings matter more than good ones. Run the reaction test for the PVT fields.' },
    { key: 'environment', title: 'Radiation', blurb: 'From the personal dosimeter.' },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Daily check-in · day {day}</h1>
          <p>
            {selected.callsign}. {isManual ? 'You already saved an entry today; editing it.' : 'Wearable values are pre-filled; correct anything that looks wrong.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Pill level={preview.overall}>{preview.findings.length ? `${preview.findings.length} flag${preview.findings.length > 1 ? 's' : ''}` : 'no flags'}</Pill>
          <button className="btn primary" onClick={save}>
            {saved ? 'Saved' : 'Save check-in'}
          </button>
        </div>
      </div>

      <div className="grid cols-2">
        {groups.map((g) => (
          <div key={g.key} className="panel">
            <h3>{g.title}</h3>
            <p className="muted" style={{ fontSize: 13 }}>{g.blurb}</p>
            <div className="form">
              {INDICATORS.filter((i) => i.group === g.key).map((def) => {
                const st = preview.byIndicator[def.id];
                const isScale = def.id === 'mood' || def.id === 'stress';
                return (
                  <div key={def.id} className="field">
                    <label htmlFor={`in-${def.id}`}>{def.label}</label>
                    {isScale ? (
                      <div className="scale" role="radiogroup" aria-label={def.label}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" className={draft[def.id] === String(n) ? 'on' : ''} onClick={() => set(def.id, String(n))}>
                            {n}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="row">
                        <input
                          id={`in-${def.id}`}
                          type="number"
                          inputMode="decimal"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={draft[def.id] ?? ''}
                          placeholder={def.entry === 'device' ? 'from wearable' : 'enter'}
                          onChange={(e) => set(def.id, e.target.value)}
                        />
                        <span className="unit">{def.unit}</span>
                      </div>
                    )}
                    <span className="hint">{def.reference}</span>
                    {draft[def.id] && (
                      <span className="inline-status">
                        <span className={`dot ${st.level}`} />
                        {st.level === 'green' ? 'within range' : st.level === 'amber' ? 'flagged: watch' : 'flagged: act now'}
                        {st.baseline && st.z !== null && Math.abs(st.z) >= 2 && (
                          <span className="muted"> · {st.z > 0 ? 'above' : 'below'} your usual</span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
              {g.key === 'behavioral' && (
                <button className="btn sm" type="button" onClick={() => go('pvt')}>
                  Run the 60-second reaction test
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h3>Symptoms today</h3>
          <p className="muted" style={{ fontSize: 13 }}>Tap everything that applies. Items in red are treated as urgent.</p>
          <div className="chips">
            {SYMPTOMS.map((s) => {
              const on = symptoms.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`chip ${s.redFlag ? 'red' : ''} ${on ? 'on' : ''}`}
                  onClick={() => {
                    setSaved(false);
                    setSymptoms((cur) => (on ? cur.filter((x) => x !== s.id) : [...cur, s.id]));
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="notes">Notes for the log</label>
            <textarea id="notes" rows={3} value={notes} onChange={(e) => { setSaved(false); setNotes(e.target.value); }} placeholder="Anything the flight surgeon should know: pain level, what changed, meds taken." />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h3>
            What this entry triggers <Pill level={preview.overall} />
          </h3>
          {preview.findings.length === 0 && <p className="muted">No rules fire on these values. Save to keep your baseline fresh.</p>}
          {preview.findings.map((f) => (
            <div key={f.id} className={`alert ${f.level}`}>
              <div className="head">
                <Pill level={f.level} />
                <h3>{f.title}</h3>
                {f.notifySurgeon && <span className="pill neutral">notify flight surgeon</span>}
              </div>
              <div className="why"><b>Why</b> {f.reason}</div>
              <div className="why"><b>Do</b> {f.action}</div>
              <div className="foot"><SourceLinks ids={f.sources} compact /></div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn primary" onClick={save}>{saved ? 'Saved' : 'Save check-in'}</button>
            {saved && <button className="btn" onClick={() => go('dashboard')}>Back to dashboard</button>}
          </div>
        </div>
      </div>
    </>
  );
}
