# Space Apps project submission draft

The submission form opens Saturday November 14 at 9:00 local time and closes Sunday November 15 at 23:59
local time. Fields below follow the 2025 form; check the 2026 guide released November 13 and adjust.
The "Use of Artificial Intelligence" field is left for the team to answer.

## Project name

VIGIL

## High-level project summary

VIGIL is a browser-based health self-assessment tool for astronauts on long-duration missions. Each crew
member logs daily indicators named in the challenge (blood pressure, heart rate, glucose, temperature,
sleep, mood) plus SpO2, body mass, exercise, stress, a 60-second reaction test and radiation dose. VIGIL
compares every value with the person's own 14-day pre-flight baseline and with published cut-offs from
NASA-STD-3001, the ACC/AHA, CDC and ADA, then shows a colour-coded status and plain-language alerts. Every
alert states the rule that fired, the numbers, the source, a countermeasure checklist, and whether the
flight surgeon should be told. A one-click message bundles the day's values for a link with a 4 to 24 minute
one-way delay. It runs offline on a tablet or phone and supports station, transit, rover and base settings.
It matters because on a Mars transit the crew must assess and act first; the ground can only confirm later.

## Link to project demo

Slides: docs/DEMO_SLIDES.md (export to PDF or Google Slides before submitting).
Video script: docs/VIDEO_SCRIPT.md.

## Link to final project

Live app: https://victor-andiazabal.github.io/victor-andiazabal/
Source: https://github.com/victor-andiazabal/victor-andiazabal/tree/main/vigil

## Detailed project description

**What it does.** A daily check-in form (keyboard, touch or pre-filled from a wearable), a camera-based pulse
measurement (fingertip or face, processed on the device), a psychomotor vigilance reaction test, trend charts with the baseline band and published cut-offs, an alert list with
checklists, a body map that colours seven body systems from the rule results, a routine with timed prompts, a streak and
mission patches for habits, a ground view for the flight surgeon with a crew-to-ground message link that delivers
reports after the one-way light-time delay (demo time compresses it), CSV import for device data, a learn
section, and mission settings.

**How it works.** Pre-flight days give a median and a median absolute deviation per indicator. In-flight
values are turned into a robust z-score; values beyond about 3 typical deviations, or three-day trends, are
flagged even when inside the population range. Reference rules use published cut-offs. Rules are plain
TypeScript functions, each tied to a source id, so judges and flight surgeons can read exactly what fires.

**Benefits.** Early detection of slow drifts (sleep debt, mood, reaction time) before they become events;
consistent self-measurement through routine prompts; a single packaged message for the ground; a learning
layer so crew without medical training understand what each number means.

**Tools.** React 19, TypeScript, Vite, Recharts. No backend. GitHub Pages for hosting.

**Hopes.** A template that a flight surgeon could configure per crew member and per mission, with real
wearable input.

## NASA data and resources used

- NASA Human Research Program: the five hazards of human spaceflight and the Human Factors and Behavioral
  Performance element (framing, indicator choice).
- NASA OCHMO Radiation Protection Technical Brief, NASA-STD-3001: 600 mSv career limit, 250 mSv solar
  particle event limit.
- NASA NTRS: Reaction Self Test on ISS (basis of the reaction test); ISS exercise assigned time; NASA Ames
  communication delay figures.
- NASA MSL/RAD measurements (Zeitlin 2013, Hassler 2014): 1.84 mSv/day transit, 0.64 mSv/day Mars surface.
- NASA Open Science Data Repository: cited for future baselines; no OSDR dataset is loaded in the prototype.

## Other data and resources

ACC/AHA 2017 blood pressure guideline; American Heart Association heart rate reference; ADA Standards of
Care; CDC fever definition; Mayo Clinic SpO2 reference; AASM/SRS sleep recommendation; Barger et al. 2014
(ISS sleep); Basner, Mollicone and Dinges 2011 (PVT-B); Shavers et al. 2024 (ISS dose rate); Verkruysse et al.
2008 (camera photoplethysmography).
All crew data in the demo is simulated.

## Use of Artificial Intelligence

(Team to complete.)

## Space agency partner and other data

None beyond NASA.
