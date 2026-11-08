import { INDICATORS } from '../data/indicators';
import { SOURCES } from '../data/sources';
import { Disclaimer, SourceLinks } from './ui';

const HAZARDS = [
  { t: 'Space radiation', d: 'Galactic cosmic rays and solar particle events raise cancer risk and can affect the nervous and cardiovascular systems. VIGIL tracks daily dose and the mission total against the 600 mSv career limit.' },
  { t: 'Isolation and confinement', d: 'Small crews, no privacy, and months away from family affect sleep, mood and team cohesion. Daily mood and stress ratings catch slow drifts.' },
  { t: 'Distance from Earth', d: 'With a one-way delay of up to 24 minutes to Mars, the crew must assess and act first. Every VIGIL alert carries its own reason and checklist.' },
  { t: 'Gravity fields', d: 'Microgravity drives bone and muscle loss, fluid shifts and cardiovascular deconditioning. Exercise minutes and body mass are tracked.' },
  { t: 'Hostile and closed environments', d: 'A sealed cabin concentrates germs, CO2 and noise. Fever, SpO2 and symptom clusters are watched because infection spreads to the whole crew.' },
];

export function Learn() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Learn</h1>
          <p>What each indicator means, how to measure it on board, and where every threshold comes from.</p>
        </div>
      </div>

      <h2>The five hazards of human spaceflight</h2>
      <div className="grid cols-3" style={{ marginBottom: 18 }}>
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

      <h2>Where the data comes from</h2>
      <div className="panel" style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 14 }}>
          Most of the numbers on the dashboard come off one garment. Since 2019 the ISS has flown the <b>Bio-Monitor</b> (Hexoskin's Astroskin): a
          compression shirt with a 3-lead ECG, stretch bands for breathing, an activity sensor and a skin thermometer, plus a headband that carries
          a pulse oximeter. It replaces the bulky kit crews used before, and the Canadian Space Agency is adapting it for the Gateway lunar station.
          Blood pressure comes from a cuff; glucose from a finger-stick meter; dose from the personal dosimeter. Mood, stress and symptoms are the
          crew member's own words.
        </p>
        <div className="pipeline">
          <div className="pipe"><b>Shirt and headband</b><span>ECG, breathing, SpO2, skin temperature, movement, sleep</span></div>
          <div className="arrow">→</div>
          <div className="pipe"><b>Recorder</b><span>Small module clipped to the shirt stores a full day</span></div>
          <div className="arrow">→</div>
          <div className="pipe"><b>Bluetooth to the tablet</b><span>VIGIL reads the values, adds cuff, meter and dosimeter entries and the check-in</span></div>
          <div className="arrow">→</div>
          <div className="pipe"><b>Baseline and rules</b><span>Compared with 14 pre-flight days and published limits, on the device</span></div>
          <div className="arrow">→</div>
          <div className="pipe"><b>Crew first, ground second</b><span>Alert and checklist on board; one packaged message downlinked to the flight surgeon</span></div>
        </div>
        <SourceLinks ids={['bio-monitor-csa', 'bio-monitor-ntrs', 'hexoskin-gateway']} />
      </div>

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

      <h2>How we designed it</h2>
      <div className="panel" style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 14 }}>
          We followed the five design-thinking stages, and we looped back more than once. The main lesson was to design around the people, not the
          data: an astronaut is busy, tired, floating, and sometimes tempted to play down a symptom. Every screen had to answer "am I okay, and what
          do I do" in a few seconds of attention.
        </p>
        <div className="dt-steps">
          <div><b>1. Empathize</b><span>Three users with different needs: the astronaut, the crew medical officer, the flight surgeon on Earth. Memoirs, NASA and CSA reports, analog missions, a typical ISS day mapped hour by hour.</span></div>
          <div><b>2. Define</b><span>"Astronauts on long missions need a quick way to understand their own health and know what to do about it, because they cannot always reach doctors on Earth in time." Success criterion: understand an alert and the next step in under 30 seconds.</span></div>
          <div><b>3. Ideate</b><span>Traffic-light dashboard against a personal baseline, alerts that explain themselves, a fully offline Mars mode, routine prompts, a camera pulse, a surgeon message. Sorted by impact and feasibility.</span></div>
          <div><b>4. Prototype</b><span>Sketches, then a clickable build with simulated sensor data (this app), with the Bio-Monitor shirt as the intended live source.</span></div>
          <div><b>5. Test</b><span>Task-based checks ("you just got an alert; find out why and what to do"), phone and tablet widths, keyboard only, and a rule-by-rule test suite. Each round changed the copy and the tile layout.</span></div>
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
