import { METRIC_DEFINITIONS, type StaffingMetric } from "./measures";

export function formatMetricValue(metric: StaffingMetric, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Not reported";
  const def = METRIC_DEFINITIONS[metric];
  return def.unit === "percent" ? `${value.toFixed(1)}%` : `${value.toFixed(2)} hours`;
}

/** Human-readable reporting period, for example "Jan 2025 to Dec 2025". */
export function formatPeriod(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${fmt.format(start)} to ${fmt.format(end)}`;
}
