import { INDICATORS } from '../data/indicators';
import { SOURCES, sourceById } from '../data/sources';
import { Disclaimer } from './ui';

const SECTIONS = [
  ['why', 'Why this exists'],
  ['hazards', 'What space does to a body'],
  ['data', 'Where the numbers come from'],
  ['decide', 'How Space Vigil makes up its mind'],
  ['colours', 'What the colours mean'],
  ['indicators', 'The 16 things it tracks'],
  ['process', 'How we built it'],
  ['sources', 'Sources'],
] as const;

function Ref({ ids }: { ids: string[] }) {
  const srcs = ids.map(sourceById).filter(Boolean);
  if (!srcs.length) return null;
  return (
    <span className="ref">
      {' '}
      {srcs.map((s, i) => (
        <a key={s!.id} href={s!.url} target="_blank" rel="noreferrer" title={s!.title}>
          {s!.org.split(',')[0].replace('American College of Cardiology / ', '')}
          {i < srcs.length - 1 ? ', ' : ''}
        </a>
      ))}
    </span>
  );
}

export function Learn() {
  return (
    <div className="learn">
      <nav className="learn-toc" aria-label="On this page">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
            {label}
          </a>
        ))}
      </nav>

      <article className="learn-body">
        <h1>How Space Vigil works, in plain words</h1>
        <p className="lead">
          Ten minutes of reading. By the end you will know what the app measures, why it flags what it flags, and where every number
          comes from.
        </p>

        <section id="why">
          <h2>Why this exists</h2>
          <p>
            Picture being six months from home with a headache that will not go away. On Earth you would call a doctor. Halfway to
            Mars, a message takes up to 24 minutes to arrive and another 24 for the answer. Nobody is going to hold your hand through
            that in real time.
          </p>
          <p>
            So the crew has to be able to look at their own numbers, understand them, and know what to do next, on their own, with the
            ground confirming later. Space Vigil is that first look. It is not a doctor and it does not pretend to be one. It is the thing
            that says "this is normal for you", or "this is not, and here is what to do about it".
          </p>
        </section>

        <section id="hazards">
          <h2>What space does to a body</h2>
          <p>NASA's Human Research Program boils it down to five hazards. Each one leaves a fingerprint in ordinary daily numbers, which is why those numbers are worth watching.</p>
          <dl className="plain-list">
            <dt>Radiation</dt>
            <dd>No atmosphere, no magnetic field, so cosmic rays and solar storms hit harder. The dosimeter on your belt counts it. Space Vigil compares each day with what is normal for where you are, and keeps a running total against the career limit.</dd>
            <dt>Isolation and confinement</dt>
            <dd>Months in a small cabin with the same few people. This shows up as shorter sleep, flatter mood, slower reactions. Those are the things the morning check-in asks about.</dd>
            <dt>Distance from Earth</dt>
            <dd>The 24-minute problem above. It is the reason every alert carries its own explanation and its own checklist instead of saying "ask a doctor".</dd>
            <dt>Gravity, or the lack of it</dt>
            <dd>Bones thin, muscles shrink, fluid shifts toward the head. Exercise minutes and body mass are tracked because they are the countermeasure and the symptom.</dd>
            <dt>A sealed cabin</dt>
            <dd>Germs, CO2 and noise have nowhere to go. One person's fever is everybody's problem, so temperature, blood oxygen and breathing get a close look.</dd>
          </dl>
          <p className="small">Source: <Ref ids={['hrp-hazards', 'hfbp']} /></p>
        </section>

        <section id="data">
          <h2>Where the numbers come from</h2>
          <p>
            Mostly from a shirt. Since 2019 astronauts on the ISS have worn the <b>Bio-Monitor</b>, a snug smart shirt made by the
            Canadian company Hexoskin (they call it Astroskin). Small sensors sit against the skin: electrodes read the heart's
            electrical signal, stretchy bands around the chest measure breathing, a motion sensor tracks activity and sleep, and a
            headband holds the little red light that reads blood oxygen. It replaced a drawer full of separate medical gadgets, and
            Canada is now adapting it for the Gateway station around the Moon.
          </p>
          <p>From there it is a short trip to your screen:</p>
          <ol className="path">
            <li><b>You wear the shirt.</b> It records all day into a module clipped to the fabric.</li>
            <li><b>The tablet picks it up over Bluetooth.</b> Heart rate, heart rate variability, breathing, oxygen, skin temperature, movement, sleep.</li>
            <li><b>You add the rest in the check-in.</b> Blood pressure from the cuff, glucose from the finger-stick meter, the dosimeter reading, how you slept, how you feel, any symptoms. Two minutes.</li>
            <li><b>Space Vigil does the thinking on the tablet.</b> No connection to Earth needed. It compares today with your own history and with published limits.</li>
            <li><b>You act first, the ground second.</b> You get a colour, a reason and a checklist. If something needs the flight surgeon, one message with the whole day goes down on the next pass.</li>
          </ol>
          <p className="small">In this prototype the shirt data is simulated, and labelled as such. The shape is the same. Source: <Ref ids={['bio-monitor-csa', 'bio-monitor-ntrs', 'hexoskin-gateway']} /></p>
        </section>

        <section id="decide">
          <h2>How Space Vigil makes up its mind</h2>
          <p>Two questions, asked of every number, every day.</p>
          <h3>1. Is this outside a published limit?</h3>
          <p>
            Doctors already agree on a lot. A temperature of 38.0 °C is a fever. Blood pressure of 140 over 90 is stage 2
            hypertension. Blood oxygen under 90% is low. NASA sets 600 millisieverts as the radiation ceiling for a whole career. Where a
            rule like that exists, Space Vigil uses it and names it in the alert.
          </p>
          <h3>2. Is this unusual <i>for you</i>?</h3>
          <p>
            Astronauts are not average people. Say your resting heart rate is 67 this morning. For most adults that is perfectly normal.
            But if your heart has sat at 58 every morning for the two weeks before launch, 67 is a real change, and Space Vigil should say so.
          </p>
          <p>
            To do that, it takes your fourteen pre-flight days and works out two things per indicator: your typical value (the median)
            and how much you normally wobble around it. A reading more than about three wobbles away is flagged even when it is inside
            the textbook range. Three days drifting in the same direction count too, because slow slides are how fatigue and illness
            usually start.
          </p>
          <p>
            That is the whole trick. Nothing is predicted, nothing is diagnosed. Each alert tells you which of the two questions
            tripped, with the actual numbers, so you can judge for yourself.
          </p>
        </section>

        <section id="colours">
          <h2>What the colours mean</h2>
          <dl className="plain-list colours">
            <dt><span className="dot green" /> Green, "normal for you"</dt>
            <dd>Inside the published range and inside your own usual spread. Carry on.</dd>
            <dt><span className="dot amber" /> Amber, "keep an eye on it"</dt>
            <dd>Unusual for you, or close to a limit, or drifting for a few days. You handle it with the checklist. It gets mentioned at the next scheduled medical conference.</dd>
            <dt><span className="dot red" /> Red, "needs action"</dt>
            <dd>Past a published limit, or a long way from your baseline, or an urgent symptom. Do the checklist now and tell the flight surgeon. The app drafts the message.</dd>
          </dl>
          <p>The little chart on each tile is your last two weeks. The faint band behind it is where you sat before launch.</p>
        </section>

        <section id="indicators">
          <h2>The 16 things it tracks</h2>
          <p>Tap any one to see how it is measured on board and where its limit comes from.</p>
          <div className="ind-list">
            {INDICATORS.map((def) => (
              <details key={def.id} className="ind">
                <summary>
                  <span className="name">{def.label}</span>
                  <span className="what">{def.what.split('. ')[0].replace(/\.$/, '')}.</span>
                </summary>
                <div className="ind-body">
                  <p>{def.what}</p>
                  <p><b>How you measure it:</b> {def.how}</p>
                  <p><b>Where the limit comes from:</b> {def.reference}<Ref ids={def.sources} /></p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section id="process">
          <h2>How we built it</h2>
          <p>
            We started with people, not data. Three of them, in fact: the astronaut, who is busy and tired and sometimes tempted to
            shrug off a symptom; the crew medical officer, a crewmate with extra training but not a doctor; and the flight surgeon on
            Earth, who reads everything hours late. Then we wrote the problem in one sentence: astronauts on long missions need a quick
            way to understand their own health and know what to do about it, because they cannot always reach doctors in time.
          </p>
          <p>
            We gave ourselves one test to pass: can someone understand an alert and know the next step in under 30 seconds? Every design
            choice since has been checked against that. It is why the tiles use full names instead of abbreviations, why the status
            words are "normal for you" rather than "nominal", and why every alert ends with a "do" line.
          </p>
          <p>
            Ideas that did not make the cut for now: voice summaries, an AI assistant explaining alerts, a private mood journal. Good
            ideas, hard to validate in a weekend. The ones that did: the personal baseline, self-explaining alerts, the offline Mars
            mode, the routine prompts, the camera pulse, and the one-message downlink to the surgeon.
          </p>
          <p>
            Testing was task-based. "You just got an alert. Why, and what do you do?" On a laptop, on a phone, with the keyboard only.
            The copy changed after every round. The full write-up is in the project's <code>docs/DESIGN_PROCESS.md</code>.
          </p>
        </section>

        <section id="sources">
          <h2>Sources</h2>
          <p>Every limit and claim in the app points to one of these. Agency documents, clinical bodies and peer-reviewed papers only.</p>
          <ol className="src">
            {SOURCES.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>. {s.org}. <span className="muted">{s.note}</span>
              </li>
            ))}
          </ol>
          <p className="small">
            A few conventions are ours and are labelled as such wherever they appear: body mass 5% below baseline, 50% and 80% of the
            career radiation limit, and the three-day persistence windows.
          </p>
        </section>

        <Disclaimer />
      </article>
    </div>
  );
}
