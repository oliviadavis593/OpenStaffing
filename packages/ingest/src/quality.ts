import { relativeChange } from "@openstaffing/core";

export type QualityFlagReason = "ZERO_REPORTED" | "LARGE_CHANGE" | "MISSING_UNIT";

export interface QualityCheckInput {
  value: number;
  unit?: string | null;
  /** Same hospital, measure, and unit for the previous reporting period, if any. */
  previousValue?: number | null;
}

/** Year-over-year change above this share gets flagged for a human look. */
export const LARGE_CHANGE_THRESHOLD = 0.5;

/**
 * Flags suspicious values. Flagged values are still published, with a visible
 * caveat. Nothing is silently hidden.
 */
export function checkValue(
  input: QualityCheckInput,
): { reason: QualityFlagReason; detail: string }[] {
  const flags: { reason: QualityFlagReason; detail: string }[] = [];
  if (input.value === 0) {
    flags.push({
      reason: "ZERO_REPORTED",
      detail: "Reported as zero; the unit may not exist or data may be missing.",
    });
  }
  if (!input.unit) {
    flags.push({ reason: "MISSING_UNIT", detail: "No unit reported with this value." });
  }
  if (input.previousValue !== undefined && input.previousValue !== null) {
    const change = relativeChange(input.previousValue, input.value);
    if (change !== null && Math.abs(change) > LARGE_CHANGE_THRESHOLD) {
      flags.push({
        reason: "LARGE_CHANGE",
        detail: `Changed ${(change * 100).toFixed(0)}% from the previous period.`,
      });
    }
  }
  return flags;
}
