import type { StaffingMetric, UnitType } from "@openstaffing/core";

/**
 * Report Card measure_id -> shared vocabulary.
 *
 * Empty on purpose: fill it in with `npm run ingest -- il:measures:discover "Nursing Hours"`
 * and the other staffing measure names (Jira: "Catalog the nurse staffing measures").
 * Never guess an ID. A test fails if a mapped ID disappears from the API.
 *
 * Leads already seen on the public site (verify before using):
 *  - Med-surg skill mix chart used measures 10668, 10669, 10670
 *  - Critical care skill mix chart used measures 10671, 10672, 10673
 */
export const IL_STAFFING_MEASURES: Record<number, { unitType: UnitType; metric: StaffingMetric }> =
  {};
