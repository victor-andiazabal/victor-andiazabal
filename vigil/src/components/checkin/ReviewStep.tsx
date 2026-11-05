import { indicatorById, symptomById } from '../../data/indicators';
import { fmt, LEVEL_LABEL } from '../../lib/format';
import type { IndicatorId } from '../../lib/types';
import { Pill, SourceLinks } from '../ui';
import { STEPS, visibleFields } from './steps';
import { isOutOfRange, type CheckinDraft } from './useCheckinDraft';

interface ReviewStepProps {
  draft: CheckinDraft;
  onEdit(step: number): void;
}

function ValueRow({ draft, id }: { draft: CheckinDraft; id: IndicatorId }) {
  const def = indicatorById(id);
  const v = draft.draft[id];
  const bad = isOutOfRange(id, v);
  const has = v !== null && v !== undefined;
  const level = draft.preview.byIndicator[id].level;
  return (
    <div className="ci-rv-row">
      <dt>{def.label}</dt>
      <dd className="mono ci-rv-val">{has ? `${bad ? v : fmt(id, v)}${def.unit ? ` ${def.unit}` : ''}` : '--'}</dd>
      <dd className="ci-rv-level">
        {!has && <span className="muted small">not entered</span>}
        {has && bad && <span className="ci-rv-bad">outside {def.min}-{def.max}, not saved</span>}
        {has && !bad && <Pill level={level}>{LEVEL_LABEL[level]}</Pill>}
      </dd>
    </div>
  );
}

export function ReviewStep({ draft, onEdit }: ReviewStepProps) {
  const { preview, symptoms, notes, invalid } = draft;
  const measured = STEPS.filter((s) => s.fields.length);
  return (
    <div className="ci-review">
      {invalid.length > 0 && (
        <p className="ci-rv-warn" role="status">
          {invalid.length} value{invalid.length > 1 ? 's are' : ' is'} outside the measurable range and will be left out of the entry.
        </p>
      )}
      <div className="ci-rv-groups">
        {measured.map((s) => (
          <section key={s.id} className="ci-rv-group" aria-labelledby={`rv-${s.id}`}>
            <div className="ci-rv-head">
              <h3 id={`rv-${s.id}`}>{s.label}</h3>
              <button type="button" className="btn-ghost" onClick={() => onEdit(STEPS.indexOf(s))} aria-label={`Edit ${s.label}`}>
                Edit
              </button>
            </div>
            <dl className="ci-rv-list">
              {visibleFields(s, draft.day, draft.draft.weight).map((id) => (
                <ValueRow key={id} draft={draft} id={id} />
              ))}
            </dl>
          </section>
        ))}
        <section className="ci-rv-group" aria-labelledby="rv-symptoms">
          <div className="ci-rv-head">
            <h3 id="rv-symptoms">Symptoms and notes</h3>
            <button type="button" className="btn-ghost" onClick={() => onEdit(STEPS.findIndex((x) => x.id === 'symptoms'))} aria-label="Edit symptoms and notes">
              Edit
            </button>
          </div>
          <p className="ci-rv-text">
            {symptoms.length
              ? symptoms.map((id) => `${symptomById(id)?.label ?? id}${symptomById(id)?.redFlag ? ' (urgent)' : ''}`).join(', ')
              : 'None today'}
          </p>
          {notes && <p className="ci-rv-text muted">{notes}</p>}
        </section>
      </div>

      <section className="ci-rv-flags" aria-labelledby="rv-flags">
        <h3 id="rv-flags">
          What this entry triggers <Pill level={preview.overall} />
        </h3>
        {preview.findings.length === 0 && <p className="muted">No rules fire on these values. Save to keep your baseline fresh.</p>}
        {preview.findings.map((f) => (
          <div key={f.id} className={`alert ${f.level}`}>
            <div className="head">
              <Pill level={f.level} />
              <h3>{f.title}</h3>
              {f.notifySurgeon && <span className="pill neutral">notify flight surgeon</span>}
            </div>
            <div className="why">
              <b>Why</b> {f.reason}
            </div>
            <div className="why">
              <b>Do now</b> {f.action}
            </div>
            <div className="foot">
              <SourceLinks ids={f.sources} compact />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
