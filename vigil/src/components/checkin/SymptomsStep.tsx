import { SYMPTOMS } from '../../data/indicators';
import type { CheckinDraft } from './useCheckinDraft';

interface SymptomsStepProps {
  draft: CheckinDraft;
  /** "None today": clear every symptom and move on to Review. */
  onNone(): void;
}

function CheckGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="ci-sym-check">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SymptomsStep({ draft, onNone }: SymptomsStepProps) {
  const ordinary = SYMPTOMS.filter((s) => !s.redFlag);
  const urgent = SYMPTOMS.filter((s) => s.redFlag);
  const picked = draft.symptoms;

  const grid = (list: typeof SYMPTOMS) => (
    <div className="ci-sym-grid">
      {list.map((s) => {
        const on = picked.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={on}
            className={`ci-sym${s.redFlag ? ' is-urgent' : ''}${on ? ' is-on' : ''}`}
            onClick={() => draft.toggleSymptom(s.id)}
          >
            <span className="ci-sym-box" aria-hidden="true">
              {on && <CheckGlyph />}
            </span>
            <span className="ci-sym-label">{s.label}</span>
            {s.redFlag && <span className="ci-sym-tag">urgent</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="ci-fields">
      <div className="ci-none">
        <button type="button" className="btn" aria-pressed={picked.length === 0} onClick={onNone}>
          None today
        </button>
        <span className="muted small">{picked.length === 0 ? 'No symptoms selected' : `${picked.length} selected`}</span>
      </div>
      <fieldset className="ci-sym-set">
        <legend>Common</legend>
        {grid(ordinary)}
      </fieldset>
      <fieldset className="ci-sym-set">
        <legend>Urgent: any of these means stop and call the flight surgeon</legend>
        {grid(urgent)}
      </fieldset>
      <div className="field">
        <label htmlFor="ci-notes">Notes for the log</label>
        <textarea
          id="ci-notes"
          rows={3}
          value={draft.notes}
          onChange={(e) => draft.setNotes(e.target.value)}
          placeholder="Anything the flight surgeon should know: pain level, what changed, meds taken"
        />
      </div>
    </div>
  );
}
