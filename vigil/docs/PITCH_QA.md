# Pitch notes and likely judge questions

Judging criteria: Impact, Creativity, Validity, Relevance, Presentation. Each answer below is short enough to
say in one breath.

## 60-second pitch

On the way to Mars a question to the flight surgeon takes up to 48 minutes round trip, so the crew has to
assess first and the ground confirms later. VIGIL is the tool for that first step. Every day an astronaut
logs vitals, sleep, mood and symptoms, runs a one-minute reaction test, or lets the phone camera read their
pulse. VIGIL compares each number with that person's own pre-flight baseline and with published limits from
NASA and clinical bodies, and shows one colour-coded answer. Every alert says which rule fired, the numbers,
the source and what to do, and one click packages the day for the flight surgeon. It runs offline on a
tablet and switches between station, transit, rover and base.

## Likely questions

**Is this a medical device?**
No. It is decision support. It never diagnoses; it compares numbers with published ranges and with the
person's own history, then points to a checklist and, when needed, to the flight surgeon. Operational
limits stay with the surgeon.

**Where do the thresholds come from?**
Each one is cited in the alert itself and in the Learn screen: NASA-STD-3001 for radiation (600 mSv career,
250 mSv per solar event), ACC/AHA for blood pressure, CDC for fever, ADA for glucose, Mayo Clinic for SpO2,
AASM for sleep, Basner 2011 for the reaction test. Daily dose rates are measured values from Curiosity's RAD
instrument and ISS dosimetry. The few conventions that are ours (5% mass loss, 50% and 80% of the career
limit) are labelled as ours in the alert text.

**Why a personal baseline and not just normal ranges?**
Astronauts are fit and unusual. A resting heart rate of 95 is inside the adult range and clearly wrong for
someone whose baseline is 55. Fourteen pre-flight days give a median and a robust spread; a value three
typical deviations away, or a three-day trend, is flagged even inside the population range.

**Is the data real?**
The crew data is simulated and labelled as such everywhere. No real astronaut records are used. The
simulator is deterministic (same seed, same mission) and the scenarios are built to show the rules firing.
Any real reading can be typed in, measured with the camera, or imported from a CSV.

**How does the camera pulse work?**
Twenty seconds of video, processed on the device. Fingertip over the lens uses the red channel; face mode
uses the green channel over the forehead region (Verkruysse 2008). We detrend, window and search the
42-180 bpm band for the spectral peak, and refuse to report a value when the peak is not clearly above the
band average. It is labelled experimental.

**Why a 60-second reaction test when the ISS one is 3 minutes?**
Demo length. The thresholds (355 ms lapse, 1-4 s random wait) are the PVT-B ones. Validating the short form
against the 3-minute version is on the roadmap.

**What about the communication delay?**
Each environment carries its one-way delay (NASA Ames figures). The surgeon message bundles the day's values
and every flag so one exchange is enough, and the ground view shows what the surgeon receives.

**Why no server?**
Offline is the thesis. On a 4 to 24 minute link the crew cannot depend on a round trip to a server, so every
rule runs on the device and the app works with the link down. The crew-to-ground link follows the same
store-and-forward idea that delay- and disruption-tolerant networking (DTN) uses for space links: a message is
kept, sent, and delivered when it arrives, and nothing waits for a reply. VIGIL's queue is a browser demo of
that idea, not an implementation of the DTN protocols. In the demo both windows share one browser; a real
mission would carry the same messages over the vehicle's own link.

**What would you build next?**
Bluetooth cuff and wearable input, baselines informed by NASA OSDR human datasets, sync between crew tablets
and a real ground link, and validation of the short reaction test.

**How is it built?**
React, TypeScript, Vite, Recharts. No backend. Rules are plain functions with a source id each, covered by
70 unit tests. It installs as a web app and works offline.

## Demo order (3 minutes)

1. Dashboard, Commander, day 30: red ring, five flags. Say what the ring means.
2. Click the Sleep tile: trend with baseline band, 7-hour line, scenario window.
3. Alerts: open the reaction-time checklist, show the sources, copy the surgeon message.
4. Reaction test: run 10 seconds of it, stop.
5. Settings: switch to Solar particle event, day 25. Dashboard turns red for the whole crew.
6. Body map: click the Heart, vessels and lungs region, show the indicators behind the colour and the hazards
   that affect it. (The Dashboard has a small version of the same map.)
7. Two-window comm demo: Alerts, then "Open ground console in a new window" (or open `?view=ground`).
   In the crew window press "Send today's report"; watch it travel the delay with demo time on (Mars, closest:
   4 minutes plays in 4 seconds), then arrive in the ground window. Type a reply there and watch it travel back.
   Say: the crew already acted on the checklist while the message was in flight.
8. Ground view: the crew grid and the surgeon queue. Surgeon notes typed here also appear in the crew window's Ground view, because the two windows now share saved data.
9. Phone: same app, installed, offline.
