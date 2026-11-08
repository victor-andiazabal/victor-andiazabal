import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { INDICATORS, indicatorById } from '../data/indicators';
import { baselineOf, seriesFor } from '../lib/analytics';
import { evaluate } from '../lib/rules';
import { scenarioById } from '../lib/simulate';
import type { IndicatorId } from '../lib/types';
import { useStore } from '../state/store';
import { fmt, Pill, SourceLinks } from './ui';

/** Published cut-offs drawn as horizontal lines on the chart. */
const REF_LINES: Partial<Record<IndicatorId, { y: number; label: string }[]>> = {
  hr: [{ y: 100, label: '100 bpm' }, { y: 60, label: '60 bpm' }],
  bpSys: [{ y: 130, label: 'stage 1' }, { y: 140, label: 'stage 2' }, { y: 180, label: 'crisis' }],
  bpDia: [{ y: 80, label: 'stage 1' }, { y: 90, label: 'stage 2' }],
  spo2: [{ y: 95, label: '95%' }, { y: 90, label: '90%' }],
  resp: [{ y: 20, label: '20 /min' }, { y: 12, label: '12 /min' }],
  temp: [{ y: 38, label: 'fever 38 °C' }],
  glucose: [{ y: 70, label: '70 hypo' }, { y: 100, label: '100' }, { y: 126, label: '126' }],
  sleep: [{ y: 7, label: '7 h (AASM)' }, { y: 8.5, label: '8.5 h scheduled' }],
  exercise: [{ y: 147, label: '147 min assigned' }],
};

export function Trends({ initial }: { initial?: IndicatorId }) {
  const { selected, settings, crew } = useStore();
  const [id, setId] = useState<IndicatorId>(initial ?? 'sleep');
  const [compare, setCompare] = useState(false);
  const def = indicatorById(id);
  const ev = useMemo(() => evaluate(selected, settings), [selected, settings]);
  const scenario = scenarioById(settings.scenario);

  const data = useMemo(() => {
    const rows: Record<string, number | null>[] = [];
    const byDay = new Map<number, Record<string, number | null>>();
    const all = compare ? crew : [selected];
    for (const m of all) {
      for (const p of seriesFor(m.records, id)) {
        const row = byDay.get(p.day) ?? { day: p.day };
        row[m.id] = p.value;
        byDay.set(p.day, row);
      }
    }
    for (const day of [...byDay.keys()].sort((a, b) => a - b)) rows.push(byDay.get(day)!);
    return rows;
  }, [crew, selected, id, compare]);

  const baseline = useMemo(
    () => baselineOf(selected.records.filter((r) => r.day <= 0).map((r) => r.values[id]).filter((x): x is number => Number.isFinite(x))),
    [selected, id],
  );

  const colors = ['#6ea8ff', '#34c38f', '#f3b23c', '#f0536a'];
  const st = ev.byIndicator[id];
  const flightValues = seriesFor(selected.records.filter((r) => r.day >= 1), id).map((p) => p.value);
  const flightMin = flightValues.length ? Math.min(...flightValues) : 0;
  const flightMax = flightValues.length ? Math.max(...flightValues) : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Trends · {selected.callsign}</h1>
          <p>Pre-flight days (≤ 0) form the personal baseline. The shaded band is the baseline median ± 2 typical deviations.</p>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> compare whole crew
        </label>
      </div>
      <div className="tabs">
        {INDICATORS.map((i) => (
          <button key={i.id} className={i.id === id ? 'on' : ''} onClick={() => setId(i.id)}>
            <span className={`dot ${ev.byIndicator[i.id].level}`} style={{ marginRight: 6 }} />
            {i.short}
          </button>
        ))}
      </div>
      <div className="grid cols-3">
        <div className="panel" style={{ gridColumn: 'span 2', height: 380 }}>
          <h3>
            {def.label} <span className="muted" style={{ fontWeight: 400 }}>({def.unit || 'count'})</span>
            <Pill level={st.level} />
          </h3>
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="day" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} stroke="var(--muted)" tick={{ fontSize: 12 }} label={{ value: 'mission day', position: 'insideBottomRight', offset: -2, fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis stroke="var(--muted)" tick={{ fontSize: 12 }} domain={['auto', 'auto']} width={44} />
              <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(id, v) : v)} labelFormatter={(d) => `day ${d}`} />
              {baseline && !compare && (
                <ReferenceArea y1={baseline.median - 2 * baseline.mad} y2={baseline.median + 2 * baseline.mad} fill="var(--accent)" fillOpacity={0.08} />
              )}
              {baseline && !compare && <ReferenceLine y={baseline.median} stroke="var(--accent)" strokeDasharray="4 4" label={{ value: 'baseline', fill: 'var(--accent)', fontSize: 11, position: 'insideTopLeft' }} />}
              <ReferenceLine x={0.5} stroke="var(--muted)" strokeDasharray="2 2" label={{ value: 'launch', fill: 'var(--muted)', fontSize: 11, position: 'insideTopRight' }} />
              {scenario.id !== 'nominal' && (scenario.target === 'all' || scenario.target === selected.id) && (
                <ReferenceArea x1={scenario.startDay - 0.5} x2={scenario.endDay + 0.5} fill="var(--amber)" fillOpacity={0.16} label={{ value: scenario.label, fill: 'var(--amber)', fontSize: 11, position: 'insideTop' }} />
              )}
              {(REF_LINES[id] ?? []).map((r) => (
                <ReferenceLine key={r.label} y={r.y} stroke="var(--red)" strokeOpacity={0.55} strokeDasharray="6 3" label={{ value: r.label, fill: 'var(--red)', fontSize: 11, position: 'right' }} />
              ))}
              {(compare ? crew : [selected]).map((m, i) => (
                <Line key={m.id} type="monotone" dataKey={m.id} name={m.callsign} stroke={colors[i % colors.length]} strokeWidth={m.id === selected.id ? 2.5 : 1.5} dot={{ r: 2.5 }} connectNulls isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="panel">
            <h3>Where you stand</h3>
            <dl className="kv">
              <dt>Today</dt><dd className="mono">{fmt(id, st.value)} {def.unit}</dd>
              <dt>Baseline</dt><dd className="mono">{baseline ? `${fmt(id, baseline.median)} ± ${fmt(id, baseline.mad)}` : '--'}</dd>
              <dt>Deviation</dt><dd className="mono">{st.z !== null ? `${st.z > 0 ? '+' : ''}${st.z.toFixed(1)} typical deviations` : '--'}</dd>
              <dt>In-flight range</dt><dd className="mono">{flightValues.length ? `${fmt(id, flightMin)} to ${fmt(id, flightMax)}` : '--'}</dd>
            </dl>
          </div>
          <div className="panel learn-card">
            <h3>{def.label}</h3>
            <p>{def.what}</p>
            <div className="ref">{def.reference}</div>
            <SourceLinks ids={def.sources} />
          </div>
        </div>
      </div>
    </>
  );
}
