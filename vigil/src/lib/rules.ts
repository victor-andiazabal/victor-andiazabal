import { ENVIRONMENTS, kssAnchor, symptomById } from '../data/indicators';
import { baselineOf, consecutive, robustZ, round, seriesFor, slope, type Baseline } from './analytics';
import type { CrewMember, DayRecord, Finding, IndicatorId, Level, MissionSettings } from './types';

const LEVEL_RANK: Record<Level, number> = { green: 0, amber: 1, red: 2 };

export function maxLevel(levels: Level[]): Level {
  return levels.reduce<Level>((m, l) => (LEVEL_RANK[l] > LEVEL_RANK[m] ? l : m), 'green');
}

export interface Evaluation {
  crewId: string;
  day: number;
  record: DayRecord | null;
  findings: Finding[];
  overall: Level;
  notifySurgeon: boolean;
  /** Per-indicator status for the dashboard tiles. */
  byIndicator: Record<IndicatorId, { level: Level; z: number | null; baseline: Baseline | null; value: number | null }>;
  cumulativeDoseMsv: number;
  missedCheckins: number;
}

type Ctx = {
  crew: CrewMember;
  settings: MissionSettings;
  rec: DayRecord;
  baselines: Partial<Record<IndicatorId, Baseline>>;
  flight: DayRecord[];
  findings: Finding[];
};

/** Which countermeasure checklist goes with each rule key. Kept next to the rules so a renamed key is caught here. */
const CHECKLIST: Record<string, string> = {
  'bp-crisis': 'bp', 'bp-stage2': 'bp', 'bp-stage1': 'bp', 'bp-low': 'bp',
  'hr-high': 'hr', 'hr-above': 'hr', 'hr-baseline': 'hr',
  'spo2-low': 'spo2', 'spo2-border': 'spo2',
  'resp-red': 'spo2', 'resp-amber': 'spo2', 'hrv-low': 'sleep',
  'temp-high': 'fever', 'temp-fever': 'fever', 'temp-low': 'fever',
  'glu-low2': 'glucoseLow', 'glu-low1': 'glucoseLow', 'glu-high2': 'glucoseHigh', 'glu-high1': 'glucoseHigh', 'glu-pre': 'glucoseHigh',
  'sleep-red': 'sleep', 'sleep-amber': 'sleep',
  'pvt-red': 'alertness', 'pvt-amber': 'alertness',
  'kss-high': 'alertness', 'kss-mismatch': 'alertness',
  'mood-low': 'mood', 'stress-high': 'mood',
  'rad-red': 'radiation', 'rad-amber': 'radiation', 'rad-career': 'radiation',
  'weight-loss': 'weight', 'exercise-low': 'exercise',
  'symptom-red': 'redFlag', 'symptom-persist': 'symptoms', 'symptom-cluster': 'symptoms',
  routine: 'routine',
};

function add(ctx: Ctx, key: string, f: Omit<Finding, 'id' | 'crewId' | 'day' | 'checklist'>) {
  ctx.findings.push({ id: `${ctx.crew.id}:${ctx.rec.day}:${key}`, crewId: ctx.crew.id, day: ctx.rec.day, checklist: CHECKLIST[key], ...f });
}

const v = (ctx: Ctx, id: IndicatorId): number | null => {
  const x = ctx.rec.values[id];
  return Number.isFinite(x) ? (x as number) : null;
};

