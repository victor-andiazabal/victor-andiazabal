import type { ReactNode } from 'react';

/** One line icon set: drawn on a 20px grid, 1px rendered stroke at any size (24px for patches). Decorative by default; pass a label to expose one. */
interface IconProps {
  size?: number;
  label?: string;
  className?: string;
}

function Svg({ size = 20, label, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={20 / size}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconToday = (p: IconProps) => (
  <Svg {...p}><circle cx="10" cy="10" r="7.5" /><path d="M4.5 10.5h2.5l1.5-3 2.5 6 1.5-3h3" /></Svg>
);
export const IconCamera = (p: IconProps) => (
  <Svg {...p}><path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h1.5l1-2h5l1 2H15A1.5 1.5 0 0 1 16.5 7v7.5A1.5 1.5 0 0 1 15 16H5a1.5 1.5 0 0 1-1.5-1.5z" /><circle cx="10" cy="10.5" r="2.75" /></Svg>
);
export const IconCheckin = (p: IconProps) => (
  <Svg {...p}><rect x="4.5" y="3.5" width="11" height="14" rx="1.5" /><path d="M7.5 3.5v-1h5v1M7.5 9.5l1.75 1.75L12.75 8M7.5 14.5h5" /></Svg>
);
export const IconBody = (p: IconProps) => (
  <Svg {...p}><circle cx="10" cy="4.5" r="2" /><path d="M5 8.5l5-1.5 5 1.5M10 7v5.5M10 12.5l-2.5 5M10 12.5l2.5 5" /></Svg>
);
export const IconTrends = (p: IconProps) => (
  <Svg {...p}><path d="M3.5 16.5h13M3.5 3.5v13M6 13l3-4 2.5 2.5L16 6" /></Svg>
);
export const IconAlerts = (p: IconProps) => (
  <Svg {...p}><path d="M10 3.5l7 12.5H3z" /><path d="M10 8.5v3.5M10 14v.01" /></Svg>
);
export const IconRoutine = (p: IconProps) => (
  <Svg {...p}><circle cx="10" cy="10" r="7.5" /><path d="M10 5.5V10l3 2" /></Svg>
);
export const IconReaction = (p: IconProps) => (
  <Svg {...p}><circle cx="10" cy="11" r="6" /><path d="M10 11V7.5M8.5 3h3M15 5.5l1-1" /></Svg>
);
export const IconGround = (p: IconProps) => (
  <Svg {...p}><path d="M4 9a6 6 0 0 0 7 7zM7.5 12.5l4-4M11.5 8.5a1 1 0 1 0 0-.01M12.5 4.5a3 3 0 0 1 3 3M13 2a5.5 5.5 0 0 1 5 5M5 17.5h6" /></Svg>
);
export const IconLearn = (p: IconProps) => (
  <Svg {...p}><path d="M10 5.5c-1.5-1.3-3.5-2-6-2v12c2.5 0 4.5.7 6 2 1.5-1.3 3.5-2 6-2v-12c-2.5 0-4.5.7-6 2zM10 5.5v12" /></Svg>
);
export const IconSettings = (p: IconProps) => (
  <Svg {...p}><path d="M3.5 6h8M14.5 6h2M3.5 14h2M8.5 14h8" /><circle cx="13" cy="6" r="1.5" /><circle cx="7" cy="14" r="1.5" /></Svg>
);
export const IconMore = (p: IconProps) => (
  <Svg {...p}><circle cx="5" cy="10" r=".75" /><circle cx="10" cy="10" r=".75" /><circle cx="15" cy="10" r=".75" /></Svg>
);
export const IconHelp = (p: IconProps) => (
  <Svg {...p}><circle cx="10" cy="10" r="7.5" /><path d="M7.75 8a2.25 2.25 0 1 1 3.2 2.05c-.6.3-.95.8-.95 1.45v.5M10 14.5v.01" /></Svg>
);
export const IconClose = (p: IconProps) => (
  <Svg {...p}><path d="M5 5l10 10M15 5L5 15" /></Svg>
);
export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}><path d="M8 5l5 5-5 5" /></Svg>
);
export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}><path d="M5 8l5 5 5-5" /></Svg>
);
export const IconFlame = (p: IconProps) => (
  <Svg {...p}><path d="M10 2.5c.5 3 3.5 4.5 3.5 8a3.5 3.5 0 0 1-7 0c0-1.2.5-2 1-2.6.3 1 .8 1.4 1.3 1.6C8.6 7.5 9 5 10 2.5zM10 17.5a2 2 0 0 1-2-2c0-1 .8-1.7 2-2.5 1.2.8 2 1.5 2 2.5a2 2 0 0 1-2 2z" /></Svg>
);
export const IconCalendar = (p: IconProps) => (
  <Svg {...p}><rect x="3.5" y="4.5" width="13" height="12" rx="1.5" /><path d="M3.5 8.5h13M7 2.5v3M13 2.5v3M7 12h6" /></Svg>
);
export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}><circle cx="10" cy="10" r="7.5" /><path d="M6.5 10.2l2.4 2.4 4.6-5" /></Svg>
);
export const IconDumbbell = (p: IconProps) => (
  <Svg {...p}><path d="M2.5 8v4M5 6v8M15 6v8M17.5 8v4M5 10h10" /></Svg>
);
export const IconList = (p: IconProps) => (
  <Svg {...p}><path d="M4 5.5h.01M4 10h.01M4 14.5h.01M7.5 5.5h9M7.5 10h9M7.5 14.5h9" /></Svg>
);
export const IconInbox = (p: IconProps) => (
  <Svg {...p}><path d="M3.5 11.5l2-7h9l2 7v4h-13zM3.5 11.5H7l1 2h4l1-2h3.5" /></Svg>
);
export const IconArrowUp = (p: IconProps) => (
  <Svg {...p}><path d="M10 16V4M5.5 8.5L10 4l4.5 4.5" /></Svg>
);
export const IconArrowDown = (p: IconProps) => (
  <Svg {...p}><path d="M10 4v12M5.5 11.5L10 16l4.5-4.5" /></Svg>
);
export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}><path d="M4 10h12M11.5 5.5L16 10l-4.5 4.5" /></Svg>
);

/* Crew role icons for the top-bar crew tabs. */
export const IconCommander = (p: IconProps) => (
  <Svg {...p}><path d="M10 2.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L10 13.3l-4.2 2.2.8-4.7-3.4-3.3 4.7-.7z" /><path d="M6 18h8" /></Svg>
);
export const IconMedic = (p: IconProps) => (
  <Svg {...p}><path d="M8 3.5h4v4.5h4.5v4H12v4.5H8V12H3.5V8H8z" /></Svg>
);
export const IconEva = (p: IconProps) => (
  <Svg {...p}><path d="M4 11a6 6 0 0 1 12 0v4.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M6.5 11.5a3.5 2.5 0 0 1 7 0v1.5h-7z" /></Svg>
);
export const IconScience = (p: IconProps) => (
  <Svg {...p}><path d="M8 2.5h4M8.5 2.5v5l-4.5 8a1.3 1.3 0 0 0 1.1 2h9.8a1.3 1.3 0 0 0 1.1-2l-4.5-8v-5M6.5 12.5h7" /></Svg>
);

/** The VIGIL pulse-ring mark, drawn in the brand colour. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="logo">
      <circle cx="16" cy="16" r="14" fill="none" stroke="var(--brand)" strokeWidth="2" />
      <path d="M6 17 L11 17 L13 11 L16 23 L19 14 L21 17 L26 17" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
