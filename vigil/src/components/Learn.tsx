import { INDICATORS } from '../data/indicators';
import { SOURCES } from '../data/sources';
import { LEVEL_LABEL } from '../lib/format';
import type { Level } from '../lib/types';
import type { View } from '../lib/views';
import { FoldSummary } from './Fold';
import { Disclaimer, SourceLinks } from './ui';
import './screens.css';
import './learn.css';

const HAZARDS = [
  { t: 'Space radiation', d: 'No atmosphere and no magnetic field, so cosmic rays and solar storms hit harder. The dosimeter on your belt counts it. Space Vigil compares each day with what is normal for where you are, and keeps a running total against the 600 mSv career limit.' },
  { t: 'Isolation and confinement', d: 'Months in a small cabin with the same few people, no privacy, and family far away. This shows up as shorter sleep, flatter mood and slower reactions, which is what the morning check-in asks about.' },
  { t: 'Distance from Earth', d: 'Halfway to Mars a message takes up to 24 minutes each way, so the crew must assess and act first. That is why every alert carries its own reason and checklist instead of saying "ask a doctor".' },
  { t: 'Gravity fields', d: 'Bones thin, muscles shrink and fluid shifts toward the head. Exercise minutes and body mass are tracked because they are both the countermeasure and the symptom.' },
  { t: 'Hostile, closed environment', d: 'Germs, CO2 and noise have nowhere to go in a sealed cabin. One person\'s fever is everybody\'s problem, so temperature, blood oxygen, breathing and symptom clusters get a close look.' },
];

/** From the shirt to the screen: main's five-step data path. */
const DATA_PATH = [
  { t: 'You wear the shirt.', d: 'It records all day into a module clipped to the fabric.' },
  { t: 'The tablet picks it up over Bluetooth.', d: 'Heart rate, heart rate variability, breathing, oxygen, skin temperature, movement, sleep.' },
  { t: 'You add the rest in the check-in.', d: 'Blood pressure from the cuff, glucose from the finger-stick meter, the dosimeter reading, how you slept, how you feel, any symptoms. Two minutes.' },
  { t: 'Space Vigil does the thinking on the tablet.', d: 'No connection to Earth needed. It compares today with your own history and with published limits.' },
  { t: 'You act first, the ground second.', d: 'You get a status, a reason and a checklist. If something needs the flight surgeon, one message with the whole day goes down on the comm link, after the real light-time delay.' },
];

const COLOURS: { level: Level; d: string }[] = [
  { level: 'green', d: 'Inside the published range and inside your own usual spread. Carry on.' },
  { level: 'amber', d: 'Unusual for you, close to a limit, or drifting for a few days. You handle it with the checklist; it gets mentioned at the next scheduled medical conference.' },
  { level: 'red', d: 'Past a published limit, a long way from your baseline, or an urgent symptom. Do the checklist now and tell the flight surgeon. The app drafts the message.' },
];

