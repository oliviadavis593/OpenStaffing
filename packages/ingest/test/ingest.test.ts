import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkValue } from "../src/quality";
import { diffOwnership, normalizeHeader, parseAllOwnersCsv } from "../src/sources/cms/all-owners";
import { ReportCardClient } from "../src/sources/il-report-card/client";
import { hasNextPage, pageSchema } from "../src/sources/il-report-card/schemas";

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

function fakeFetch(pages: string[]) {
  const urls: string[] = [];
  const impl = (async (url: string) => {
    urls.push(url);
    const body = pages.shift();
    if (!body) throw new Error("no more pages");
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { impl, urls };
}

describe("Report Card client", () => {
  it("follows both Laravel pagination envelopes and validates every value", async () => {
    const { impl, urls } = fakeFetch([
      fixture("report-card-values-page1.json"),
      fixture("report-card-values-page2.json"),
    ]);
    const client = new ReportCardClient({
      fetchImpl: impl,
      requestsPerSecond: 0,
      sleep: async () => {},
    });
    const values = [];
    for await (const v of client.values({ measure_id: 900001 })) values.push(v);

    expect(values.map((v) => v.entity_id)).toEqual([1, 2, 3]);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("/api/values?measure_id=900001&per_page=100&page=1");
  });

  it("fails loudly when the API shape changes", async () => {
    const { impl } = fakeFetch([JSON.stringify({ data: [{ measure_id: "oops" }] })]);
    const client = new ReportCardClient({
      fetchImpl: impl,
      requestsPerSecond: 0,
      sleep: async () => {},
    });
    const run = async () => {
      for await (const _ of client.values({})) void _;
    };
    await expect(run()).rejects.toThrow();
  });

  it("retries a 503 and then succeeds", async () => {
    let calls = 0;
    const impl = (async () => {
      calls++;
      if (calls === 1) return new Response("busy", { status: 503 });
      return new Response(fixture("report-card-values-page2.json"), { status: 200 });
    }) as unknown as typeof fetch;
    const client = new ReportCardClient({
      fetchImpl: impl,
      requestsPerSecond: 0,
      sleep: async () => {},
    });
    const values = [];
    for await (const v of client.values({})) values.push(v);
    expect(calls).toBe(2);
    expect(values).toHaveLength(1);
  });

  it("detects the last page", () => {
    expect(hasNextPage(pageSchema.parse({ data: [], current_page: 2, last_page: 2 }))).toBe(false);
    expect(hasNextPage(pageSchema.parse({ data: [], links: { next: "x" } }))).toBe(true);
  });
});

describe("CMS All Owners", () => {
  it("normalizes headers", () => {
    expect(normalizeHeader("ASSOCIATE ID - OWNER")).toBe("ASSOCIATE_ID_OWNER");
  });

  it("parses rows and Y/N flags", () => {
    const rows = parseAllOwnersCsv(fixture("cms-all-owners-sample.csv"));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      ownerName: "FICTIONAL HOLDINGS LLC",
      isPrivateEquity: true,
      isReit: false,
      percentageOwnership: 100,
    });
    expect(rows[1]?.isNonProfit).toBe(true);
  });

  it("diffs ownership snapshots", () => {
    const before = [
      { ownerAssociateId: "A", percentageOwnership: 100, isPrivateEquity: false, isReit: false },
      { ownerAssociateId: "B", percentageOwnership: 50, isPrivateEquity: false, isReit: false },
    ];
    const after = [
      { ownerAssociateId: "B", percentageOwnership: 60, isPrivateEquity: true, isReit: false },
      { ownerAssociateId: "C", percentageOwnership: 40, isPrivateEquity: false, isReit: true },
    ];
    const types = diffOwnership(before, after)
      .map((c) => `${c.type}:${c.ownerAssociateId}`)
      .sort();
    expect(types).toEqual([
      "OWNER_ADDED:C",
      "OWNER_REMOVED:A",
      "PERCENT_CHANGED:B",
      "PE_FLAG_ADDED:B",
      "REIT_FLAG_ADDED:C",
    ]);
  });
});

describe("quality checks", () => {
  it("flags zeros, missing units, and large swings", () => {
    const reasons = checkValue({ value: 0, unit: null, previousValue: 8 }).map((f) => f.reason);
    expect(reasons).toEqual(["ZERO_REPORTED", "MISSING_UNIT", "LARGE_CHANGE"]);
    expect(checkValue({ value: 7.6, unit: "hours", previousValue: 7.4 })).toEqual([]);
  });
});
