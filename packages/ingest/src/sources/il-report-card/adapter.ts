import type { Evidence } from "@openstaffing/core";
import type { SourceHospital, SourceMeasure, SourceValue, StaffingSource } from "../types";
import { ReportCardClient } from "./client";
import { IL_STAFFING_MEASURES } from "./staffing-measures";

const EVIDENCE_MAP: Record<string, Evidence> = {
  more_is_better: "more_is_better",
  less_is_better: "less_is_better",
};

/** Illinois Hospital Report Card, the first StaffingSource implementation. */
export class IllinoisReportCardSource implements StaffingSource {
  readonly key = "il-report-card";
  readonly state = "IL" as const;
  readonly metadata = {
    name: "Illinois Hospital Report Card (Illinois Department of Public Health)",
    url: "https://healthcarereportcard.illinois.gov",
    license: "Public data published under the Illinois Hospital Report Card Act",
    refreshCadence: "Annual reporting periods; checked weekly",
  };

  constructor(private readonly client = new ReportCardClient()) {}

  async listHospitals(): Promise<SourceHospital[]> {
    const out: SourceHospital[] = [];
    for await (const h of this.client.hospitals()) {
      const id = h.entity_id ?? h.id;
      out.push({
        sourceHospitalId: String(id),
        name: h.name,
        streetAddress: h.address ?? h.street ?? undefined,
        city: h.city ?? undefined,
        zip: h.zip === null || h.zip === undefined ? undefined : String(h.zip),
        isClosed: h.closed ?? undefined,
      });
    }
    return out;
  }

  async listMeasures(): Promise<SourceMeasure[]> {
    const out: SourceMeasure[] = [];
    for (const [id, vocab] of Object.entries(IL_STAFFING_MEASURES)) {
      const m = await this.client.measure(Number(id));
      out.push({
        sourceMeasureId: String(m.measure_id),
        name: m.name,
        description: m.description ?? undefined,
        defaultUnit: m.default_unit ?? undefined,
        evidence: (m.evidence && EVIDENCE_MAP[m.evidence]) || "no_evidence",
        ...vocab,
      });
    }
    return out;
  }

  async *listValues(measureIds: string[], since?: Date): AsyncIterable<SourceValue> {
    for (const measureId of measureIds) {
      const filters = {
        measure_id: Number(measureId),
        ...(since ? { date_end__gte: since.toISOString().slice(0, 10) } : {}),
      };
      for await (const v of this.client.values(filters)) {
        yield {
          sourceMeasureId: String(v.measure_id),
          sourceHospitalId: String(v.entity_id),
          periodStart: new Date(v.date_start),
          periodEnd: new Date(v.date_end),
          value: v.value,
          unit: v.unit ?? undefined,
          numerator: v.numerator ?? undefined,
          denominator: v.denominator ?? undefined,
        };
      }
    }
  }
}
