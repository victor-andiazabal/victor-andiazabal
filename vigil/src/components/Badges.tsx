import { useMemo } from 'react';
import { badgeProgress, type BadgeIcon, type BadgeProgress } from '../lib/badges';
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

function Patch({ p }: { p: BadgeProgress }) {
  const { badge, earned, current, target } = p;
  const PatchIcon = PATCH_ICON[badge.icon];
  const status = earned ? 'earned' : `locked, ${current} of ${target}`;
  return (
    <li className={`patch ${earned ? 'earned' : 'locked'}`} tabIndex={0} aria-label={`${badge.label}, ${status}`} title={`${badge.how} ${badge.why}`}>
      <div className="emblem" aria-hidden="true"><PatchIcon size={24} /></div>
      <strong className="patch-name">{badge.label}</strong>
      {earned ? (
        <span className="patch-state">Earned</span>
      ) : (
        <>
          <div className="patch-bar" aria-hidden="true">
            <span style={{ width: `${(current / target) * 100}%` }} />
          </div>
          <span className="patch-state mono">{current}/{target}</span>
          <small>{badge.how}</small>
        </>
      )}
    </li>
  );
}

export function Badges() {
  const { selected, routineDone, settings } = useStore();
  const progress = useMemo(() => badgeProgress(selected, routineDone, settings), [selected, routineDone, settings]);
  const earnedCount = progress.filter((p) => p.earned).length;

  return (
    <div className="panel">
      <h2>Mission patches</h2>
      <p className="small-note patch-lead">
        {earnedCount} of {progress.length} earned. Patches reward habits (measuring, testing, exercising), never the readings themselves.
      </p>
      <ul className="patch-grid">
        {progress.map((p) => <Patch key={p.badge.id} p={p} />)}
      </ul>
    </div>
  );
}
