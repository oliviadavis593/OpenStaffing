/**
 * OpenStaffing ingest CLI. Run from the repo root:
 *   npm run ingest -- help
 */
import { readFile } from "node:fs/promises";
import { slugify } from "@openstaffing/core";
import { prisma } from "@openstaffing/db";
import { checkValue } from "./quality";
import { parseAllOwnersCsv } from "./sources/cms/all-owners";
import { IllinoisReportCardSource } from "./sources/il-report-card/adapter";
import { ReportCardClient } from "./sources/il-report-card/client";
import { IL_STAFFING_MEASURES } from "./sources/il-report-card/staffing-measures";

const HELP = `OpenStaffing ingest

Usage: npm run ingest -- <command> [args]

Commands:
  il:measures:discover <text>   Search Report Card measures by name (no database needed)
  il:hospitals                  Upsert every Illinois hospital from the Report Card
  il:values [--since YYYY-MM-DD] Upsert values for every mapped staffing measure
  cms:owners:inspect <file.csv> Parse a CMS Hospital All Owners CSV and print a summary (no database needed)
  help                          Show this message
`;

async function discoverMeasures(text: string) {
  if (!text)
    throw new Error(
      'Pass search text, for example: npm run ingest -- il:measures:discover "Nursing Hours"',
    );
  const client = new ReportCardClient();
  let count = 0;
  for await (const m of client.measures({ name: text })) {
    if (!m.name.toLowerCase().includes(text.toLowerCase())) continue;
    count++;
    console.log(`${m.measure_id}\t${m.default_unit ?? ""}\t${m.evidence ?? ""}\t${m.name}`);
  }
  console.log(
    `\n${count} matching measure(s). Add the right IDs to src/sources/il-report-card/staffing-measures.ts.`,
  );
}

async function withIngestRun(source: string, job: (counts: Counts) => Promise<void>) {
  const run = await prisma.ingestRun.create({ data: { source } });
  const counts: Counts = { inserted: 0, updated: 0, skipped: 0 };
  try {
    await job(counts);
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: { status: "SUCCEEDED", finishedAt: new Date(), ...counts },
    });
    console.log(`${source}: ${JSON.stringify(counts)}`);
  } catch (err) {
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: new Date(), error: String(err), ...counts },
    });
    throw err;
  }
}

interface Counts {
  inserted: number;
  updated: number;
  skipped: number;
}

async function ingestIllinoisHospitals() {
  const source = new IllinoisReportCardSource();
  await withIngestRun(`${source.key}:hospitals`, async (counts) => {
    for (const h of await source.listHospitals()) {
      const reportCardEntityId = Number(h.sourceHospitalId);
      const existing = await prisma.hospital.findUnique({ where: { reportCardEntityId } });
      const data = {
        name: h.name,
        state: source.state,
        city: h.city ?? null,
        streetAddress: h.streetAddress ?? null,
        zip: h.zip ?? null,
        isClosed: h.isClosed ?? false,
      };
      if (existing) {
        await prisma.hospital.update({ where: { id: existing.id }, data });
        counts.updated++;
      } else {
        await prisma.hospital.create({
          data: { ...data, reportCardEntityId, slug: slugify(`${h.name} ${h.city ?? ""} il`) },
        });
        counts.inserted++;
      }
    }
  });
}

async function ingestIllinoisValues(since?: Date) {
  const source = new IllinoisReportCardSource();
  const measureIds = Object.keys(IL_STAFFING_MEASURES);
  if (measureIds.length === 0) {
    throw new Error(
      "No staffing measures are mapped yet. Run il:measures:discover and fill in staffing-measures.ts first.",
    );
  }

  await withIngestRun(`${source.key}:values`, async (counts) => {
    const measureRowIds = new Map<string, string>();
    for (const m of await source.listMeasures()) {
      const row = await prisma.measure.upsert({
        where: {
          source_sourceMeasureId: { source: source.key, sourceMeasureId: m.sourceMeasureId },
        },
        update: {
          name: m.name,
          description: m.description,
          defaultUnit: m.defaultUnit,
          evidence: m.evidence,
          unitType: m.unitType,
          metric: m.metric,
        },
        create: { source: source.key, state: source.state, ...m },
      });
      measureRowIds.set(m.sourceMeasureId, row.id);
    }

    const hospitals = await prisma.hospital.findMany({
      where: { reportCardEntityId: { not: null } },
      select: { id: true, reportCardEntityId: true },
    });
    const hospitalIds = new Map(hospitals.map((h) => [String(h.reportCardEntityId), h.id]));

    for await (const v of source.listValues(measureIds, since)) {
      const hospitalId = hospitalIds.get(v.sourceHospitalId);
      const measureId = measureRowIds.get(v.sourceMeasureId);
      if (!hospitalId || !measureId) {
        counts.skipped++;
        continue;
      }
      const previous = await prisma.measureValue.findFirst({
        where: { hospitalId, measureId, periodEnd: { lt: v.periodStart } },
        orderBy: { periodEnd: "desc" },
      });
      const key = { hospitalId, measureId, periodStart: v.periodStart, periodEnd: v.periodEnd };
      const existed = await prisma.measureValue.findUnique({
        where: { hospitalId_measureId_periodStart_periodEnd: key },
        select: { id: true },
      });
      const saved = await prisma.measureValue.upsert({
        where: { hospitalId_measureId_periodStart_periodEnd: key },
        update: {
          value: v.value,
          unit: v.unit,
          numerator: v.numerator,
          denominator: v.denominator,
        },
        create: {
          ...key,
          value: v.value,
          unit: v.unit,
          numerator: v.numerator,
          denominator: v.denominator,
        },
      });
      for (const flag of checkValue({
        value: v.value,
        unit: v.unit,
        previousValue: previous?.value,
      })) {
        await prisma.qualityFlag.upsert({
          where: { measureValueId_reason: { measureValueId: saved.id, reason: flag.reason } },
          update: { detail: flag.detail },
          create: { measureValueId: saved.id, ...flag },
        });
      }
      if (existed) counts.updated++;
      else counts.inserted++;
    }
  });
}

async function inspectCmsOwners(file: string) {
  if (!file) throw new Error("Pass the path to a downloaded Hospital All Owners CSV.");
  const rows = parseAllOwnersCsv(await readFile(file, "utf8"));
  const hospitals = new Set(rows.map((r) => r.enrollmentId));
  const pe = rows.filter((r) => r.isPrivateEquity);
  const reit = rows.filter((r) => r.isReit);
  console.log(`Rows: ${rows.length}`);
  console.log(`Hospital enrollments: ${hospitals.size}`);
  console.log(`Owner rows flagged private equity: ${pe.length}`);
  console.log(`Owner rows flagged REIT: ${reit.length}`);
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  switch (command) {
    case "il:measures:discover":
      return discoverMeasures(args.join(" "));
    case "il:hospitals":
      return ingestIllinoisHospitals();
    case "il:values": {
      const i = args.indexOf("--since");
      const since = i >= 0 && args[i + 1] ? new Date(args[i + 1] as string) : undefined;
      return ingestIllinoisValues(since);
    }
    case "cms:owners:inspect":
      return inspectCmsOwners(args[0] ?? "");
    default:
      console.log(HELP);
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