/** Reference-range rules use published cut-offs. Baseline rules compare with the person's own pre-flight history. */
function ruleBloodPressure(ctx: Ctx) {
  const s = v(ctx, 'bpSys');
  const d = v(ctx, 'bpDia');
  if (s === null || d === null) return;
  if (s > 180 || d > 120) {
    add(ctx, 'bp-crisis', {
      indicator: 'bpSys', level: 'red', basis: 'reference',
      title: 'Blood pressure in crisis range',
      reason: `${s}/${d} mmHg. ACC/AHA defines a hypertensive crisis as above 180 systolic and/or above 120 diastolic.`,
      action: 'Rest, repeat in 5 minutes, and contact the flight surgeon now. Chest pain, vision change or confusion with this reading means start the medical checklist immediately.',
      notifySurgeon: true, sources: ['aha-bp'],
    });
    return;
  }
  if (s >= 140 || d >= 90) {
    add(ctx, 'bp-stage2', {
      indicator: 'bpSys', level: 'amber', basis: 'reference',
      title: 'Blood pressure in stage 2 range',
      reason: `${s}/${d} mmHg. Stage 2 hypertension is 140 or higher systolic, or 90 or higher diastolic (ACC/AHA 2017).`,
      action: 'Repeat the reading seated after 5 minutes of rest; send both readings to the flight surgeon at the next conference.',
      notifySurgeon: true, sources: ['aha-bp'],
    });
    return;
  }
  const sysSeries = seriesFor(ctx.flight, 'bpSys');
  const diaSeries = seriesFor(ctx.flight, 'bpDia');
  const stage1Days = Math.min(
    consecutive(sysSeries, (x) => x >= 130),
    3,
  );
  const stage1DiaDays = consecutive(diaSeries, (x) => x >= 80);
  if ((s >= 130 || d >= 80) && (stage1Days >= 3 || stage1DiaDays >= 3)) {
    add(ctx, 'bp-stage1', {
      indicator: 'bpSys', level: 'amber', basis: 'reference',
      title: 'Blood pressure in stage 1 range for 3 days',
      reason: `${s}/${d} mmHg today, and the stage 1 range (130-139 or 80-89) has held for three consecutive readings.`,
      action: 'Keep daily readings; review salt, sleep and workload; mention it at the next medical conference.',
      notifySurgeon: false, sources: ['aha-bp'],
    });
  }
  if (s < 90) {
    add(ctx, 'bp-low', {
      indicator: 'bpSys', level: 'amber', basis: 'baseline',
      title: 'Low systolic pressure',
      reason: `${s}/${d} mmHg, well below your baseline of ${round(ctx.baselines.bpSys?.median ?? 0, 0)} mmHg.`,
      action: 'Check hydration and any dizziness; sit before standing; retake in 10 minutes.',
      notifySurgeon: false, sources: ['aha-bp'],
    });
  }
}

function ruleHeartRate(ctx: Ctx) {
  const hr = v(ctx, 'hr');
  const b = ctx.baselines.hr;
  if (hr === null) return;
  if (hr > 120) {
    add(ctx, 'hr-high', {
      indicator: 'hr', level: 'red', basis: 'reference',
      title: 'Resting heart rate very high',
      reason: `${hr} bpm at rest, far above the typical adult resting range of 60-100 bpm.`,
      action: 'Confirm you were at rest, retake, check temperature and fluids, and contact the flight surgeon.',
      notifySurgeon: true, sources: ['aha-hr'],
    });
    return;
  }
  if (hr > 100) {
    add(ctx, 'hr-above', {
      indicator: 'hr', level: 'amber', basis: 'reference',
      title: 'Resting heart rate above 100',
      reason: `${hr} bpm at rest. The typical adult range is 60-100 bpm.`,
      action: 'Retake after 5 quiet minutes; log temperature, sleep and stress with it.',
      notifySurgeon: false, sources: ['aha-hr'],
    });
    return;
  }
  if (b) {
    const z = robustZ(hr, b);
    if (z >= 3) {
      add(ctx, 'hr-baseline', {
        indicator: 'hr', level: 'amber', basis: 'baseline',
        title: 'Resting heart rate above your usual',
        reason: `${hr} bpm versus your pre-flight median of ${round(b.median, 0)} bpm (about ${round(z, 1)} typical deviations higher).`,
        action: 'Within the normal population range, but unusual for you. Check sleep, fever and hydration.',
        notifySurgeon: false, sources: ['aha-hr'],
      });
    }
  }
}

