import { INDICATORS } from '../data/indicators';
import { SOURCES } from '../data/sources';
import type { View } from '../lib/views';
import { Disclaimer, SourceLinks } from './ui';
import './screens.css';
import './learn.css';

const HAZARDS = [
  { t: 'Space radiation', d: 'Galactic cosmic rays and solar particle events raise cancer risk and can affect the nervous and cardiovascular systems. VIGIL tracks daily dose and the mission total against the 600 mSv career limit.' },
  { t: 'Isolation and confinement', d: 'Small crews, no privacy, and months away from family affect sleep, mood and team cohesion. Daily mood and stress ratings catch slow drifts.' },
  { t: 'Distance from Earth', d: 'With a one-way delay of up to 24 minutes to Mars, the crew must assess and act first. Every VIGIL alert carries its own reason and checklist.' },
  { t: 'Gravity fields', d: 'Microgravity drives bone and muscle loss, fluid shifts and cardiovascular deconditioning. Exercise minutes and body mass are tracked.' },
  { t: 'Hostile and closed environments', d: 'A sealed cabin concentrates germs, CO2 and noise. Fever, SpO2 and symptom clusters are watched because infection spreads to the whole crew.' },
];

export function Learn({ go }: { go: (v: View) => void }) {
  return (
    <div className="learn">
      <div className="page-head">
        <div>
          <h1>Learn</h1>
          <p>What each indicator means, how to measure it on board, and where every threshold comes from.</p>
        </div>
      </div>

      <section className="learn-section" aria-labelledby="learn-hazards">
        <h2 id="learn-hazards">The five hazards of human spaceflight</h2>
        <ul className="learn-list">
          {HAZARDS.map((h) => (
            <li key={h.t}>
              <h3>{h.t}</h3>
              <p>{h.d}</p>
            </li>
          ))}
        </ul>
        <SourceLinks ids={['hrp-hazards', 'hfbp', 'twins']} />
        <p className="learn-note">
          The Body map shows which body systems each hazard affects and how yours are doing today.
        </p>
        <button type="button" className="btn" onClick={() => go('body')}>Open body map</button>
      </section>

      <section className="learn-section" aria-labelledby="learn-decides">
        <h2 id="learn-decides">How VIGIL decides</h2>
        <ul className="learn-list">
          <li>
            <h3>Published ranges</h3>
            <p>
              Where a public medical or NASA standard exists (blood pressure, glucose, fever, SpO2, radiation limits) the rule uses that number
              and quotes it in the alert.
            </p>
          </li>
          <li>
            <h3>Your own baseline</h3>
            <p>
              Fourteen pre-flight days give a median and a typical spread for each indicator (median absolute deviation, which ignores one-off
              outliers). An in-flight value more than about 3 typical deviations away, or a 3-day trend, is flagged even when it sits inside
              the population range. Heart rate 95 bpm is normal for most adults but unusual for someone whose resting rate is 55.
            </p>
          </li>
        </ul>
      </section>

      <section className="learn-section" aria-labelledby="learn-indicators">
        <h2 id="learn-indicators">Indicators</h2>
        <div>
          {INDICATORS.map((def) => (
            <details key={def.id} className="disclosure">
              <summary>
                <span>{def.label} {def.unit && <span className="muted mono learn-unit">{def.unit}</span>}</span>
              </summary>
              <div className="disclosure-body learn-body">
                <p>{def.what}</p>
                <p><b>How to measure:</b> {def.how}</p>
                <p className="learn-ref">{def.reference}</p>
                <SourceLinks ids={def.sources} />
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="learn-section" aria-labelledby="learn-sources">
        <h2 id="learn-sources">All sources</h2>
        <ul className="learn-sources">
          {SOURCES.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
              <span className="learn-org">{s.org}</span>
              <span className="muted">{s.note}</span>
            </li>
          ))}
        </ul>
      </section>
      <Disclaimer />
    </div>
  );
}
