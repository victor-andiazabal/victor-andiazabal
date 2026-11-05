import { useMemo } from 'react';
import { badgeProgress, visiblePatches, type BadgeIcon, type BadgeProgress } from '../lib/badges';
import { useStore } from '../state/store';
import { IconCalendar, IconCheckCircle, IconCheckin, IconDumbbell, IconFlame, IconList, IconReaction } from './icons';
import './badges.css';

const PATCH_ICON: Record<BadgeIcon, typeof IconFlame> = {
  clipboard: IconCheckin,
  flame: IconFlame,
  calendar: IconCalendar,
  check: IconCheckCircle,
  timer: IconReaction,
  dumbbell: IconDumbbell,
  list: IconList,
};

/** One 48px row: line icon, name, and the count (or "Earned") in mono on the right. The next patch adds its bar and how-to. */
function Patch({ p, next }: { p: BadgeProgress; next: boolean }) {
  const { badge, earned, current, target } = p;
  const PatchIcon = PATCH_ICON[badge.icon];
  const status = earned ? 'earned' : `next, ${current} of ${target}`;
  return (
    <li className={`patch ${earned ? 'earned' : 'next'}`} tabIndex={0} aria-label={`${badge.label}, ${status}`} title={`${badge.how} ${badge.why}`}>
      <span className="patch-icon" aria-hidden="true"><PatchIcon size={20} /></span>
      <strong className="patch-name">{badge.label}</strong>
      <span className="patch-state mono">{earned ? 'Earned' : `${current}/${target}`}</span>
      {next && (
        <>
          <div className="patch-bar" aria-hidden="true">
            <span style={{ width: `${(current / target) * 100}%` }} />
          </div>
          <small className="patch-how">{badge.how}</small>
        </>
      )}
    </li>
  );
}

export function Badges() {
  const { selected, routineDone, settings } = useStore();
  const progress = useMemo(() => badgeProgress(selected, routineDone, settings), [selected, routineDone, settings]);
  const { shown, nextId, hidden } = useMemo(() => visiblePatches(progress), [progress]);
  const earnedCount = progress.length - progress.filter((p) => !p.earned).length;

  return (
    <div className="panel">
      <h2>Mission patches</h2>
      <p className="small-note patch-lead">
        {earnedCount} of {progress.length} earned. Patches reward habits (measuring, testing, exercising), never the readings themselves.
      </p>
      <ul className="patch-list">
        {shown.map((p) => <Patch key={p.badge.id} p={p} next={p.badge.id === nextId} />)}
      </ul>
      {hidden > 0 && <p className="small-note patch-more">{hidden} more patch{hidden === 1 ? '' : 'es'} appear as you earn the next one.</p>}
    </div>
  );
}