function ruleSpO2(ctx: Ctx) {
  const x = v(ctx, 'spo2');
  if (x === null) return;
  if (x < 90) {
    add(ctx, 'spo2-low', {
      indicator: 'spo2', level: 'red', basis: 'reference',
      title: 'Oxygen saturation below 90%',
      reason: `SpO2 ${x}%. Readings below 90% are considered low.`,
      action: 'Retake with a warm, still finger. Check cabin O2 and CO2. If confirmed, start the medical checklist and call the flight surgeon.',
      notifySurgeon: true, sources: ['mayo-spo2'],
    });
  } else if (x < 95) {
    add(ctx, 'spo2-border', {
      indicator: 'spo2', level: 'amber', basis: 'reference',
      title: 'Oxygen saturation below the typical range',
      reason: `SpO2 ${x}%. Typical readings are 95-100%.`,
      action: 'Retake; if it stays below 95%, note symptoms and report it.',
      notifySurgeon: false, sources: ['mayo-spo2'],
    });
  }
}

function ruleResp(ctx: Ctx) {
  const r = v(ctx, 'resp');
  if (r === null) return;
  if (r > 30 || r < 8) {
    add(ctx, 'resp-red', {
      indicator: 'resp', level: 'red', basis: 'reference',
      title: r > 30 ? 'Breathing very fast at rest' : 'Breathing very slow at rest',
      reason: `${r} breaths per minute at rest. The typical adult range is 12-20.`,
      action: 'Confirm the shirt is seated properly and you were at rest. Check SpO2, temperature and cabin CO2, then contact the flight surgeon.',
      notifySurgeon: true, sources: ['resp-range', 'bio-monitor-csa'],
    });
  } else if (r > 20) {
    add(ctx, 'resp-amber', {
      indicator: 'resp', level: 'amber', basis: 'reference',
      title: 'Breathing faster than the typical range',
      reason: `${r} breaths per minute at rest; the typical adult range is 12-20.`,
      action: 'Sit quietly for five minutes and recheck. Note fever, anxiety, pain or a stuffy cabin.',
      notifySurgeon: false, sources: ['resp-range'],
    });
  }
}

function ruleHrv(ctx: Ctx) {
  const h = v(ctx, 'hrv');
  const b = ctx.baselines.hrv;
  if (h === null || !b) return;
  const drop = (b.median - h) / b.median;
  const series = seriesFor(ctx.flight, 'hrv');
  const lowDays = consecutive(series, (x) => (b.median - x) / b.median >= 0.25);
  if (drop >= 0.25 && lowDays >= 3) {
    add(ctx, 'hrv-low', {
      indicator: 'hrv', level: 'amber', basis: 'baseline',
      title: 'Heart rate variability down for several nights',
      reason: `${Math.round(h)} ms versus your usual ${Math.round(b.median)} ms, down ${Math.round(drop * 100)}% and low for ${lowDays} nights running. HRV falls with fatigue, illness and stress.`,
      action: 'Treat it as an early warning: protect sleep, ease the training load for a day, and watch temperature and mood.',
      notifySurgeon: false, sources: ['hrv-norms', 'bio-monitor-csa'],
    });
  }
}

function ruleTemp(ctx: Ctx) {
  const t = v(ctx, 'temp');
  if (t === null) return;
  if (t >= 39.4) {
    add(ctx, 'temp-high', {
      indicator: 'temp', level: 'red', basis: 'reference',
      title: 'High fever',
      reason: `${t.toFixed(1)} °C. Fever is 38.0 °C or higher; this is well above that line.`,
      action: 'Start the fever protocol, isolate as far as the cabin allows, and contact the flight surgeon now.',
      notifySurgeon: true, sources: ['cdc-fever'],
    });
  } else if (t >= 38.0) {
    add(ctx, 'temp-fever', {
      indicator: 'temp', level: 'amber', basis: 'reference',
      title: 'Fever',
      reason: `${t.toFixed(1)} °C. The CDC defines fever as 38.0 °C (100.4 °F) or higher.`,
      action: 'Retake in 30 minutes, log symptoms, increase fluids, and report to the flight surgeon; infection in a closed cabin affects the whole crew.',
      notifySurgeon: true, sources: ['cdc-fever', 'hrp-hazards'],
    });
  } else if (t < 35.0) {
    add(ctx, 'temp-low', {
      indicator: 'temp', level: 'amber', basis: 'reference',
      title: 'Low body temperature reading',
      reason: `${t.toFixed(1)} °C is unusually low for an oral reading.`,
      action: 'Retake with a different thermometer; a reading this low is usually a measurement problem.',
      notifySurgeon: false, sources: ['cdc-fever'],
    });
  }
}

