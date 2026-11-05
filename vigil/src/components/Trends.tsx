import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { INDICATORS, indicatorById } from '../data/indicators';
import { baselineOf, seriesFor } from '../lib/analytics';
import { fmt, LEVEL_LABEL } from '../lib/format';
import { evaluate } from '../lib/rules';
import { scenarioById } from '../lib/simulate';
import type { IndicatorId } from '../lib/types';
import { useStore } from '../state/store';
import { Pill, SourceLinks } from './ui';
import './screens.css';
import './trends.css';

type RefLevel = 'amber' | 'red' | 'neutral';
interface RefLine { y: number; label: string; level: RefLevel }

/** Published cut-offs drawn as dashed horizontal lines, coloured by the status a crossing produces. Neutral lines are reference values only. */
const REF_LINES: Partial<Record<IndicatorId, RefLine[]>> = {
  hr: [{ y: 100, label: '100 bpm', level: 'amber' }, { y: 60, label: '60 bpm', level: 'amber' }],
  bpSys: [{ y: 130, label: 'stage 1', level: 'amber' }, { y: 140, label: 'stage 2', level: 'amber' }, { y: 180, label: 'crisis', level: 'red' }],
  bpDia: [{ y: 80, label: 'stage 1', level: 'amber' }, { y: 90, label: 'stage 2', level: 'amber' }],
  spo2: [{ y: 95, label: '95%', level: 'amber' }, { y: 90, label: '90%', level: 'red' }],
  temp: [{ y: 38, label: 'fever 38 °C', level: 'amber' }],
  glucose: [{ y: 70, label: '70 hypo', level: 'amber' }, { y: 100, label: '100', level: 'neutral' }, { y: 126, label: '126', level: 'amber' }],
  sleep: [{ y: 7, label: '7 h (AASM)', level: 'neutral' }, { y: 8.5, label: '8.5 h scheduled', level: 'neutral' }],
  exercise: [{ y: 147, label: '147 min assigned', level: 'neutral' }],
};

const REF_STROKE: Record<RefLevel, string> = { amber: 'var(--amber)', red: 'var(--red)', neutral: 'var(--text-muted)' };
const REF_WORD: Record<RefLevel, string> = { amber: ` · ${LEVEL_LABEL.amber}`, red: ` · ${LEVEL_LABEL.red}`, neutral: '' };

/** Crew series: the selected person is solid Text; others are told apart by dash pattern, not colour. */
const SERIES_STYLE = [
  { stroke: 'var(--text)', dash: undefined },
  { stroke: 'var(--text-2)', dash: '6 3' },
  { stroke: 'var(--text-2)', dash: '2 3' },
  { stroke: 'var(--text-muted)', dash: '10 3 2 3' },
] as const;