export function Learn({ go }: { go: (v: View) => void }) {
  return (
    <div className="learn">
      <div className="page-head">
        <div>
          <h1>Learn</h1>
          <p>How Space Vigil works, in plain words: what it measures, why it flags what it flags, and where every number comes from.</p>
        </div>
      </div>

      <section className="panel learn-section" aria-labelledby="learn-why">
        <h2 id="learn-why">Why this exists</h2>
        <p>
          Picture being six months from home with a headache that will not go away. On Earth you would call a doctor. Halfway to Mars, a
          message takes up to 24 minutes to arrive and another 24 for the answer. Nobody is going to hold your hand through that in real time.
        </p>
        <p>
          So the crew has to be able to look at their own numbers, understand them, and know what to do next, on their own, with the ground
          confirming later. Space Vigil is that first look. It is not a doctor and does not pretend to be one. It is the thing that says
          "this is normal for you", or "this is not, and here is what to do about it".
        </p>
      </section>

      <section className="panel learn-section" aria-labelledby="learn-hazards">
        <h2 id="learn-hazards">The five hazards of human spaceflight</h2>
        <p className="learn-note">NASA's Human Research Program boils it down to five hazards. Each one leaves a fingerprint in ordinary daily numbers, which is why those numbers are worth watching.</p>
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

      <section className="panel learn-section" aria-labelledby="learn-data">
        <h2 id="learn-data">Where the numbers come from</h2>
        <p>
          Mostly from a shirt. Since 2019 astronauts on the ISS have worn the <b>Bio-Monitor</b>, a snug smart shirt made by the Canadian
          company Hexoskin (they call it Astroskin). Electrodes read the heart's electrical signal, stretchy bands around the chest measure
          breathing, a motion sensor tracks activity and sleep, and a headband holds the small red light that reads blood oxygen. It
          replaced a drawer full of separate medical gadgets, and Canada is now adapting it for the Gateway station around the Moon.
        </p>
        <ol className="learn-steps">
          {DATA_PATH.map((s) => (
            <li key={s.t}>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="learn-note">In this prototype the shirt data is simulated, and labelled as such (the "from wearable" chips in the check-in). The shape is the same.</p>
        <SourceLinks ids={['bio-monitor-csa', 'bio-monitor-ntrs', 'hexoskin-gateway']} />
      </section>

      <section className="panel learn-section" aria-labelledby="learn-decides">
        <h2 id="learn-decides">How Space Vigil decides</h2>
        <p className="learn-note">Two questions, asked of every number, every day.</p>
        <ul className="learn-list">
          <li>
            <h3>1. Is this outside a published limit?</h3>
            <p>
              Doctors already agree on a lot. A temperature of 38.0 °C is a fever. Blood pressure of 140 over 90 is stage 2 hypertension.
              Blood oxygen under 90% is low. NASA sets 600 millisieverts as the radiation ceiling for a whole career. Where a rule like
              that exists, Space Vigil uses it and quotes it in the alert.
            </p>
          </li>
          <li>
            <h3>2. Is this unusual for you?</h3>
            <p>
              Astronauts are not average people. A resting heart rate of 67 is normal for most adults, but if yours sat at 58 every
              morning for the two weeks before launch, 67 is a real change. Fourteen pre-flight days give a median and a typical spread for
              each indicator (median absolute deviation, which ignores one-off outliers). A reading more than about three typical
              deviations away is flagged even inside the textbook range, and so is a 3-day drift, because slow slides are how fatigue and
              illness usually start.
            </p>
          </li>
        </ul>
        <p className="learn-note">
          Nothing is predicted and nothing is diagnosed. Each alert says which of the two questions tripped, with the actual numbers, so you
          can judge for yourself.
        </p>
      </section>

      <section className="panel learn-section" aria-labelledby="learn-colours">
        <h2 id="learn-colours">What the status words mean</h2>
        <ul className="learn-list">
          {COLOURS.map((c) => (
            <li key={c.level}>
              <h3 className="learn-status"><span className={`dot ${c.level}`} aria-hidden="true" />{LEVEL_LABEL[c.level]}</h3>
              <p>{c.d}</p>
            </li>
          ))}
        </ul>
        <p className="learn-note">
          The day bars on each Today tile are your last 14 days. The cyan band in the check-in and in Trends is where you sat before launch.
        </p>
      </section>

      <section className="panel learn-section" aria-labelledby="learn-indicators">
        <h2 id="learn-indicators">The {INDICATORS.length} things it tracks</h2>
        <p className="learn-note">Open any one to see how it is measured on board and where its limit comes from.</p>
        <div className="learn-folds">
          {INDICATORS.map((def) => (
            <details key={def.id} className="learn-fold">
              <FoldSummary>
                <span className="fold-main">{def.label} {def.unit && <span className="mono learn-unit">{def.unit}</span>}</span>
              </FoldSummary>
              <div className="learn-body">
                <p>{def.what}</p>
                <p><b>How to measure:</b> {def.how}</p>
                <p className="learn-ref">{def.reference}</p>
                <SourceLinks ids={def.sources} />
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="panel learn-section" aria-labelledby="learn-process">
        <h2 id="learn-process">How we built it</h2>
        <p>
          We started with people, not data. Three of them: the astronaut, who is busy and tired and sometimes tempted to shrug off a
          symptom; the crew medical officer, a crewmate with extra training but not a doctor; and the flight surgeon on Earth, who reads
          everything hours late. Then we wrote the problem in one sentence: astronauts on long missions need a quick way to understand their
          own health and know what to do about it, because they cannot always reach doctors in time.
        </p>
        <p>
          We gave ourselves one test to pass: can someone understand an alert and know the next step in under 30 seconds? Every design
          choice since has been checked against that. It is why each screen has one next action, why the tiles use full names, why each
          status word means one thing everywhere, and why every alert ends with a "do" line.
        </p>
        <p>
          Ideas that did not make the cut for now: voice summaries, an AI assistant explaining alerts, a private mood journal. The ones that
          did: the personal baseline, self-explaining alerts, the offline Mars mode, the routine prompts, the camera pulse, the body map and
          the delayed comm link to the surgeon.
        </p>
        <p className="learn-note">
          Testing was task-based: "You just got an alert. Why, and what do you do?" On a laptop, on a phone, with the keyboard only. The copy
          changed after every round. The full write-up is in the project's <code>docs/DESIGN_PROCESS.md</code>.
        </p>
      </section>

      <section className="panel learn-section" aria-labelledby="learn-sources">
        <h2 id="learn-sources">Sources</h2>
        <p className="learn-note">Every limit and claim in the app points to one of these: agency documents, clinical bodies and peer-reviewed papers.</p>
        <details className="learn-fold">
          <FoldSummary>
            <span className="fold-main">All sources ({SOURCES.length})</span>
          </FoldSummary>
          <ul className="learn-sources">
            {SOURCES.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                <span className="learn-org">{s.org}</span>
                <span className="learn-note-line">{s.note}</span>
              </li>
            ))}
          </ul>
        </details>
        <p className="learn-note">
          A few conventions are ours and are labelled as such wherever they appear: body mass 5% below baseline, 50% and 80% of the career
          radiation limit, and the three-day persistence windows.
        </p>
      </section>
      <Disclaimer />
    </div>
  );
}