function ruleGlucose(ctx: Ctx) {
  const g = v(ctx, 'glucose');
  if (g === null) return;
  if (g < 54) {
    add(ctx, 'glu-low2', {
      indicator: 'glucose', level: 'red', basis: 'reference',
      title: 'Glucose below 54 mg/dL',
      reason: `${g} mg/dL. The ADA calls readings below 54 mg/dL level 2 hypoglycemia.`,
      action: 'Take 15 g of fast carbohydrate now, retest in 15 minutes, and do not start any critical task until normal. Tell the crew medical officer.',
      notifySurgeon: true, sources: ['ada-glucose'],
    });
  } else if (g < 70) {
    add(ctx, 'glu-low1', {
      indicator: 'glucose', level: 'amber', basis: 'reference',
      title: 'Glucose below 70 mg/dL',
      reason: `${g} mg/dL. Readings below 70 mg/dL are level 1 hypoglycemia (ADA).`,
      action: 'Eat something with 15 g of carbohydrate and retest in 15 minutes.',
      notifySurgeon: false, sources: ['ada-glucose'],
    });
  } else if (g >= 200) {
    add(ctx, 'glu-high2', {
      indicator: 'glucose', level: 'red', basis: 'reference',
      title: 'Glucose 200 mg/dL or higher',
      reason: `${g} mg/dL. A reading of 200 or more is a diabetes-range value in ADA criteria.`,
      action: 'Confirm the meter and fasting state, retest, and report to the flight surgeon.',
      notifySurgeon: true, sources: ['ada-glucose'],
    });
  } else if (g >= 126) {
    add(ctx, 'glu-high1', {
      indicator: 'glucose', level: 'amber', basis: 'reference',
      title: 'Fasting glucose 126 mg/dL or higher',
      reason: `${g} mg/dL fasting is in the ADA diabetes range.`,
      action: 'Confirm it was a fasting reading; repeat tomorrow and send the series to the flight surgeon if it holds.',
      notifySurgeon: true, sources: ['ada-glucose'],
    });
  } else if (g >= 100) {
    const days = consecutive(seriesFor(ctx.flight, 'glucose'), (x) => x >= 100);
    if (days >= 3) {
      add(ctx, 'glu-pre', {
        indicator: 'glucose', level: 'amber', basis: 'reference',
        title: 'Fasting glucose 100-125 for 3 days',
        reason: `${g} mg/dL today, in the ADA prediabetes range, for ${days} days running.`,
        action: 'Review meals and exercise; mention at the next medical conference.',
        notifySurgeon: false, sources: ['ada-glucose'],
      });
    }
  }
}

function ruleSleep(ctx: Ctx) {
  const s = v(ctx, 'sleep');
  if (s === null) return;
  const series = seriesFor(ctx.flight, 'sleep');
  const under6 = consecutive(series, (x) => x < 6);
  const under5 = consecutive(series, (x) => x < 5);
  if (under5 >= 3 || s < 4) {
    add(ctx, 'sleep-red', {
      indicator: 'sleep', level: 'red', basis: 'reference',
      title: 'Severe short sleep',
      reason: `${s.toFixed(1)} h last night${under5 >= 3 ? `, and under 5 h for ${under5} nights in a row` : ''}. Adults need 7 h or more; ISS crews already average only about 6 h.`,
      action: 'Protect the full sleep period tonight, run the reaction test before any critical task, and ask the flight surgeon to review the schedule.',
      notifySurgeon: true, sources: ['aasm-sleep', 'barger-2014'],
    });
  } else if (under6 >= 3) {
    add(ctx, 'sleep-amber', {
      indicator: 'sleep', level: 'amber', basis: 'reference',
      title: 'Under 6 hours of sleep for 3 nights',
      reason: `${s.toFixed(1)} h last night and under 6 h for ${under6} consecutive nights. The schedule allows 8.5 h.`,
      action: 'Move low-priority tasks, dim lights an hour before sleep, and run the reaction test after waking.',
      notifySurgeon: false, sources: ['barger-2014', 'aasm-sleep'],
    });
  }
}