const AXIS_TICK = { fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'var(--mono)' } as const;
const CHART_LABEL = { fontSize: 12, fontFamily: 'var(--mono)' } as const;

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

  const st = ev.byIndicator[id];
  const flightValues = seriesFor(selected.records.filter((r) => r.day >= 1), id).map((p) => p.value);
  const flightMin = flightValues.length ? Math.min(...flightValues) : 0;
  const flightMax = flightValues.length ? Math.max(...flightValues) : 0;

  const plotted = compare ? crew : [selected];
  const others = plotted.filter((m) => m.id !== selected.id);
  const styleFor = (memberId: string) =>
    SERIES_STYLE[memberId === selected.id ? 0 : 1 + (others.findIndex((m) => m.id === memberId) % (SERIES_STYLE.length - 1))];
  const scenarioActive = scenario.id !== 'nominal' && (scenario.target === 'all' || scenario.target === selected.id);
  const refs = REF_LINES[id] ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Trends · {selected.callsign}</h1>
          <p>Pre-flight days (0 and earlier) form your personal baseline. The cyan band is the baseline median plus or minus 2 typical deviations.</p>
        </div>
        <label className="check-row">
          <input className="check" type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
          <span>Compare whole crew</span>
        </label>
      </div>

      <div className="trend-picker">
        <label className="field-label" htmlFor="trend-indicator">Indicator</label>
        <select id="trend-indicator" className="input trend-select" value={id} onChange={(e) => setId(e.target.value as IndicatorId)}>
          {INDICATORS.map((i) => (
            <option key={i.id} value={i.id}>{i.label}: {LEVEL_LABEL[ev.byIndicator[i.id].level]}</option>
          ))}
        </select>
      </div>

      <div className="split">
        <div className="panel">
          <h2 className="trend-title">
            <span>{def.label} <span className="muted trend-unit">({def.unit || 'count'})</span></span>
            <Pill level={st.level} />
          </h2>
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="day" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} stroke="var(--line-strong)" tickLine={false} tick={AXIS_TICK} label={{ value: 'mission day', position: 'insideBottomRight', offset: -2, fill: 'var(--text-muted)', ...CHART_LABEL }} />
                <YAxis stroke="var(--line-strong)" tickLine={false} tick={AXIS_TICK} domain={['auto', 'auto']} width={44} tickFormatter={(v: number) => String(Number(v.toFixed(1)))} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? fmt(id, v) : v)} labelFormatter={(d) => `day ${d}`} />
                {baseline && !compare && (
                  <ReferenceArea y1={baseline.median - 2 * baseline.mad} y2={baseline.median + 2 * baseline.mad} fill="var(--brand)" fillOpacity={0.1} stroke="none" ifOverflow="hidden" />
                )}
                {baseline && !compare && (
                  <ReferenceLine y={baseline.median} stroke="var(--brand)" strokeOpacity={0.7} strokeWidth={1} label={{ value: 'baseline', fill: 'var(--text-2)', position: 'insideBottomLeft', ...CHART_LABEL }} />
                )}
                <ReferenceLine x={0.5} stroke="var(--text-muted)" strokeDasharray="2 3" label={{ value: 'launch', fill: 'var(--text-muted)', position: 'insideTopRight', ...CHART_LABEL }} />
                {scenarioActive && (
                  <ReferenceArea x1={scenario.startDay - 0.5} x2={scenario.endDay + 0.5} fill="var(--amber)" fillOpacity={0.14} stroke="none" ifOverflow="hidden" label={{ value: 'scenario', fill: 'var(--text-2)', position: 'insideTop', ...CHART_LABEL }} />
                )}
                {refs.map((r) => (
                  <ReferenceLine key={r.label} y={r.y} stroke={REF_STROKE[r.level]} strokeDasharray="6 4" strokeWidth={1} label={{ value: `${r.label}${REF_WORD[r.level]}`, fill: 'var(--text-2)', position: 'insideBottomRight', ...CHART_LABEL }} />
                ))}
                {plotted.map((m) => {
                  const look = styleFor(m.id);
                  const own = m.id === selected.id;
                  return (
                    <Line
                      key={m.id}
                      type="monotone"
                      dataKey={m.id}
                      name={m.callsign}
                      stroke={look.stroke}
                      strokeDasharray={look.dash}
                      strokeWidth={own ? 2 : 1.5}
                      dot={own ? { r: 2.5, fill: 'var(--text)', stroke: 'var(--surface-1)', strokeWidth: 1 } : false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ul className="trend-legend" aria-label="Chart key">
            {compare && plotted.map((m) => {
              const look = styleFor(m.id);
              return (
                <li key={m.id}>
                  <svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" stroke={look.stroke} strokeWidth={m.id === selected.id ? 2 : 1.5} strokeDasharray={look.dash} /></svg>
                  {m.callsign}
                </li>
              );
            })}
            {scenarioActive && <li><span className="legend-scenario" aria-hidden="true" />Scenario window: {scenario.label}</li>}
            {baseline && !compare && <li><span className="legend-band" aria-hidden="true" />Your normal range</li>}
            {refs.length > 0 && (
              <li>
                <svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="6 4" /></svg>
                Published cut-off (amber: Watch, red: Act now)
              </li>
            )}
          </ul>
        </div>
        <div className="stack">
          <div className="panel">
            <h3>Where you stand</h3>
            <dl className="kv">
              <dt>Today</dt><dd className="mono">{fmt(id, st.value)} {def.unit}</dd>
              <dt>Baseline</dt><dd className="mono">{baseline ? `${fmt(id, baseline.median)} ± ${fmt(id, baseline.mad)}` : '--'}</dd>
              <dt>Deviation</dt><dd className="mono">{st.z !== null ? `${st.z > 0 ? '+' : ''}${st.z.toFixed(1)} typical deviations` : '--'}</dd>
              <dt>In-flight range</dt><dd className="mono">{flightValues.length ? `${fmt(id, flightMin)} to ${fmt(id, flightMax)}` : '--'}</dd>
            </dl>
          </div>
          <div className="panel">
            <h3>{def.label}</h3>
            <p>{def.what}</p>
            <p className="trend-ref">{def.reference}</p>
            <SourceLinks ids={def.sources} />
          </div>
        </div>
      </div>
    </>
  );
}
