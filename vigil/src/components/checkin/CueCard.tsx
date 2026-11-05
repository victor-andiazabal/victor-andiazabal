import { useState } from 'react';
import { SourceLinks } from '../ui';

export interface Cue {
  title: string;
  what: string;
  how: string;
  whySpace?: string;
  sources: string[];
}

/**
 * The procedure card beside each step: what it is, how to measure on board, why it matters in space.
 * Below 1024px it folds into a 48px "How to measure" disclosure above the fields.
 */
export function CueCard({ cue }: { cue: Cue }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="ci-cue-wrap" aria-label={`How to measure: ${cue.title}`}>
      <button type="button" className="ci-cue-toggle" aria-expanded={open} aria-controls="ci-cue" onClick={() => setOpen((o) => !o)}>
        <span className="ci-cue-toggle-label">How to measure</span>
        <span className="ci-cue-toggle-name">{cue.title}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="ci-cue-chev">
          <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id="ci-cue" className="ci-cue" data-open={open}>
        <h3 className="ci-cue-title">{cue.title}</h3>
        <dl className="ci-cue-list">
          <dt>What it is</dt>
          <dd>{cue.what}</dd>
          <dt>How to measure on board</dt>
          <dd>{cue.how}</dd>
          {cue.whySpace && (
            <>
              <dt>Why it matters in space</dt>
              <dd>{cue.whySpace}</dd>
            </>
          )}
        </dl>
        <SourceLinks ids={cue.sources} compact />
      </div>
    </aside>
  );
}
