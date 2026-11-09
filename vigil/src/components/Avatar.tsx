import type { CrewMember } from '../lib/types';

interface AvatarProps {
  crew: Pick<CrewMember, 'name'>;
  size?: number;
  /** Expose the portrait to assistive tech. Off by default: the name is almost always printed beside it. */
  labelled?: boolean;
}

/** Initials appear only where they can be read. */
const INITIALS_MIN = 40;

/**
 * Generated portrait: a helmeted figure drawn in the line-icon style (1px rendered stroke at any size) on a neutral
 * disc. No real person is depicted. It stays neutral on purpose so it never competes with the green,
 * amber and red status colours that sit next to it.
 */
export function Avatar({ crew, size = 32, labelled = false }: AvatarProps) {
  const initials = crew.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const stroke = 64 / size;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="avatar"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? `Portrait of ${crew.name}` : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      <circle cx="32" cy="32" r={32 - stroke / 2} fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth={stroke} />
      <g fill="none" stroke="var(--text-2)" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        {/* suit shoulders */}
        <path d="M12 58c2-9 10-13 20-13s18 4 20 13" />
        {/* helmet and visor */}
        <circle cx="32" cy="27" r="15" />
        <path d="M21 27a11 9 0 0 1 22 0v2a11 7 0 0 1-22 0z" fill="var(--surface-3)" />
      </g>
      {size >= INITIALS_MIN && (
        <text x="32" y="31" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text)" fontFamily="var(--mono)">
          {initials}
        </text>
      )}
    </svg>
  );
}
