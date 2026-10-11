import type { StateCode, StaffingMetric, UnitType, Evidence } from "@openstaffing/core";

/**
 * Every state's staffing data comes in through one of these.
 * Adding a state means writing one adapter, not changing the app.
 * See docs/adr/0002-staffing-source-adapters.md.
 */
export interface StaffingSource {
  /** Stable key stored on Measure.source, for example "il-report-card". */
  readonly key: string;
  readonly state: StateCode;
  readonly metadata: SourceMetadata;
  listHospitals(): Promise<SourceHospital[]>;
  listMeasures(): Promise<SourceMeasure[]>;
  /** Values for the given measures, optionally only those whose period ends on or after `since`. */
  listValues(measureIds: string[], since?: Date): AsyncIterable<SourceValue>;
}

export interface SourceMetadata {
  name: string;
  url: string;
  license: string;
  refreshCadence: string;
}

export interface SourceHospital {
  sourceHospitalId: string;
  name: string;
  streetAddress?: string;
  city?: string;
  zip?: string;
  isClosed?: boolean;
}

export interface SourceMeasure {
  sourceMeasureId: string;
  name: string;
  description?: string;
  defaultUnit?: string;
  evidence?: Evidence;
  /** Set only when the definition truly matches the shared vocabulary. */
  unitType?: UnitType;
  metric?: StaffingMetric;
}

export interface SourceValue {
  sourceMeasureId: string;
  sourceHospitalId: string;
  periodStart: Date;
  periodEnd: Date;
  value: number;
  unit?: string;
  numerator?: number;
  denominator?: number;
}
