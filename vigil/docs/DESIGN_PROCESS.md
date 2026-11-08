# How Space Vigil was designed

We used the five stages of design thinking: empathize, define, ideate, prototype, test. It was not a straight
line. Testing sent us back to the copy and the tile layout more than once.

## 1. Empathize

Three users, with different needs:

- **The astronaut.** Busy, often short on sleep, floating while using a screen, sometimes tempted to play down
  a symptom so they do not look unfit. Cares about privacy, especially for mood.
- **The crew medical officer.** A crewmate with extra medical training, not a doctor. Needs to see the whole
  crew and know when to escalate.
- **The flight surgeon on Earth.** Reads a downlink hours later on a Mars transit. Needs the day's values and
  every flag in one message, not a chat.

Sources we drew on: astronaut memoirs and interviews (Hadfield, Kelly), NASA Human Research Program pages,
Canadian Space Agency material on the Bio-Monitor, NASA's Astroskin evaluation report, and the published ISS
sleep and reaction-test studies. We mapped a typical ISS day hour by hour to find when a health check fits:
right after waking and before the sleep period.

## 2. Define

Problem statement: *Astronauts on long missions need a quick way to understand their own health and know what
to do about it, because they cannot always reach doctors on Earth in time.*

How-might-we questions:

- How might we show complex health data in a few seconds of attention?
- How might we help astronauts act on problems without help from Earth?
- How might we protect privacy while keeping the crew safe?

Success criterion: a crew member can understand an alert and the next step in under 30 seconds.

## 3. Ideate

Ideas we generated, then sorted by impact and feasibility:

- Traffic-light dashboard against each person's own baseline (kept, core)
- Alerts that state the rule, the numbers, the source and a checklist (kept, core)
- Fully offline "Mars mode" (kept: the whole app runs on the device)
- Routine prompts and a streak (kept, light)
- Camera pulse from the phone (kept, labelled experimental)
- One packaged message to the flight surgeon (kept)
- Ground-side view for the surgeon (kept)
- Voice summaries and an AI assistant that explains alerts (parked: hard to validate in two days)
- Private mood journal only the astronaut can see (parked: notes field for now)

## 4. Prototype

Paper sketches, then this app: a clickable build on simulated sensor data with a deterministic simulator and
four scenarios. The intended live source is the Bio-Monitor (Astroskin) shirt flying on the ISS since 2019,
which covers ECG and heart rate, heart rate variability, breathing rate, SpO2, skin temperature, activity and
sleep from one garment over Bluetooth. Cuff, glucose meter and dosimeter readings are typed or imported.

## 5. Test

- Task tests: "you just got an alert; find out why and what to do" on desktop and phone.
- Keyboard-only navigation, dark and light themes, offline reload.
- A rule-by-rule test suite (34 tests) that checks every published cut-off and the scenarios.
- Each round changed the wording. Status labels went from "Nominal / Watch / Act now" to "Normal for you /
  Keep an eye on it / Needs action", and every tile gained a plain sentence about the person's own baseline.

## Where the data flows

Shirt and headband (ECG, breathing, SpO2, skin temperature, movement) → recorder clipped to the shirt →
Bluetooth to the tablet, where Space Vigil adds cuff, meter and dosimeter entries and the daily check-in →
baseline and rules run on the device → alert and checklist for the crew first, one packaged message to the
flight surgeon second.

Sources: CSA Bio-Monitor page; NASA NTRS 20190000238 (Astroskin 30-day evaluation); Hexoskin Gateway
contract announcement, November 2024. Full list in SOURCES.md.
