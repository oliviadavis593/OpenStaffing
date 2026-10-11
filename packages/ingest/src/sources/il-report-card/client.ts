import type { z } from "zod";
import { createPoliteFetch, type PoliteFetchOptions } from "../../http";
import {
  hasNextPage,
  hospitalSchema,
  measureSchema,
  pageSchema,
  valueSchema,
  type ReportCardHospital,
  type ReportCardMeasure,
  type ReportCardValue,
} from "./schemas";

export type ValueFilters = Partial<{
  measure_id: number;
  entity_id: number;
  date_start__gte: string;
  date_end__lte: string;
  date_end__gte: string;
}>;

/** Typed client for https://healthcarereportcard.illinois.gov/api/docs */
export class ReportCardClient {
  private readonly baseUrl: string;
  private readonly get: (url: string) => Promise<unknown>;

  constructor(options: PoliteFetchOptions & { baseUrl?: string } = {}) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.IL_REPORT_CARD_BASE_URL ??
      "https://healthcarereportcard.illinois.gov"
    ).replace(/\/$/, "");
    this.get = createPoliteFetch(options);
  }

  measures(filters: Record<string, string> = {}): AsyncGenerator<ReportCardMeasure> {
    return this.paginate("/api/measures", filters, measureSchema);
  }

  /** GET /api/measures/:measure_id. Accepts a bare object or a { data } wrapper. */
  async measure(measureId: number): Promise<ReportCardMeasure> {
    const raw = (await this.get(`${this.baseUrl}/api/measures/${measureId}`)) as { data?: unknown };
    return measureSchema.parse(raw && typeof raw === "object" && "data" in raw ? raw.data : raw);
  }

  hospitals(): AsyncGenerator<ReportCardHospital> {
    return this.paginate("/api/hospitals", {}, hospitalSchema);
  }

  values(filters: ValueFilters): AsyncGenerator<ReportCardValue> {
    const params = Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, String(v)]));
    return this.paginate("/api/values", params, valueSchema);
  }

  private async *paginate<S extends z.ZodTypeAny>(
    path: string,
    params: Record<string, string>,
    itemSchema: S,
  ): AsyncGenerator<z.infer<S>> {
    for (let page = 1; ; page++) {
      const query = new URLSearchParams({ ...params, per_page: "100", page: String(page) });
      const raw = await this.get(`${this.baseUrl}${path}?${query}`);
      const parsed = pageSchema.parse(raw);
      for (const item of parsed.data) {
        // Fail loudly: a changed API should stop ingest, not publish bad numbers.
        yield itemSchema.parse(item);
      }
      if (!hasNextPage(parsed) || parsed.data.length === 0) return;
    }
  }
}
