/** Checklists shown when an alert fires. Each step is practical and does not diagnose. */
export const COUNTERMEASURES: Record<string, { title: string; steps: string[]; sources: string[] }> = {
  bp: {
    title: 'Blood pressure follow-up',
    steps: [
      'Rest 5 minutes seated, feet flat, arm supported, then repeat the cuff reading.',
      'Check caffeine, pain, and whether you just exercised; note it in the log.',
      'If the repeat reading stays in the flagged range, send both readings to the flight surgeon.',
      'Crisis range with headache, chest pain, vision change or confusion: treat as a medical event and follow the crew medical checklist now.',
    ],
    sources: ['aha-bp'],
  },
  hr: {
    title: 'Resting heart rate follow-up',
    steps: [
      'Confirm you were truly at rest; retake after 5 quiet minutes.',
      'Check temperature and fluid intake: fever and dehydration both raise heart rate.',
      'Log sleep and stress for the last two days alongside the reading.',
    ],
    sources: ['aha-hr'],
  },
  spo2: {
    title: 'Low oxygen saturation',
    steps: [
      'Warm the finger, remove nail polish, hold still, retake the reading.',
      'Check cabin atmosphere readouts (O2, CO2) and report any excursion.',
      'If still below the flagged range or you feel short of breath, start the crew medical checklist and contact the flight surgeon.',
    ],
    sources: ['mayo-spo2'],
  },
  fever: {
    title: 'Fever protocol',
    steps: [
      'Retake temperature in 30 minutes, same thermometer.',
      'Log symptoms (congestion, sore throat, cough, rash, pain) and recent contacts.',
      'Increase fluid intake; use rest periods in the timeline.',
      'Report to the flight surgeon; infection in a closed cabin affects the whole crew.',
    ],
    sources: ['cdc-fever', 'hrp-hazards'],
  },
  glucoseLow: {
    title: 'Low glucose',
    steps: [
      'Take 15 g of fast carbohydrate (juice pouch or glucose tabs) and retest in 15 minutes.',
      'Do not start an EVA or vehicle operation until the repeat reading is normal.',
      'Log the event for the flight surgeon.',
    ],
    sources: ['ada-glucose'],
  },
  glucoseHigh: {
    title: 'High glucose',
    steps: [
      'Confirm the reading was fasting; non-fasting readings run higher.',
      'Review meals, hydration and exercise for the last 48 hours.',
      'Repeat tomorrow fasting; if still flagged, send the series to the flight surgeon.',
    ],
    sources: ['ada-glucose'],
  },
  sleep: {
    title: 'Sleep recovery',
    steps: [
      'Protect the full scheduled sleep period tonight; ask for lower-priority tasks to be moved.',
      'Dim lighting and screens 1 hour before sleep; avoid caffeine after mid-shift.',
      'Run the reaction test after waking to confirm alertness before critical tasks.',
      'If short sleep continues, the flight surgeon can adjust the schedule or review sleep aids.',
    ],
    sources: ['barger-2014', 'aasm-sleep', 'hfbp'],
  },
  alertness: {
    title: 'Reduced alertness',
    steps: [
      'Avoid high-risk tasks (EVA prep, docking, rover driving) until a repeat test is back to baseline.',
      'Take a 20-30 minute rest or nap if the timeline allows.',
      'Check last three nights of sleep and current workload.',
    ],
    sources: ['pvt-b', 'reaction-self-test'],
  },
  mood: {
    title: 'Behavioral health check',
    steps: [
      'Schedule a private family conference or a call with the behavioral health team.',
      'Protect sleep and exercise time, the two strongest levers you control.',
      'Use the crew journal; write what changed over the last few days.',
      'Tell the commander or crew medical officer if you would like tasks rebalanced.',
    ],
    sources: ['hfbp', 'hrp-hazards'],
  },
  radiation: {
    title: 'Elevated radiation',
    steps: [
      'Move to the designated storm shelter or most shielded location.',
      'Postpone EVA and other outside activity until the event is over.',
      'Confirm dosimeter reading with the vehicle monitor; log cumulative dose.',
      'Report to mission control; ground teams track the solar event and will clear the all-clear.',
    ],
    sources: ['ochmo-radiation', 'hrp-hazards'],
  },
  weight: {
    title: 'Body mass loss',
    steps: [
      'Review food intake in the last week; compare against the planned menu.',
      'Check hydration and any nausea or low appetite entries.',
      'Repeat the mass measurement in 3 days; share the trend with the flight surgeon.',
    ],
    sources: ['hrp-hazards'],
  },
  exercise: {
    title: 'Exercise shortfall',
    steps: [
      'Book the exercise device for the next two days and protect the slot.',
      'Resistive work first; it does the most for bone and muscle.',
      'If pain or fatigue is the reason, log it so the flight surgeon can adapt the plan.',
    ],
    sources: ['iss-exercise', 'hrp-hazards'],
  },
  redFlag: {
    title: 'Urgent symptom',
    steps: [
      'Stop current task and tell a crewmate now.',
      'Open the crew medical checklist for this symptom.',
      'Contact the flight surgeon on the emergency loop; do not wait for the next scheduled conference.',
    ],
    sources: ['hrp-hazards'],
  },
  symptoms: {
    title: 'Persistent symptoms',
    steps: [
      'Log the symptom each day with a 1-10 severity in the notes.',
      'Check whether sleep, hydration, CO2 or workload changed at the same time.',
      'Mention it at the next private medical conference.',
    ],
    sources: ['hrp-hazards'],
  },
  routine: {
    title: 'Missed check-ins',
    steps: ['Complete today\'s check-in; even a partial entry keeps the baseline useful.', 'Set the reminder time in Settings to fit your sleep schedule.'],
    sources: [],
  },
};
