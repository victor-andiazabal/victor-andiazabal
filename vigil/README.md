# VIGIL

Crew health self-assessment and decision support for long-duration space missions.

Built for the 2026 NASA Space Apps Challenge, challenge
[Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).
Team: Les Tigres de Bethesda.

**Live demo:** https://victor-andiazabal.github.io/victor-andiazabal/

## The problem

On the way to Mars the one-way signal delay reaches 24 minutes, so a crew member who feels off cannot
simply call the flight surgeon. NASA's Human Research Program lists five hazards of spaceflight: radiation,
isolation and confinement, distance from Earth, altered gravity, and a hostile closed environment. Each one
shows up first as a small shift in an everyday number: a slower reaction time, a shorter night, a few extra
beats per minute at rest. Crews need a tool that notices those shifts for them and tells them what to do.

## What VIGIL does

- **Daily check-in** for blood pressure, heart rate, SpO2, temperature, fasting glucose, body mass, sleep,
  exercise, mood, stress, symptoms and radiation dose. Keyboard, touch, or values pre-filled from a wearable.
- **Reaction self-test**: a 60-second psychomotor vigilance test, the same family of test ISS crews run as the
  Reaction Self Test, with the PVT-B lapse threshold of 355 ms.
- **Personal baseline**: 14 pre-flight days give each crew member a median and a robust spread (median
  absolute deviation) per indicator. In-flight values are judged against the person, not only the population.
- **Transparent alerts**: every alert says which rule fired, with the numbers, the published source, and a
  checklist of what to do. Three levels: Nominal, Watch, Act now. Alerts that need the ground say so.
- **Flight surgeon message**: one copy-paste summary of the day's values and flags, built for a link where a
  reply takes up to 48 minutes round trip.
- **Trends**: every indicator over the mission with the baseline band, launch marker, scenario window and
  published cut-offs drawn on the chart. Compare the whole crew with one checkbox.
- **Routine and streak**: timed prompts for the day (reaction test after waking, vitals, exercise block,
  social time, lights-down), a check-in streak, and a progress bar.
- **Learn**: what each indicator means, how to measure it on board, and every source used.
- **Four environments**: space station, deep-space transit, pressurized rover, planetary base. Each sets the
  comm delay and the expected daily radiation dose from measured values.
- **Four demo scenarios**: nominal, solar particle event, sleep debt with slowed reactions, early infection.
- Runs fully offline in the browser. Data stays on the device; export JSON or CSV at any time.

## Where the numbers come from

Every threshold is either a published cut-off or a comparison with the crew member's own baseline, and the
alert says which. The sources are listed in [docs/SOURCES.md](docs/SOURCES.md) and inside the app under Learn.
Highlights:

| Rule | Value | Source |
| --- | --- | --- |
| Blood pressure categories | 130/80 stage 1, 140/90 stage 2, >180/120 crisis | ACC/AHA 2017 guideline |
| Fever | 38.0 °C | CDC |
| SpO2 | below 95% watch, below 90% act | Mayo Clinic |
| Fasting glucose | <70 hypoglycemia, 100-125 prediabetes range, ≥126 diabetes range | ADA Standards of Care |
| Sleep | adults need ≥7 h; ISS crews scheduled 8.5 h, average 6.1 h | AASM; Barger et al. 2014 |
| Reaction test | 3-minute PVT-B, lapse ≥355 ms | Basner, Mollicone, Dinges 2011; NASA NTRS |
| Radiation | 600 mSv career limit, 250 mSv per solar particle event | NASA OCHMO, NASA-STD-3001 |
| Daily dose | 1.84 mSv/day in transit, 0.64 mSv/day on Mars, 0.2-0.5 mSv/day on ISS | MSL/RAD (Zeitlin 2013, Hassler 2014); Shavers 2024 |
| Exercise | about 147 min/day assigned on ISS | NASA NTRS |
| Comm delay | 3-10 s Moon, 4-24 min Mars | NASA Ames |

All crew data in the demo is simulated and labelled as such. No real astronaut records are used.

## Run it

```bash
cd vigil
npm install
npm run dev
```

Tests: `npm test` (vitest, covers the statistics, the simulator and every alert rule at its cited cut-off).

Production build: `npm run build`, output in `dist/`. The GitHub Actions workflow in
`.github/workflows/pages.yml` builds and deploys to GitHub Pages on every push to `main`.

## Stack

React 19, TypeScript, Vite, Recharts. No backend, no accounts, no network calls after load.

## Layout

```
vigil/
  src/data/        indicators, crew roster, scenarios, countermeasure checklists, sources
  src/lib/         simulator, baseline statistics, rule engine, storage
  src/components/  dashboard, check-in, reaction test, trends, alerts, routine, learn, settings
  src/lib/__tests__ unit tests for the statistics, simulator and rules
  docs/            sources, demo deck (pptx), slide outline, video script, submission draft
```

## Limits

VIGIL is a decision-support prototype, not a medical device. It does not diagnose. The published ranges are
general adult references; operational limits on a real mission are set by the flight surgeon. The 60-second
reaction test is a shortened form of the validated 3-minute PVT-B.