function rulePVT(ctx: Ctx) {
  const rt = v(ctx, 'pvtRt');
  const lapses = v(ctx, 'pvtLapses');
  const b = ctx.baselines.pvtRt;
  const bl = ctx.baselines.pvtLapses;
  if (rt === null || !b) return;
  const pct = ((rt - b.median) / b.median) * 100;
  const lapseExcess = lapses !== null && bl ? lapses - bl.median : 0;
  if (pct >= 35 || lapseExcess >= 6) {
    add(ctx, 'pvt-red', {
      indicator: 'pvtRt', level: 'red', basis: 'baseline',
      title: 'Reaction time well below your baseline',
      reason: `Mean ${Math.round(rt)} ms, ${Math.round(pct)}% slower than your pre-flight median of ${Math.round(b.median)} ms${lapses !== null ? `, with ${lapses} lapses (355 ms or slower)` : ''}.`,
      action: 'Avoid EVA prep, docking or driving until a repeat test is back near baseline. Rest if the timeline allows.',
      notifySurgeon: true, sources: ['pvt-b', 'reaction-self-test'],
    });
  } else if (pct >= 15 || lapseExcess >= 3) {
    add(ctx, 'pvt-amber', {
      indicator: 'pvtRt', level: 'amber', basis: 'baseline',
      title: 'Reaction time slower than usual',
      reason: `Mean ${Math.round(rt)} ms, ${Math.round(pct)}% slower than your pre-flight median of ${Math.round(b.median)} ms${lapses !== null ? `, ${lapses} lapses` : ''}.`,
      action: 'Check the last three nights of sleep; retest after a rest period before high-risk tasks.',
      notifySurgeon: false, sources: ['pvt-b', 'reaction-self-test'],
    });
  }
}

/** KSS 7 is "sleepy, but no effort to keep awake" on the Karolinska scale (Kaida 2006). */
export const KSS_SLEEPY = 7;
/** At or below this rating the person reports feeling at least somewhat alert. */
export const KSS_ALERT_MAX = 4;

/** Runs after rulePVT: the mismatch rule reads today's reaction-test finding. */
function ruleSleepiness(ctx: Ctx) {
  const k = v(ctx, 'kss');
  if (k === null) return;
  if (k >= KSS_SLEEPY) {
    add(ctx, 'kss-high', {
      indicator: 'kss', level: 'amber', basis: 'reference',
      title: 'Sleepy today',
      reason: `You rated ${k}/9 on the Karolinska scale (${kssAnchor(k)}). Ratings of 7 or more go with slower reaction times and more lapses (Kaida 2006).`,
      action: 'Protect the next sleep period, avoid critical tasks until a reaction test is back near your baseline, and take a short nap if the timeline allows.',
      notifySurgeon: false, sources: ['kaida-2006'],
    });
    return;
  }
  const pvt = ctx.findings.find((f) => f.indicator === 'pvtRt' && f.day === ctx.rec.day && (f.level === 'amber' || f.level === 'red'));
  const rt = v(ctx, 'pvtRt');
  const b = ctx.baselines.pvtRt;
  if (k <= KSS_ALERT_MAX && pvt && rt !== null && b) {
    const pct = Math.round(((rt - b.median) / b.median) * 100);
    add(ctx, 'kss-mismatch', {
      indicator: 'kss', level: 'amber', basis: 'baseline',
      title: 'You feel alert but your reaction test is slow',
      reason: `You rated ${k}/9 (${kssAnchor(k)}), but your reaction test averaged ${Math.round(rt)} ms, ${pct}% slower than your pre-flight median of ${Math.round(b.median)} ms. In ISS astronauts, self-rated alertness did not track measured performance.`,
      action: 'Trust the test, not the feeling, for critical tasks today: hold EVA prep, docking or driving until a repeat test is back near your baseline.',
      notifySurgeon: false, sources: ['dev-2024', 'pvt-b'],
    });
  }
}

