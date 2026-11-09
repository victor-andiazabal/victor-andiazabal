import type { ReactNode } from 'react';
import { IconChevronDown } from './icons';

interface FoldButtonProps {
  open: boolean;
  onToggle: () => void;
  controls: string;
  children: ReactNode;
}

/** A 48px chamfered disclosure row. Native button: Enter and Space toggle it, aria-expanded reports the state (screens.css .fold). */
export function FoldButton({ open, onToggle, controls, children }: FoldButtonProps) {
  return (
    <button type="button" className="fold" aria-expanded={open} aria-controls={controls} onClick={onToggle}>
      {children}
      <IconChevronDown className="fold-chev" />
    </button>
  );
}

/** The same row as a <summary>, for native <details> (Learn). */
export function FoldSummary({ children }: { children: ReactNode }) {
  return (
    <summary className="fold">
      {children}
      <IconChevronDown className="fold-chev" />
    </summary>
  );
}
