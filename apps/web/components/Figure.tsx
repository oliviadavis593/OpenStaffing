import { formatMetricValue, formatPeriod, type StaffingMetric } from "@openstaffing/core";

export interface FigureProps {
  metric: StaffingMetric;
  value: number | null;
  periodStart: Date;
  periodEnd: Date;
  sourceName: string;
  sourceUrl: string;
  flagged?: boolean;
}

/**
 * Every staffing number on the site renders through this component, so every
 * number shows its unit, reporting period, and a link to its public source.
 */
export function Figure({
  metric,
  value,
  periodStart,
  periodEnd,
  sourceName,
  sourceUrl,
  flagged,
}: FigureProps) {
  return (
    <span>
      <span className="figure-value">{formatMetricValue(metric, value)}</span>
      {flagged ? <span className="badge">Check data</span> : null}
      <span className="figure-meta">
        {formatPeriod(periodStart, periodEnd)} ·{" "}
        <a href={sourceUrl} rel="noopener noreferrer" target="_blank">
          {sourceName}
        </a>
      </span>
    </span>
  );
}
