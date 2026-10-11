/** Median of a list of numbers. Returns null for an empty list. */
export function median(values: readonly number[]): number | null {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return null;
  const sorted = [...finite].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted.at(mid) ?? null;
  const lo = sorted.at(mid - 1);
  const hi = sorted.at(mid);
  return lo === undefined || hi === undefined ? null : (lo + hi) / 2;
}

/**
 * Percentile rank (0 to 100) of `value` within `population`: the share of
 * values strictly below it, plus half of the ties. Returns null when the
 * population is empty.
 */
export function percentileRank(value: number, population: readonly number[]): number | null {
  const finite = population.filter((v) => Number.isFinite(v));
  if (finite.length === 0 || !Number.isFinite(value)) return null;
  const below = finite.filter((v) => v < value).length;
  const equal = finite.filter((v) => v === value).length;
  return ((below + 0.5 * equal) / finite.length) * 100;
}

/**
 * Relative change from `previous` to `current` (0.5 = +50%).
 * Returns null when it cannot be computed.
 */
export function relativeChange(previous: number, current: number): number | null {
  if (!Number.isFinite(previous) || !Number.isFinite(current) || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
