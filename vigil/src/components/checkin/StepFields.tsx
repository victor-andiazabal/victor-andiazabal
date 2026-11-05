import { useState } from 'react';
import { indicatorById, type IndicatorDef } from '../../data/indicators';
import { fmt } from '../../lib/format';
import type { IndicatorId } from '../../lib/types';
import type { View } from '../../lib/views';
import { CameraPulse } from '../CameraPulse';
import { NumberField } from '../controls/NumberField';
import { ScaleField } from './ScaleField';
import { isWeighDay, nextWeighDay, PVT_FIELDS, SCALE_FIELDS, type StepDef } from './steps';
import { isOutOfRange, type CheckinDraft } from './useCheckinDraft';

const STATUS_TEXT = { green: 'within range', amber: 'flagged: watch', red: 'flagged: act now' } as const;

/** Level preview under a field: dot + words, plus "above/below your usual" for a 2-deviation drift. */
function FieldStatus({ draft, id }: { draft: CheckinDraft; id: IndicatorId }) {
  const v = draft.draft[id];
  if (v === null || v === undefined || isOutOfRange(id, v)) return null;
  const st = draft.preview.byIndicator[id];
  return (
    <p className="ci-status">
      <span className={`dot ${st.level}`} aria-hidden="true" />
      <span>{STATUS_TEXT[st.level]}</span>
      {st.baseline && st.z !== null && Math.abs(st.z) >= 2 && <span className="muted">· {st.z > 0 ? 'above' : 'below'} your usual</span>}
    </p>
  );
}

interface StepFieldsProps {
  step: StepDef;
  draft: CheckinDraft;
  focus?: IndicatorId;
  onActive(id: IndicatorId): void;
  go(v: View): void;
}

export function StepFields({ step, draft, focus, onActive, go }: StepFieldsProps) {
  const weighDay = isWeighDay(draft.day);
  const [weightOpen, setWeightOpen] = useState(() => focus === 'weight' || weighDay || draft.draft.weight != null);
  const [pvtOpen, setPvtOpen] = useState(() => focus !== undefined && PVT_FIELDS.has(focus));
  const [cameraOpen, setCameraOpen] = useState(false);

  const field = (def: IndicatorDef) => {
    const status = <FieldStatus draft={draft} id={def.id} />;
    if (SCALE_FIELDS.has(def.id)) {
      return (
        <ScaleField def={def} value={draft.draft[def.id] ?? null} onChange={(n) => draft.setValue(def.id, n)} prefill={draft.prefillOf(def.id)}>
          {status}
        </ScaleField>
      );
    }
    return (
      <NumberField
        id={`nf-${def.id}`}
        label={def.label}
        value={draft.draft[def.id] ?? null}
        onChange={(v) => draft.setValue(def.id, v)}
        min={def.min}
        max={def.max}
        step={def.step}
        decimals={def.decimals}
        unit={def.unit}
        prefill={draft.prefillOf(def.id)}
        baseline={draft.preview.byIndicator[def.id].baseline}
        def={def}
      >
        {status}
      </NumberField>
    );
  };

  const main = step.fields.filter((id) => !PVT_FIELDS.has(id));
  const pvt = step.fields.filter((id) => PVT_FIELDS.has(id));
  const pvtSummary = pvt.map((id) => `${fmt(id, draft.draft[id])}${indicatorById(id).unit ? ` ${indicatorById(id).unit}` : ' lapses'}`).join(', ');

  return (
    <div className={`ci-fields${step.id === 'sleep' ? '' : ' is-grid'}`}>
      {main.map((id) => {
        const def = indicatorById(id);
        if (id === 'weight' && !weightOpen) {
          return (
            <div key={id} className="ci-optional" onFocus={() => onActive(id)}>
              <button type="button" className="btn-ghost ci-optional-btn" onClick={() => setWeightOpen(true)}>
                Add body mass
              </button>
              <span className="muted small">Weekly reading; the next one is due on day {nextWeighDay(draft.day)}</span>
            </div>
          );
        }
        return (
          <div
            key={id}
            className={`ci-field${SCALE_FIELDS.has(id) || (id === 'hr' && cameraOpen) ? ' is-wide' : ''}`}
            onFocus={() => onActive(id)}
            onPointerDown={() => onActive(id)}
          >
            {field(def)}
            {id === 'hr' && (
              <div className="ci-camera">
                <button type="button" className="btn-ghost ci-optional-btn" aria-expanded={cameraOpen} onClick={() => setCameraOpen((o) => !o)}>
                  {cameraOpen ? 'Hide camera pulse' : 'Measure with the camera'}
                </button>
                {cameraOpen && (
                  <CameraPulse
                    onResult={(bpm) => {
                      draft.setValue('hr', bpm);
                      setCameraOpen(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {pvt.length > 0 && (
        <div className="ci-pvt">
          <div className="ci-pvt-head">
            <button type="button" className="ci-disclosure" aria-expanded={pvtOpen} aria-controls="ci-pvt-fields" onClick={() => setPvtOpen((o) => !o)}>
              <span className="ci-pvt-title">
                <span>Reaction test values</span>
                <span className="mono muted ci-pvt-sum">{pvtSummary}</span>
              </span>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="ci-cue-chev">
                <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="btn" onClick={() => go('pvt')}>
              Run the 60-second reaction test
            </button>
          </div>
          {pvtOpen && (
            <div id="ci-pvt-fields" className="ci-fields is-grid">
              {pvt.map((id) => (
                <div key={id} className="ci-field" onFocus={() => onActive(id)} onPointerDown={() => onActive(id)}>
                  {field(indicatorById(id))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

