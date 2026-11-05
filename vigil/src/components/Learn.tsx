import { INDICATORS } from '../data/indicators';
import { SOURCES } from '../data/sources';
import type { View } from '../App';
import { Disclaimer, SourceLinks } from './ui';

const HAZARDS = [
  { t: 'Space radiation', d: 'Galactic cosmic rays and solar particle events raise cancer risk and can affect the nervous and cardiovascular systems. VIGIL tracks daily dose and the mission total against the 600 mSv career limit.' },
  { t: 'Isolation and confinement', d: 'Small crews, no privacy, and months away from family affect sleep, mood and team cohesion. Daily mood and stress ratings catch slow drifts.' },
  { t: 'Distance from Earth', d: 'With a one-way delay of up to 24 minutes to Mars, the crew must assess and act first. Every VIGIL alert carries its own reason and checklist.' },
  { t: 'Gravity fields', d: 'Microgravity drives bone and muscle loss, fluid shifts and cardiovascular deconditioning. Exercise minutes and body mass are tracked.' },
  { t: 'Hostile and closed environments', d: 'A sealed cabin concentrates germs, CO2 and noise. Fever, SpO2 and symptom clusters are watched because infection spreads to the whole crew.' },
];

export function Learn({ go }: { go: (v: View) => void }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Learn</h1>
          <p>What each indicator means, how to measure it on board, and where every threshold comes from.</p>
        </div>
      </div>

      <h2>The five hazards of human spaceflight</h2>
      <div className="grid cols-3" style={{ marginBottom: 10 }}>
        {HAZARDS.map((h) => (
          <div key={h.t} className="panel learn-card">
            <h3>{h.t}</h3>
            <p style={{ fontSize: 14 }}>{h.d}</p>
          </div>
        ))}
        <div className="panel">
          <h3>Source</h3>
          <SourceLinks ids={['hrp-hazards', 'hfbp', 'twins']} />
        </div>
      </div>

      <p className="muted" style={{ fontSize: 14, marginTop: 0, marginBottom: 18 }}>
        The Body map shows which body systems each hazard affects and how yours are doing today.{' '}
        <button className="btn sm" onClick={() => go('body')}>Open body map</button>
      </p>

      <h2>How VIGIL decides</h2>
      <div className="grid cols-2" style={{ marginBottom: 18 }}>
        <div className="panel">
          <h3>Published ranges</h3>
          <p style={{ fontSize: 14 }}>
            Where a public medical or NASA standard exists (blood pressure, glucose, fever, SpO2, radiation limits) the rule uses that number
            and quotes it in the alert.
          </p>
        </div>
        <div className="panel">
          <h3>Your own baseline</h3>
          <p style={{ fontSize: 14 }}>
            Fourteen pre-flight days give a median and a typical spread for each indicator (median absolute deviation, which ignores one-off
            outliers). An in-flight value more than about 3 typical deviations away, or a 3-day trend, is flagged even when it sits inside
            the population range. Heart rate 95 bpm is normal for most adults but unusual for someone whose resting rate is 55.
          </p>
        </div>
      </div>

      <h2>Indicators</h2>
      <div className="grid cols-2" style={{ marginBottom: 18 }}>
        {INDICATORS.map((def) => (
          <div key={def.id} className="panel learn-card">
            <h3>{def.label} <span className="muted" style={{ fontWeight: 400 }}>{def.unit}</span></h3>
            <p style={{ fontSize: 14 }}>{def.what}</p>
            <p style={{ fontSize: 14 }}><b>How:</b> {def.how}</p>
            <div className="ref">{def.reference}</div>
            <SourceLinks ids={def.sources} />
          </div>
        ))}
      </div>

      <h2>All sources</h2>
      <div className="panel">
        <table className="table">
          <thead><tr><th>Organisation</th><th>Document</th><th>Used for</th></tr></thead>
          <tbody>
            {SOURCES.map((s) => (
              <tr key={s.id}>
                <td>{s.org}</td>
                <td><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></td>
                <td className="muted">{s.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Disclaimer />
    </>
  );
}
