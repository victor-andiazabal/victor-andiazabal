# Sources

Everything VIGIL shows as a number or a claim traces to one of these. Agency documents and peer-reviewed
papers only. The same list is in `src/data/sources.ts` and in the app under Learn.

## NASA

- **NASA Human Research Program, The 5 Hazards of Human Spaceflight.** https://www.nasa.gov/hrp/hazards/
  Space radiation, isolation and confinement, distance from Earth, gravity fields, hostile/closed environments.
- **NASA Human Research Program, About Human Factors and Behavioral Performance.**
  https://www.nasa.gov/reference/about-human-factors-and-behavioral-performance/
  Sleep, cognition, team cohesion and behavioral health research for long missions.
- **NASA Office of the Chief Health and Medical Officer, Radiation Protection Technical Brief (NASA-STD-3001).**
  https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
  Career effective-dose limit of 600 mSv; 250 mSv short-term limit for a solar particle event.
- **NASA NTRS, Reaction Self Test (ISS fatigue monitoring).** https://ntrs.nasa.gov/citations/20090029851
  ISS crews run a brief reaction-time test on a laptop, especially around sleep shifts.
- **NASA NTRS, ISS exercise countermeasures: assigned versus loaded time.** https://ntrs.nasa.gov/citations/20110015001
  About 146.8 min/day of exercise assigned on ISS schedules.
- **NASA Ames (NTRS), communication delays for lunar and Mars missions.** https://ntrs.nasa.gov/citations/20240006867
  Roughly 3-10 s one way on the lunar surface; 4-24 min one way for Mars.
- **NASA Open Science Data Repository.** https://osdr.nasa.gov/
  Open biomedical spaceflight datasets, including the Inspiration4 human datasets (OSD-569, 570, 571, 575).
- **NASA Space Apps Challenge 2026, Create Health Monitoring Software for Astronauts on Space Missions.**
  https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

## Peer-reviewed

- **Zeitlin et al., Science 340 (2013).** Measurements of energetic particle radiation in transit to Mars on
  the Mars Science Laboratory. https://doi.org/10.1126/science.1235989. About 1.84 mSv/day during cruise.
- **Hassler et al., Science 343 (2014).** Mars' surface radiation environment measured with the Curiosity
  rover. https://doi.org/10.1126/science.1244797. About 0.64 mSv/day on the surface.
- **Shavers et al., Zeitschrift fuer Medizinische Physik 34 (2024).** Space agency-specific standards for crew
  dose and risk assessment of ionising radiation exposures for the ISS.
  https://doi.org/10.1016/j.zemedi.2023.06.005. ISS effective dose about 0.2-0.5 mSv or more per day.
- **Barger et al., The Lancet Neurology 13 (2014).** Prevalence of sleep deficiency and use of hypnotic drugs
  in astronauts before, during, and after spaceflight. https://doi.org/10.1016/S1474-4422(14)70122-X
  ISS crews scheduled 8.5 h, averaged about 6.1 h; 7 h or more only on 24% of nights.
- **Basner, Mollicone and Dinges, Acta Astronautica 69 (2011).** Validity and sensitivity of a brief
  psychomotor vigilance test (PVT-B) to total and partial sleep deprivation.
  https://doi.org/10.1016/j.actaastro.2011.07.015. 3-minute test, 355 ms lapse threshold.
- **Garrett-Bakelman et al., Science 364 (2019).** The NASA Twins Study.
  https://doi.org/10.1126/science.aau8650. Gene expression, immune, telomere and cognitive changes over a
  340-day mission.
- **Watson et al., Sleep 38 (2015).** Recommended amount of sleep for a healthy adult (AASM and SRS consensus).
  https://doi.org/10.5665/sleep.4716. Seven hours or more per night.

## Clinical reference ranges

- **ACC/AHA 2017 high blood pressure guideline.**
  https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings
  Normal <120/80; elevated 120-129/<80; stage 1 130-139 or 80-89; stage 2 ≥140 or ≥90; crisis >180 and/or >120.
- **American Heart Association, All about heart rate.**
  https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse
  Typical adult resting heart rate 60-100 bpm.
- **American Diabetes Association, Standards of Care in Diabetes.**
  https://diabetesjournals.org/care/issue/48/Supplement_1
  Fasting <100 normal, 100-125 prediabetes, ≥126 diabetes range; random ≥200 with symptoms; hypoglycemia
  level 1 <70, level 2 <54 mg/dL.
- **CDC, definition of fever.**
  https://www.cdc.gov/quarantine/air/reporting-deaths-illness/definitions-symptoms-reportable-illnesses.html
  Measured temperature of 100.4 °F (38 °C) or higher.
- **Mayo Clinic, Hypoxemia.** https://www.mayoclinic.org/symptoms/hypoxemia/basics/definition/sym-20050930
  Pulse-oximeter readings of 95-100% typical; below 90% low.

## Conventions that are ours, not a standard

Stated in the alert text whenever they apply:

- Body mass 5% below the pre-flight median is flagged as Watch.
- Mission dose at 50% and 80% of the 600 mSv career limit is shown as Watch and Act now.
- A robust z-score of 3 or more against the personal baseline (median and MAD) is flagged as Watch.
- Three-day persistence windows for stage 1 blood pressure, prediabetes-range glucose, mood, stress and
  symptoms.
