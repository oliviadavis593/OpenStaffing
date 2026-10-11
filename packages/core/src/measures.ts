/**
 * Shared staffing measure vocabulary.
 *
 * Each state's adapter maps its own measures onto these keys ONLY when the
 * definitions truly match (see docs/adr/0002-staffing-source-adapters.md).
 * Anything that does not match stays state-specific and is never compared
 * across states.
 */

export const UNIT_TYPES = ["med_surg", "critical_care", "mother_baby", "nicu"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const UNIT_LABELS: Record<UnitType, string> = {
  med_surg: "Medical-Surgical",
  critical_care: "Critical Care",
  mother_baby: "Mother-Baby",
  nicu: "Neonatal ICU",
};

export const STAFFING_METRICS = [
  "rn_hours_per_patient_day",
  "total_nursing_hours_per_patient_day",
  "rn_turnover_rate",
  "rn_vacancy_rate",
  "pct_hours_employed_rn",
  "pct_hours_contract_rn",
  "skill_mix_pct_rn",
] as const;
export type StaffingMetric = (typeof STAFFING_METRICS)[number];

export type Evidence = "more_is_better" | "less_is_better" | "no_evidence";

export interface MetricDefinition {
  key: StaffingMetric;
  label: string;
  unit: "hours" | "percent";
  evidence: Evidence;
  /** Plain-language explanation shown on the Methodology page. */
  description: string;
}

export const METRIC_DEFINITIONS: Record<StaffingMetric, MetricDefinition> = {
  rn_hours_per_patient_day: {
    key: "rn_hours_per_patient_day",
    label: "RN hours per patient day",
    unit: "hours",
    evidence: "more_is_better",
    description:
      "Hours of registered nurse care per patient per day. Higher generally means more nurse time for each patient.",
  },
  total_nursing_hours_per_patient_day: {
    key: "total_nursing_hours_per_patient_day",
    label: "Total nursing hours per patient day",
    unit: "hours",
    evidence: "more_is_better",
    description:
      "Hours of nursing care from all nursing staff (RNs, LPNs, and nurse assistants) per patient per day.",
  },
  rn_turnover_rate: {
    key: "rn_turnover_rate",
    label: "RN turnover rate",
    unit: "percent",
    evidence: "less_is_better",
    description: "Share of registered nurses who left the unit during the reporting period.",
  },
  rn_vacancy_rate: {
    key: "rn_vacancy_rate",
    label: "RN vacancy rate",
    unit: "percent",
    evidence: "less_is_better",
    description: "Share of budgeted registered nurse positions that were unfilled.",
  },
  pct_hours_employed_rn: {
    key: "pct_hours_employed_rn",
    label: "Hours worked by hospital-employed RNs",
    unit: "percent",
    evidence: "no_evidence",
    description: "Share of RN hours worked by nurses the hospital employs directly.",
  },
  pct_hours_contract_rn: {
    key: "pct_hours_contract_rn",
    label: "Hours worked by contract RNs",
    unit: "percent",
    evidence: "no_evidence",
    description:
      "Share of RN hours worked by contract or agency nurses, often used to fill short or long term gaps.",
  },
  skill_mix_pct_rn: {
    key: "skill_mix_pct_rn",
    label: "Skill mix (share of hours by RNs)",
    unit: "percent",
    evidence: "more_is_better",
    description: "Share of all nursing staff hours worked by registered nurses.",
  },
};
