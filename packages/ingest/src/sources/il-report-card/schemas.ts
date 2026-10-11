import { z } from "zod";

/**
 * Zod schemas for the Illinois Hospital Report Card API
 * (https://healthcarereportcard.illinois.gov/api/docs).
 *
 * The value and measure models below follow the published docs. The
 * pagination envelope and the hospital model are deliberately permissive
 * until they are confirmed against live responses (Jira: "Build a typed
 * Illinois Report Card API client"). Tighten them, then update the fixtures.
 */

/** Docs: "name: A collection of names for the measure." Accept a string, a list, or a keyed object. */
const localizedText = z
  .union([z.string(), z.array(z.string()), z.record(z.string(), z.string())])
  .transform((v) => {
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v[0] ?? "";
    return v.en ?? v.default ?? Object.values(v)[0] ?? "";
  });

export const measureSchema = z
  .object({
    measure_id: z.number().int(),
    name: localizedText,
    description: localizedText.nullish(),
    rationale: localizedText.nullish(),
    author_measure_id: z.string().nullish(),
    evidence: z
      .enum([
        "more_is_better",
        "less_is_better",
        "no_evidence",
        "no_difference",
        "within_range_is_better",
      ])
      .nullish(),
    measure_type: z.string().nullish(),
    default_unit: z.string().nullish(),
  })
  .passthrough();
export type ReportCardMeasure = z.infer<typeof measureSchema>;

export const valueSchema = z
  .object({
    measure_id: z.number().int(),
    entity_id: z.number().int(),
    date_start: z.string(),
    date_end: z.string(),
    value: z.number(),
    unit: z.string().nullish(),
    numerator: z.number().int().nullish(),
    denominator: z.number().int().nullish(),
    sig_var_state: z.number().int().nullish(),
    lower_ci: z.number().nullish(),
    upper_ci: z.number().nullish(),
  })
  .passthrough();
export type ReportCardValue = z.infer<typeof valueSchema>;

/** TODO(verify): confirm field names against a live /api/hospitals response. */
export const hospitalSchema = z
  .object({
    entity_id: z.number().int().optional(),
    id: z.number().int().optional(),
    name: localizedText,
    address: z.string().nullish(),
    street: z.string().nullish(),
    city: z.string().nullish(),
    zip: z.union([z.string(), z.number()]).nullish(),
    closed: z.boolean().nullish(),
  })
  .passthrough()
  .refine((h) => h.entity_id !== undefined || h.id !== undefined, {
    message: "hospital has neither entity_id nor id",
  });
export type ReportCardHospital = z.infer<typeof hospitalSchema>;

/**
 * Accepts the two common Laravel pagination envelopes:
 *  - { data, current_page, last_page, next_page_url, ... }
 *  - { data, links: { next }, meta: { current_page, last_page } }
 */
export const pageSchema = z
  .object({
    data: z.array(z.unknown()),
    next_page_url: z.string().nullish(),
    current_page: z.number().int().optional(),
    last_page: z.number().int().optional(),
    links: z
      .union([z.object({ next: z.string().nullish() }).passthrough(), z.array(z.unknown())])
      .optional(),
    meta: z
      .object({ current_page: z.number().int().optional(), last_page: z.number().int().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();
export type ReportCardPage = z.infer<typeof pageSchema>;

export function hasNextPage(page: ReportCardPage): boolean {
  if (page.next_page_url) return true;
  if (page.links && !Array.isArray(page.links) && page.links.next) return true;
  const current = page.current_page ?? page.meta?.current_page;
  const last = page.last_page ?? page.meta?.last_page;
  return current !== undefined && last !== undefined && current < last;
}