function ruleMood(ctx: Ctx) {
  const m = v(ctx, 'mood');
  const st = v(ctx, 'stress');
  const bm = ctx.baselines.mood;
  const bs = ctx.baselines.stress;
  const moodSeries = seriesFor(ctx.flight, 'mood');
  const stressSeries = seriesFor(ctx.flight, 'stress');
  if (m !== null && bm) {
    const lowDays = consecutive(moodSeries, (x) => x <= bm.median - 1.5);
    if (lowDays >= 3 || (m <= 1 && lowDays >= 2)) {
      add(ctx, 'mood-low', {
        indicator: 'mood', level: 'amber', basis: 'baseline',
        title: 'Mood below your usual for several days',
        reason: `Mood ${m}/5 today and at least 1.5 points below your baseline of ${bm.median}/5 for ${lowDays} days. Isolation and confinement are a known spaceflight hazard.`,
        action: 'Book a private family conference or behavioral health call; protect sleep and exercise; tell the crew medical officer if you want tasks rebalanced.',
        notifySurgeon: lowDays >= 4, sources: ['hrp-hazards', 'hfbp'],
      });
    }
  }
  if (st !== null && bs) {
    const highDays = consecutive(stressSeries, (x) => x >= bs.median + 1.5);
    if (highDays >= 3) {
      add(ctx, 'stress-high', {
        indicator: 'stress', level: 'amber', basis: 'baseline',
        title: 'Stress above your usual for several days',
        reason: `Stress ${st}/5 today and at least 1.5 points above your baseline of ${bs.median}/5 for ${highDays} days.`,
        action: 'Review workload with the commander; use the scheduled off-duty time; note what changed in the journal.',
        notifySurgeon: false, sources: ['hfbp'],
      });
    }
  }
}

function ruleRadiation(ctx: Ctx, cumulative: number) {
  const d = v(ctx, 'radDose');
  if (d === null) return;
  const env = ENVIRONMENTS[ctx.settings.environment];
  const ratio = d / env.dailyDoseMsv;
  if (ratio >= 10) {
    add(ctx, 'rad-red', {
      indicator: 'radDose', level: 'red', basis: 'reference',
      title: 'Radiation dose spike',
      reason: `${d.toFixed(2)} mSv today, about ${Math.round(ratio)} times the usual rate for this environment (${env.dailyDoseMsv} mSv/day). NASA limits a single solar particle event to 250 mSv.`,
      action: 'Move to the storm shelter, stop EVA, confirm with the vehicle monitor, and report to mission control.',
      notifySurgeon: true, sources: ['ochmo-radiation', 'rad-cruise', 'rad-surface'],
    });
  } else if (ratio >= 3) {
    add(ctx, 'rad-amber', {
      indicator: 'radDose', level: 'amber', basis: 'reference',
      title: 'Radiation dose above the usual rate',
      reason: `${d.toFixed(2)} mSv today versus about ${env.dailyDoseMsv} mSv/day expected here.`,
      action: 'Check the space-weather notice, postpone non-essential EVA, and keep the dosimeter on.',
      notifySurgeon: false, sources: ['ochmo-radiation'],
    });
  }
  // Progress toward the career limit. The 50% and 80% markers are this tool's convention, not NASA rules.
  const pctCareer = (cumulative / 600) * 100;
  if (pctCareer >= 80) {
    add(ctx, 'rad-career', {
      indicator: 'radDose', level: 'red', basis: 'reference',
      title: 'Mission dose nearing the career limit',
      reason: `${cumulative.toFixed(0)} mSv accumulated this mission, ${Math.round(pctCareer)}% of the 600 mSv career limit.`,
      action: 'Mission control and the flight surgeon manage exposure planning; this entry only tracks the total.',
      notifySurgeon: true, sources: ['ochmo-radiation'],
    });
  } else if (pctCareer >= 50) {
    add(ctx, 'rad-career', {
      indicator: 'radDose', level: 'amber', basis: 'reference',
      title: 'Mission dose past half the career limit',
      reason: `${cumulative.toFixed(0)} mSv accumulated this mission, ${Math.round(pctCareer)}% of the 600 mSv career limit.`,
      action: 'No action for you; the value is shared with the flight surgeon for exposure planning.',
      notifySurgeon: false, sources: ['ochmo-radiation'],
    });
  }
}

