import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { indicatorById } from '../data/indicators';
import type { IndicatorId } from '../lib/types';
import type { View } from '../lib/views';
import { CueCard, type Cue } from './checkin/CueCard';
import { ReviewStep } from './checkin/ReviewStep';
import { StepFields } from './checkin/StepFields';
import { StepRail } from './checkin/StepRail';
import { REVIEW_STEP, STEPS, stepOf, SYMPTOMS_STEP, visibleFields } from './checkin/steps';
import { SymptomsStep } from './checkin/SymptomsStep';
import { useCheckinDraft } from './checkin/useCheckinDraft';
import { BtnTrail, Pill, SourceLinks } from './ui';
import './checkin/checkin.css';

const SYMPTOM_CUE: Cue = {
  title: 'Symptoms',
  what: 'Anything unusual you noticed since the last check-in, from a headache to trouble sleeping.',
  how: 'Tap everything that applies. A symptom on three days in a row, or three at once, is flagged to watch; anything marked urgent is treated as urgent.',
  whySpace: 'Distance from Earth means the flight surgeon cannot examine you, so what you report is the first line of diagnosis.',
  sources: ['hrp-hazards'],
};

interface CheckInProps {
  go: (v: View) => void;
  /** Open on the step that holds this indicator and focus its field (Re-measure in 30 min). */
  focus?: IndicatorId;
}

export function CheckIn({ go, focus }: CheckInProps) {
  const draft = useCheckinDraft();
  const [index, setIndex] = useState(() => stepOf(focus));
  const [furthest, setFurthest] = useState(index);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [active, setActive] = useState<IndicatorId | undefined>(() => focus ?? STEPS[stepOf(focus)].fields[0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const step = STEPS[index];

  // After a step change, put focus on the new step's title and bring the rail back into view if it scrolled away.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    headRef.current?.focus({ preventScroll: true });
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) rootRef.current?.scrollIntoView({ block: 'start' });
  }, [index]);

  // Re-measure: focus the flagged field once on open.
  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`nf-${focus}`) ?? document.querySelector<HTMLElement>(`[data-field="${focus}"] [role="radio"][tabindex="0"]`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: 'center' });
  }, [focus]);

  const goTo = (to: number) => {
    const target = Math.max(0, Math.min(REVIEW_STEP, to));
    if (target === index) return;
    moved.current = true;
    setDir(target > index ? 'fwd' : 'back');
    setIndex(target);
    setFurthest((f) => Math.max(f, target));
    setActive(STEPS[target].fields[0]);
  };
  const next = () => goTo(index + 1);
  const back = () => goTo(index - 1);
  const saveAndExit = () => {
    draft.save();
    go('today');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return;
    const t = e.target as HTMLElement;
    if (t.tagName === 'TEXTAREA' || t.tagName === 'A') return;
    if (e.shiftKey) {
      e.preventDefault();
      back();
      return;
    }
    if (t.tagName === 'BUTTON' && t.getAttribute('role') !== 'radio') return;
    if (index >= REVIEW_STEP) return;
    e.preventDefault();
    next();
  };

  const fields = visibleFields(step, draft.day, draft.draft.weight);
  const canConfirmAll = fields.length > 0 && fields.every((id) => draft.prefill[id] !== undefined);
  const activeDef = active ? indicatorById(active) : null;
  const cue: Cue | null = step.id === 'symptoms' ? SYMPTOM_CUE : activeDef ? { title: activeDef.label, what: activeDef.what, how: activeDef.how, whySpace: activeDef.whySpace, sources: activeDef.sources } : null;
  const flags = draft.preview.findings.length;
  // Said once, in the header, not on every step.
  const hasSimulated = STEPS.some((s) => s.fields.some((id) => draft.prefillOf(id) === 'simulated'));

  return (
    <div className="ci" ref={rootRef}>
      <div className="page-head">
        <div>
          <h1>Daily check-in</h1>
          <p>
            Day <span className="mono">{draft.day}</span> · {draft.selected.callsign}.{' '}
            {draft.isManual ? 'You already saved an entry today; editing it.' : 'Wearable values are prefilled; correct anything that looks wrong.'}
          </p>
          {hasSimulated && <p className="ci-sim">Values are simulated in this prototype.</p>}
        </div>
        <Pill level={draft.preview.overall}>{flags ? `${flags} flag${flags > 1 ? 's' : ''}` : 'No flags'}</Pill>
      </div>

      {focus && (
        <div className="ci-remeasure" role="note">
          <p>
            Re-measure {indicatorById(focus).label.toLowerCase()} 30 minutes after acting on the alert, then save again. The ground confirms later; you reassess now.
          </p>
          <SourceLinks ids={['russell-2023']} compact />
        </div>
      )}

      <StepRail steps={STEPS} index={index} furthest={furthest} onGo={goTo} />

      <section className="panel ci-panel" aria-labelledby="ci-step-title" onKeyDown={onKeyDown}>
        <div key={index} className={`ci-step ci-step-${dir}`}>
          <div className="ci-step-head">
            <h2 id="ci-step-title" ref={headRef} tabIndex={-1}>
              {step.label}
            </h2>
            <p className="text-2">{step.blurb}</p>
          </div>

          <div className={`ci-body${cue && index !== REVIEW_STEP ? '' : ' is-wide'}`}>
            <div className="ci-main">
              {step.fields.length > 0 && <StepFields step={step} draft={draft} focus={focus} onActive={setActive} go={go} />}
              {index === SYMPTOMS_STEP && <SymptomsStep draft={draft} onNone={() => { draft.clearSymptoms(); goTo(REVIEW_STEP); }} />}
              {index === REVIEW_STEP && <ReviewStep draft={draft} onEdit={goTo} />}
              {canConfirmAll && (
                <div className="ci-confirm">
                  <button type="button" className="btn" onClick={next}>
                    Confirm all on this step
                  </button>
                  <span className="ci-confirm-note">Every value here is prefilled; confirm to keep them and move on</span>
                </div>
              )}
            </div>
            {cue && index !== REVIEW_STEP && <CueCard cue={cue} />}
          </div>
        </div>

        <div className="ci-foot">
          <div className="ci-foot-start">
            {index > 0 && (
              <button type="button" className="btn" onClick={back}>
                Back
              </button>
            )}
            <span className="ci-foot-keys">Enter for next, Shift+Enter for back</span>
          </div>
          {index < REVIEW_STEP ? (
            <button type="button" className="btn-primary" onClick={next}>
              Next
              <BtnTrail />
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={saveAndExit}>
              Save check-in
              <BtnTrail icon="check" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
