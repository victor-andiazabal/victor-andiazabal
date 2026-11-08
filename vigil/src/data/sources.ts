/**
 * Every threshold, number or claim shown in the app points to one of these sources.
 * Only official agency documents and peer-reviewed papers are listed.
 */
export interface Source {
  id: string;
  org: string;
  title: string;
  url: string;
  note: string;
}

export const SOURCES: Source[] = [
  {
    id: 'hrp-hazards',
    org: 'NASA Human Research Program',
    title: 'The 5 Hazards of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/hazards/',
    note: 'Space radiation, isolation and confinement, distance from Earth, gravity fields, hostile/closed environments.',
  },
  {
    id: 'hfbp',
    org: 'NASA Human Research Program',
    title: 'About Human Factors and Behavioral Performance',
    url: 'https://www.nasa.gov/reference/about-human-factors-and-behavioral-performance/',
    note: 'Research on sleep, cognition, team cohesion and behavioral health in long-duration spaceflight.',
  },
  {
    id: 'ochmo-radiation',
    org: 'NASA Office of the Chief Health and Medical Officer',
    title: 'Radiation Protection Technical Brief (NASA-STD-3001)',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf',
    note: 'Career effective-dose limit of 600 mSv for all astronauts; 250 mSv short-term limit for a solar particle event.',
  },
  {
    id: 'rad-cruise',
    org: 'Zeitlin et al., Science 340 (2013), NASA MSL/RAD',
    title: 'Measurements of energetic particle radiation in transit to Mars on the Mars Science Laboratory',
    url: 'https://doi.org/10.1126/science.1235989',
    note: 'Dose-equivalent rate of about 1.84 mSv/day during the Earth-to-Mars cruise.',
  },
  {
    id: 'rad-surface',
    org: 'Hassler et al., Science 343 (2014), NASA MSL/RAD',
    title: "Mars' surface radiation environment measured with the Curiosity rover",
    url: 'https://doi.org/10.1126/science.1244797',
    note: 'Dose-equivalent rate of about 0.64 mSv/day on the Martian surface.',
  },
  {
    id: 'barger-2014',
    org: 'Barger et al., The Lancet Neurology 13 (2014)',
    title: 'Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight',
    url: 'https://doi.org/10.1016/S1474-4422(14)70122-X',
    note: 'ISS crews were scheduled 8.5 h of sleep but averaged about 6.1 h; sleep of 7 h or more was reached only 24% of nights.',
  },
  {
    id: 'pvt-b',
    org: 'Basner, Mollicone and Dinges, Acta Astronautica 69 (2011)',
    title: 'Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation',
    url: 'https://doi.org/10.1016/j.actaastro.2011.07.015',
    note: '3-minute PVT-B with a 355 ms lapse threshold; basis of the ISS Reaction Self Test.',
  },
  {
    id: 'reaction-self-test',
    org: 'NASA NTRS',
    title: 'Reaction Self Test: fatigue monitoring on the International Space Station',
    url: 'https://ntrs.nasa.gov/citations/20090029851',
    note: 'ISS crews run a brief reaction-time test on a laptop to track alertness, especially around sleep shifts.',
  },
  {
    id: 'aha-bp',
    org: 'American College of Cardiology / American Heart Association (2017 guideline)',
    title: 'High blood pressure categories',
    url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings',
    note: 'Normal <120/80; elevated 120-129/<80; stage 1 130-139 or 80-89; stage 2 >=140 or >=90; crisis >180 and/or >120.',
  },
  {
    id: 'aha-hr',
    org: 'American Heart Association',
    title: 'All about heart rate (pulse)',
    url: 'https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse',
    note: 'Typical adult resting heart rate 60-100 bpm; well-trained people can be lower.',
  },
  {
    id: 'ada-glucose',
    org: 'American Diabetes Association, Standards of Care in Diabetes',
    title: 'Classification and diagnosis of diabetes; hypoglycemia levels',
    url: 'https://diabetesjournals.org/care/issue/48/Supplement_1',
    note: 'Fasting glucose <100 mg/dL normal, 100-125 prediabetes, >=126 diabetes range; random >=200 with symptoms; hypoglycemia level 1 <70, level 2 <54 mg/dL.',
  },
  {
    id: 'cdc-fever',
    org: 'U.S. Centers for Disease Control and Prevention',
    title: 'Definition of fever',
    url: 'https://www.cdc.gov/quarantine/air/reporting-deaths-illness/definitions-symptoms-reportable-illnesses.html',
    note: 'Fever is a measured temperature of 100.4 F (38 C) or higher.',
  },
  {
    id: 'mayo-spo2',
    org: 'Mayo Clinic',
    title: 'Hypoxemia (low blood oxygen)',
    url: 'https://www.mayoclinic.org/symptoms/hypoxemia/basics/definition/sym-20050930',
    note: 'Pulse-oximeter readings of 95-100% are typical; values below 90% are low.',
  },
  {
    id: 'aasm-sleep',
    org: 'American Academy of Sleep Medicine and Sleep Research Society',
    title: 'Recommended amount of sleep for a healthy adult',
    url: 'https://doi.org/10.5665/sleep.4716',
    note: 'Adults should sleep 7 or more hours per night on a regular basis.',
  },
  {
    id: 'iss-exercise',
    org: 'NASA NTRS',
    title: 'ISS exercise countermeasures: assigned versus loaded exercise time',
    url: 'https://ntrs.nasa.gov/citations/20110015001',
    note: 'About 146.8 min/day of exercise were assigned on ISS schedules; actual loaded time was much lower.',
  },
  {
    id: 'comm-delay',
    org: 'NASA Ames (NTRS)',
    title: 'Communication delays for lunar and Mars missions',
    url: 'https://ntrs.nasa.gov/citations/20240006867',
    note: 'Roughly 3-10 s one-way on the lunar surface and 4-24 min one-way for Mars.',
  },
  {
    id: 'twins',
    org: 'Garrett-Bakelman et al., Science 364 (2019), NASA Twins Study',
    title: 'The NASA Twins Study: a multidimensional analysis of a year-long human spaceflight',
    url: 'https://doi.org/10.1126/science.aau8650',
    note: 'Changes in gene expression, immune response, telomeres and cognition over a 340-day ISS mission.',
  },
  {
    id: 'osdr',
    org: 'NASA Open Science Data Repository',
    title: 'OSDR portal and Inspiration4 human datasets (OSD-569, 570, 571, 575)',
    url: 'https://osdr.nasa.gov/',
    note: 'Open biomedical datasets from spaceflight, including the first open commercial-crew human data (2024).',
  },
  {
    id: 'iss-dose',
    org: 'Shavers et al., Zeitschrift fuer Medizinische Physik 34 (2024)',
    title: 'Space agency-specific standards for crew dose and risk assessment of ionising radiation exposures for the ISS',
    url: 'https://doi.org/10.1016/j.zemedi.2023.06.005',
    note: 'ISS effective doses usually accumulate at roughly 0.2 to 0.5 mSv or more per mission day.',
  },
  {
    id: 'rppg',
    org: 'Verkruysse, Svaasand and Nelson, Optics Express 16 (2008)',
    title: 'Remote plethysmographic imaging using ambient light',
    url: 'https://doi.org/10.1364/OE.16.021434',
    note: 'Heart rate can be read from the green channel of ordinary video of skin under ambient light.',
  },
  {
    id: 'bio-monitor-csa',
    org: 'Canadian Space Agency',
    title: 'Bio-Monitor: keeping an eye on astronauts\' vital signs',
    url: 'https://www.csa-asc.gc.ca/eng/sciences/astroskin.asp',
    note: 'Smart shirt and headband on the ISS since 2019. ECG, breathing, SpO2, skin temperature, activity and a blood-pressure estimate from one garment.',
  },
  {
    id: 'bio-monitor-ntrs',
    org: 'NASA NTRS',
    title: 'Wearable biosensor monitor to support autonomous crew health and performance',
    url: 'https://ntrs.nasa.gov/api/citations/20190000238/downloads/20190000238.pdf',
    note: '30-day ground evaluation of the Astroskin system: good data quality over 24 h wear, comfortable, reliable Bluetooth link.',
  },
  {
    id: 'hexoskin-gateway',
    org: 'Hexoskin (Carre Technologies)',
    title: 'Hexoskin wins contract to bring Astroskin sensors to the Moon',
    url: 'https://hexoskin.com/blogs/news/hexoskin-wins-contract-to-bring-astroskin-sensors-to-the-moon',
    note: 'November 2024 CSA contract to adapt Astroskin for the Gateway lunar station.',
  },
  {
    id: 'resp-range',
    org: 'Cleveland Clinic',
    title: 'Vital signs: respiratory rate',
    url: 'https://my.clevelandclinic.org/health/articles/10881-vital-signs',
    note: 'Typical adult resting breathing rate 12-20 breaths per minute.',
  },
  {
    id: 'hrv-norms',
    org: 'Shaffer and Ginsberg, Frontiers in Public Health 5 (2017)',
    title: 'An overview of heart rate variability metrics and norms',
    url: 'https://doi.org/10.3389/fpubh.2017.00258',
    note: 'HRV (RMSSD) varies widely between people, so it is only meaningful against the person\'s own baseline; a sustained drop tracks fatigue and stress.',
  },
  {
    id: 'space-apps',
    org: 'NASA Space Apps Challenge 2026',
    title: 'Create Health Monitoring Software for Astronauts on Space Missions',
    url: 'https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/',
    note: 'Challenge statement this project answers.',
  },
];

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