function ruleWeight(ctx: Ctx) {
  const series = seriesFor(ctx.flight, 'weight');
  const b = ctx.baselines.weight;
  const latest = series[series.length - 1];
  if (!latest || !b) return;
  const pct = ((latest.value - b.median) / b.median) * 100;
  if (pct <= -5) {
    add(ctx, 'weight-loss', {
      indicator: 'weight', level: 'amber', basis: 'baseline',
      title: 'Body mass down 5% or more',
      reason: `${latest.value.toFixed(1)} kg on day ${latest.day}, ${Math.abs(pct).toFixed(1)}% below your pre-flight median of ${b.median.toFixed(1)} kg. The 5% marker is this tool's convention for a noticeable loss.`,
      action: 'Review intake against the planned menu, log appetite and nausea, and share the trend with the flight surgeon.',
      notifySurgeon: false, sources: ['hrp-hazards'],
    });
  }
}

function ruleExercise(ctx: Ctx) {
  const series = seriesFor(ctx.flight, 'exercise').slice(-7);
  if (series.length < 5) return;
  const avg = series.reduce((s, p) => s + p.value, 0) / series.length;
  if (avg < 60) {
    add(ctx, 'exercise-low', {
      indicator: 'exercise', level: 'amber', basis: 'reference',
      title: 'Exercise well below the schedule this week',
      reason: `Average ${Math.round(avg)} min/day over the last ${series.length} days. ISS schedules assign about 147 min/day because exercise is the main countermeasure for bone and muscle loss.`,
      action: 'Book the device for the next two days; if pain or fatigue is the reason, log it for the flight surgeon.',
      notifySurgeon: false, sources: ['iss-exercise', 'hrp-hazards'],
    });
  }
}

function ruleSymptoms(ctx: Ctx) {
  const today = ctx.rec.symptoms;
  const red = today.filter((s) => symptomById(s)?.redFlag);
  if (red.length) {
    add(ctx, 'symptom-red', {
      indicator: 'symptoms', level: 'red', basis: 'symptom',
      title: 'Urgent symptom reported',
      reason: `You reported: ${red.map((s) => symptomById(s)?.label).join(', ')}. These are treated as urgent in any medical setting.`,
      action: 'Stop the current task, tell a crewmate, open the crew medical checklist and call the flight surgeon on the emergency loop.',
      notifySurgeon: true, sources: ['hrp-hazards'],
    });
  }
  const ordinary = today.filter((s) => !symptomById(s)?.redFlag);
  // Persistence: the same ordinary symptom on 3 consecutive days.
  const persistent = ordinary.filter((s) => {
    let n = 0;
    for (let i = ctx.flight.length - 1; i >= 0; i--) {
      if (ctx.flight[i].symptoms.includes(s)) n++;
      else break;
    }
    return n >= 3;
  });
  if (persistent.length) {
    add(ctx, 'symptom-persist', {
      indicator: 'symptoms', level: 'amber', basis: 'symptom',
      title: 'Symptom present for 3 days or more',
      reason: `${persistent.map((s) => symptomById(s)?.label).join(', ')} reported on at least three consecutive days.`,
      action: 'Log severity daily and raise it at the next private medical conference.',
      notifySurgeon: false, sources: ['hrp-hazards'],
    });
  } else if (ordinary.length >= 3) {
    add(ctx, 'symptom-cluster', {
      indicator: 'symptoms', level: 'amber', basis: 'symptom',
      title: 'Several symptoms today',
      reason: `${ordinary.map((s) => symptomById(s)?.label).join(', ')}.`,
      action: 'Rest where the timeline allows, hydrate, and check temperature and SpO2 again this evening.',
      notifySurgeon: false, sources: ['hrp-hazards'],
    });
  }
}

