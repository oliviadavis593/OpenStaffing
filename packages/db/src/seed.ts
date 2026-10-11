/**
 * Local development seed. Creates three clearly fictional hospitals with
 * made-up values so the UI has something to render before you run a real ingest.
 * Every row is marked isSample = true and must never reach production.
 */
import { slugify } from "@openstaffing/core";
import { prisma } from "./index";

const SAMPLE_HOSPITALS = [
  { name: "Sample General Hospital (fictional)", city: "Chicago", rnHppd: 7.4, turnover: 14.2 },
  { name: "Sample Community Hospital (fictional)", city: "Peoria", rnHppd: 6.1, turnover: 21.8 },
  {
    name: "Sample University Medical Center (fictional)",
    city: "Springfield",
    rnHppd: 8.2,
    turnover: 9.6,
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed sample data in production.");
  }

  const rnHours = await prisma.measure.upsert({
    where: { source_sourceMeasureId: { source: "sample", sourceMeasureId: "rn-hppd-medsurg" } },
    update: {},
    create: {
      source: "sample",
      sourceMeasureId: "rn-hppd-medsurg",
      state: "IL",
      name: "Total RN Nursing Hours per Patient Day (Medical-Surgical)",
      unitType: "med_surg",
      metric: "rn_hours_per_patient_day",
      defaultUnit: "hours",
      evidence: "more_is_better",
    },
  });

  const turnover = await prisma.measure.upsert({
    where: { source_sourceMeasureId: { source: "sample", sourceMeasureId: "rn-turnover-medsurg" } },
    update: {},
    create: {
      source: "sample",
      sourceMeasureId: "rn-turnover-medsurg",
      state: "IL",
      name: "RN Turnover Rate in the Medical-Surgical Unit",
      unitType: "med_surg",
      metric: "rn_turnover_rate",
      defaultUnit: "percent",
      evidence: "less_is_better",
    },
  });

  const periodStart = new Date("2025-01-01");
  const periodEnd = new Date("2025-12-31");

  for (const h of SAMPLE_HOSPITALS) {
    const hospital = await prisma.hospital.upsert({
      where: { slug: slugify(h.name) },
      update: {},
      create: { slug: slugify(h.name), name: h.name, city: h.city, state: "IL", isSample: true },
    });

    for (const [measureId, value, unit] of [
      [rnHours.id, h.rnHppd, "hours"],
      [turnover.id, h.turnover, "percent"],
    ] as const) {
      await prisma.measureValue.upsert({
        where: {
          hospitalId_measureId_periodStart_periodEnd: {
            hospitalId: hospital.id,
            measureId,
            periodStart,
            periodEnd,
          },
        },
        update: { value },
        create: { hospitalId: hospital.id, measureId, periodStart, periodEnd, value, unit },
      });
    }
  }

  console.log(`Seeded ${SAMPLE_HOSPITALS.length} fictional sample hospitals.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
