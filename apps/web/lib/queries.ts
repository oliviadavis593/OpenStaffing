import { hasDatabase, prisma } from "@openstaffing/db";

/** Hospitals with any staffing data, for the home page. Empty without a database. */
export async function listHospitals() {
  if (!hasDatabase()) return [];
  try {
    return await prisma.hospital.findMany({
      where: { measureValues: { some: {} }, isClosed: false },
      select: { slug: true, name: true, city: true, state: true, isSample: true },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.warn("Could not load hospitals. Is the database running?", err);
    return [];
  }
}

export async function getHospital(slug: string) {
  if (!hasDatabase()) return null;
  return prisma.hospital.findUnique({
    where: { slug },
    include: {
      system: true,
      measureValues: {
        include: { measure: true, flags: true },
        orderBy: { periodEnd: "desc" },
      },
      ownerships: {
        include: { owner: true },
        orderBy: { snapshotMonth: "desc" },
      },
    },
  });
}
