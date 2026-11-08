import type { CrewMember } from '../lib/types';

/** Generated portrait: an astronaut in a helmet, tinted per crew member. No real person is depicted. */
export function Avatar({ crew, size = 56 }: { crew: Pick<CrewMember, 'name' | 'hue'>; size?: number }) {
  const h = crew.hue;
  const initials = crew.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const id = `av-${h}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Portrait of ${crew.name}`} className="avatar">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${h} 70% 55%)`} />
          <stop offset="1" stopColor={`hsl(${(h + 40) % 360} 70% 35%)`} />
        </linearGradient>
        <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b2250" />
          <stop offset="1" stopColor="#0b1020" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${id}-bg)`} />
      {/* suit shoulders */}
      <path d="M8 64 C10 48 20 44 32 44 C44 44 54 48 56 64 Z" fill="#e8ecf8" />
      <path d="M8 64 C10 48 20 44 32 44 C44 44 54 48 56 64 Z" fill={`hsl(${h} 40% 30%)`} opacity="0.25" />
      {/* helmet */}
      <circle cx="32" cy="26" r="17" fill="#f3f5fb" />
      <circle cx="32" cy="26" r="13.5" fill={`url(#${id}-visor)`} />
      <path d="M22 20 Q27 13 36 15" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="32" y="30.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff" fontFamily="Inter, system-ui, sans-serif">
        {initials}
      </text>
      {/* chest patch */}
      <rect x="27" y="50" width="10" height="6" rx="1.5" fill={`hsl(${h} 70% 55%)`} />
    </svg>
  );
}