export function evaluate(crew: CrewMember, settings: MissionSettings): Evaluation {
  const pre = crew.records.filter((r) => r.day <= 0);
  const flight = crew.records.filter((r) => r.day >= 1 && r.day <= settings.currentDay).sort((a, b) => a.day - b.day);
  const rec = flight[flight.length - 1] ?? null;

  const baselines: Partial<Record<IndicatorId, Baseline>> = {};
  const ids: IndicatorId[] = ['hr', 'bpSys', 'bpDia', 'spo2', 'resp', 'hrv', 'temp', 'glucose', 'weight', 'sleep', 'exercise', 'mood', 'stress', 'kss', 'pvtRt', 'pvtLapses', 'radDose'];
  for (const id of ids) {
    const b = baselineOf(pre.map((r) => r.values[id]).filter((x): x is number => Number.isFinite(x)));
    if (b) baselines[id] = b;
  }

  const cumulativeDoseMsv = flight.reduce((s, r) => s + (r.values.radDose ?? 0), 0);
  const presentDays = new Set(flight.map((r) => r.day));
  let missedCheckins = 0;
  for (let d = 1; d <= settings.currentDay; d++) if (!presentDays.has(d)) missedCheckins++;

  const byIndicator = {} as Evaluation['byIndicator'];
  for (const id of ids) {
    const latest = seriesFor(flight, id).slice(-1)[0];
    const b = baselines[id] ?? null;
    byIndicator[id] = {
      level: 'green',
      z: latest && b ? robustZ(latest.value, b) : null,
      baseline: b,
      value: latest ? latest.value : null,
    };
  }

  if (!rec) {
    return { crewId: crew.id, day: settings.currentDay, record: null, findings: [], overall: 'green', notifySurgeon: false, byIndicator, cumulativeDoseMsv, missedCheckins };
  }

  const ctx: Ctx = { crew, settings, rec, baselines, flight, findings: [] };
  ruleSymptoms(ctx);
  ruleRadiation(ctx, cumulativeDoseMsv);
  ruleTemp(ctx);
  ruleSpO2(ctx);
  ruleResp(ctx);
  ruleHrv(ctx);
  ruleBloodPressure(ctx);
  ruleHeartRate(ctx);
  ruleGlucose(ctx);
  ruleSleep(ctx);
  rulePVT(ctx);
  ruleSleepiness(ctx);
  ruleMood(ctx);
  ruleWeight(ctx);
  ruleExercise(ctx);

  if (missedCheckins >= 2 && rec.day < settings.currentDay) {
    add(ctx, 'routine', {
      indicator: 'routine', level: 'amber', basis: 'routine',
      title: `${missedCheckins} check-ins missed`,
      reason: `The last entry is from day ${rec.day}; today is day ${settings.currentDay}.`,
      action: 'Complete today\'s check-in. Even a partial entry keeps your baseline comparison useful.',
      notifySurgeon: false, sources: [],
    });
  }

  for (const f of ctx.findings) {
    if (f.indicator === 'symptoms' || f.indicator === 'routine') continue;
    const cur = byIndicator[f.indicator].level;
    byIndicator[f.indicator].level = maxLevel([cur, f.level]);
    if (f.indicator === 'bpSys') byIndicator.bpDia.level = byIndicator.bpSys.level;
    if (f.indicator === 'pvtRt') byIndicator.pvtLapses.level = byIndicator.pvtRt.level;
  }
  // Mark gentle baseline drift (not an alert) so the tile can show a trend arrow.
  const order: Record<Level, number> = LEVEL_RANK;
  const findings = [...ctx.findings].sort((a, b) => order[b.level] - order[a.level]);
  return {
    crewId: crew.id,
    day: rec.day,
    record: rec,
    findings,
    overall: maxLevel(findings.map((f) => f.level)),
    notifySurgeon: findings.some((f) => f.notifySurgeon),
    byIndicator,
    cumulativeDoseMsv,
    missedCheckins,
  };
}

/** Trend direction over the last five flight days, used for arrows on tiles. */
export function trendOf(crew: CrewMember, id: IndicatorId, currentDay: number): 'up' | 'down' | 'flat' | null {
  const series = seriesFor(crew.records.filter((r) => r.day >= 1 && r.day <= currentDay), id);
  const s = slope(series, 5);
  const b = baselineOf(crew.records.filter((r) => r.day <= 0).map((r) => r.values[id]).filter((x): x is number => Number.isFinite(x)));
  if (s === null || !b) return null;
  // A slope that moves a full typical deviation over five days counts as a trend.
  const perFive = s * 5;
  if (perFive > b.mad) return 'up';
  if (perFive < -b.mad) return 'down';
  return 'flat';
}
