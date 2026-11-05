import { useId, type CSSProperties } from 'react';
import type { IndicatorDef } from '../data/indicators';
import { fmt, LEVEL_LABEL } from '../lib/format';
import type { Evaluation } from '../lib/rules';
import { bandScale, type StripDay } from '../lib/today';
import { AnimateDigits } from './controls/AnimateDigits';
import { BaselineBand } from './controls/BaselineBand';
import { StatusStrip } from './controls/StatusStrip';
import { IconArrowDown, IconArrowRight, IconArrowUp } from './icons';
import { Pill } from './ui';

type Trend = 'up' | 'down' | 'flat' | null;

const TREND_ICON = { up: IconArrowUp, down: IconArrowDown, flat: IconArrowRight };
const TREND_WORD = { up: 'rising', down: 'falling', flat: 'steady' };

interface IndicatorTileProps {
  def: IndicatorDef;
  status: Evaluation['byIndicator'][keyof Evaluation['byIndicator']];
  days: StripDay[];
  trend: Trend;
  /** Position in reading order; staggers the refresh after a save. */
  order: number;
  refresh: boolean;
  /** Marks this tile's band as the tutorial's baseline step. */
  tourAnchor: boolean;
  /** Needs attention tiles are raised, lead with the pill and always show the day strip. */
  attention: boolean;
  /** Track spans on the 12-track grid at <1024, 1024-1279 and >=1280. */
  spans: { sm: number; lg: number; xl: number };
  onOpen: () => void;
}

/**
 * One reading: label, readout, the baseline band, a 14-day strip and the trend. The whole tile opens its trend.
 * In range tiles keep the strip hidden until hover, focus or a tap on it, so only flagged tiles carry colour.
 */
export function IndicatorTile({ def, status, days, trend, order, refresh, tourAnchor, attention, spans, onOpen }: IndicatorTileProps) {
  const scale = bandScale(status.value, status.baseline, def);
  const TrendIcon = trend ? TREND_ICON[trend] : null;
  const stripId = useId();
  const style = { '--i': order, '--span-sm': spans.sm, '--span-lg': spans.lg, '--span-xl': spans.xl } as CSSProperties;
  return (
    <article className={`ind-tile ${attention ? 'attention' : 'range'}${refresh ? ' refresh' : ''}`} style={style}>
      <button
        type="button"
        className="ind-open"
        onClick={onOpen}
        aria-describedby={days.length ? stripId : undefined}
        aria-label={`${def.label}: ${fmt(def.id, status.value)} ${def.unit}, ${LEVEL_LABEL[status.level]}${trend ? `, ${TREND_WORD[trend]}` : ''}. Open trend`}
      />
      <div className="ind-head">
        <span className="ind-label">{def.shortLabel ?? def.label}</span>
        <Pill level={status.level} />
      </div>
      <div className="ind-readout">
        <AnimateDigits value={fmt(def.id, status.value)} className="ind-value" />
        <span className="ind-unit mono">{def.unit}</span>
        {TrendIcon && trend && (
          <span className="ind-trend" title={TREND_WORD[trend]}>
            <TrendIcon size={16} />
          </span>
        )}
      </div>
      <div className="ind-band" data-tour={tourAnchor ? 'baseline' : undefined}>
        <BaselineBand value={status.value} baseline={status.baseline} min={scale.min} max={scale.max} />
      </div>
      <div className="ind-strip">
        <StatusStrip days={days} summaryId={stripId} />
      </div>
    </article>
  );
}
