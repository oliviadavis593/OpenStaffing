import { parse } from "csv-parse/sync";
import { z } from "zod";

/**
 * CMS Hospital All Owners (monthly CSV):
 * https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/hospital-all-owners
 *
 * Column names follow the CMS data dictionary. Headers are normalized
 * (upper-cased, punctuation collapsed) before lookup so small formatting
 * differences between monthly files don't break ingest.
 * TODO(verify): confirm each header against the latest data dictionary PDF.
 */

const yesNo = z
  .string()
  .optional()
  .transform((v) => (v === "Y" ? true : v === "N" ? false : null));

export const ownerRowSchema = z.object({
  enrollmentId: z.string().min(1),
  organizationName: z.string().min(1),
  ownerAssociateId: z.string().min(1),
  ownerName: z.string().min(1),
  ownerType: z.string().optional(),
  percentageOwnership: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : Number(v))),
  associationDate: z.string().optional(),
  isPrivateEquity: yesNo,
  isReit: yesNo,
  isHoldingCompany: yesNo,
  isForProfit: yesNo,
  isNonProfit: yesNo,
});
export type OwnerRow = z.infer<typeof ownerRowSchema>;

const HEADER_MAP: Record<string, keyof z.input<typeof ownerRowSchema>> = {
  ENROLLMENT_ID: "enrollmentId",
  ORGANIZATION_NAME: "organizationName",
  ASSOCIATE_ID_OWNER: "ownerAssociateId",
  ORGANIZATION_NAME_OWNER: "ownerName",
  TYPE_OWNER: "ownerType",
  PERCENTAGE_OWNERSHIP: "percentageOwnership",
  ASSOCIATION_DATE_OWNER: "associationDate",
  PRIVATE_EQUITY_COMPANY_OWNER: "isPrivateEquity",
  REIT_OWNER: "isReit",
  HOLDING_COMPANY_OWNER: "isHoldingCompany",
  FOR_PROFIT_OWNER: "isForProfit",
  NON_PROFIT_OWNER: "isNonProfit",
};

export function normalizeHeader(header: string): string {
  return header
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Parse one monthly CSV into validated rows. Unknown columns are ignored. */
export function parseAllOwnersCsv(csv: string): OwnerRow[] {
  const records = parse(csv, { columns: true, skip_empty_lines: true, bom: true }) as Record<
    string,
    string
  >[];
  return records.map((record, i) => {
    const mapped: Record<string, string> = {};
    for (const [header, value] of Object.entries(record)) {
      const key = HEADER_MAP[normalizeHeader(header)];
      if (key) mapped[key] = value.trim();
    }
    // Individual owners have no organization name; fall back to a combined person name if present.
    if (!mapped.ownerName) {
      const first = record["FIRST NAME - OWNER"] ?? "";
      const last = record["LAST NAME - OWNER"] ?? "";
      mapped.ownerName = `${first} ${last}`.trim();
    }
    const result = ownerRowSchema.safeParse(mapped);
    if (!result.success) {
      throw new Error(`CMS owners row ${i + 2} is invalid: ${result.error.message}`);
    }
    return result.data;
  });
}

export type OwnershipChangeType =
  "OWNER_ADDED" | "OWNER_REMOVED" | "PERCENT_CHANGED" | "PE_FLAG_ADDED" | "REIT_FLAG_ADDED";

export interface SnapshotOwner {
  ownerAssociateId: string;
  percentageOwnership: number | null;
  isPrivateEquity: boolean | null;
  isReit: boolean | null;
}

export interface OwnershipDiff {
  type: OwnershipChangeType;
  ownerAssociateId: string;
  details?: Record<string, unknown>;
}

/** Compare one hospital's owners across two consecutive monthly snapshots. */
export function diffOwnership(
  previous: readonly SnapshotOwner[],
  current: readonly SnapshotOwner[],
): OwnershipDiff[] {
  const prev = new Map(previous.map((o) => [o.ownerAssociateId, o]));
  const curr = new Map(current.map((o) => [o.ownerAssociateId, o]));
  const changes: OwnershipDiff[] = [];

  for (const [id, now] of curr) {
    const before = prev.get(id);
    if (!before) {
      changes.push({ type: "OWNER_ADDED", ownerAssociateId: id });
      if (now.isPrivateEquity) changes.push({ type: "PE_FLAG_ADDED", ownerAssociateId: id });
      if (now.isReit) changes.push({ type: "REIT_FLAG_ADDED", ownerAssociateId: id });
      continue;
    }
    if (before.percentageOwnership !== now.percentageOwnership) {
      changes.push({
        type: "PERCENT_CHANGED",
        ownerAssociateId: id,
        details: { from: before.percentageOwnership, to: now.percentageOwnership },
      });
    }
    if (!before.isPrivateEquity && now.isPrivateEquity) {
      changes.push({ type: "PE_FLAG_ADDED", ownerAssociateId: id });
    }
    if (!before.isReit && now.isReit) {
      changes.push({ type: "REIT_FLAG_ADDED", ownerAssociateId: id });
    }
  }
  for (const id of prev.keys()) {
    if (!curr.has(id)) changes.push({ type: "OWNER_REMOVED", ownerAssociateId: id });
  }
  return changes;
}
