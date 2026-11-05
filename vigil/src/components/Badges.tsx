import { useMemo } from 'react';
import { badgeProgress, type BadgeProgress } from '../lib/badges';
import { useStore } from '../state/store';

const CSS = `
@keyframes patch-in { from { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } to { transform: scale(1); } }
.patch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; list-style: none; padding: 0; margin: 0; }
.patch { border: 1px solid var(--line); border-radius: 12px; background: var(--bg-2); padding: 12px; display: grid; gap: 6px; justify-items: center; text-align: center; align-content: start; }
.patch:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.patch .emblem { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 16px; border: 2px solid var(--line); color: var(--muted); }
.patch.earned { border-color: var(--green); background: var(--green-bg); }
.patch.earned .emblem { background: var(--green); border-color: var(--green); color: #0b1020; animation: patch-in 0.5s ease-out both; }
.patch.locked .emblem { filter: grayscale(1); }
.patch .progress { width: 100%; }
@media (prefers-reduced-motion: reduce) { .patch.earned .emblem { animation: none; } }
`;

function Patch({ p }: { p: BadgeProgress }) {
  const { badge, earned, current, target } = p;
  const status = earned ? 'earned' : `locked, ${current} of ${target}`;
  return (
    <li className={`patch ${earned ? 'earned' : 'locked'}`} tabIndex={0} aria-label={`${badge.label}, ${status}`} title={`${badge.how} ${badge.why}`}>
      <div className="emblem" aria-hidden="true">{badge.icon}</div>
      <strong style={{ fontSize: 14 }}>{badge.label}</strong>
      {earned ? (
        <small className="muted">Earned</small>
      ) : (
        <>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${(current / target) * 100}%` }} />
          </div>
          <small>{current}/{target}</small>
          <small className="muted">{badge.how}</small>
          <small className="muted">{badge.why}</small>
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
      <style>{CSS}</style>
      <h3>Mission patches</h3>
      <p className="muted" style={{ fontSize: 13, margin: '0 0 10px' }}>
        {earnedCount} of {progress.length} earned. Patches reward habits (measuring, testing, exercising), never the readings themselves.
      </p>
      <ul className="patch-grid">
        {progress.map((p) => <Patch key={p.badge.id} p={p} />)}
      </ul>
    </div>
  );
}
