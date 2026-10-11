import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  STAFFING_METRICS,
  UNIT_LABELS,
  type StaffingMetric,
  type UnitType,
} from "@openstaffing/core";
import { Figure } from "@/components/Figure";
import { getHospital } from "@/lib/queries";

export const revalidate = 3600;
export const dynamicParams = true;

/** Pre-render nothing at build time; pages render on first request and are cached. */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hospital = await getHospital(slug);
  return { title: hospital?.name ?? "Hospital" };
}

const SOURCE = {
  name: "Illinois Hospital Report Card",
  url: "https://healthcarereportcard.illinois.gov",
};

function isMetric(value: string | null): value is StaffingMetric {
  return value !== null && (STAFFING_METRICS as readonly string[]).includes(value);
}

export default async function HospitalPage({ params }: Props) {
  const { slug } = await params;
  const hospital = await getHospital(slug);
  if (!hospital) notFound();

  // Latest value per measure. Values arrive sorted newest first.
  const latest = new Map<string, (typeof hospital.measureValues)[number]>();
  for (const v of hospital.measureValues) {
    if (!latest.has(v.measureId)) latest.set(v.measureId, v);
  }
  const rows = [...latest.values()].filter((v) => isMetric(v.measure.metric));

  const latestSnapshot = hospital.ownerships[0]?.snapshotMonth.getTime();
  const owners = hospital.ownerships.filter((o) => o.snapshotMonth.getTime() === latestSnapshot);

  return (
    <>
      <h1>{hospital.name}</h1>
      <p className="lede">
        {[hospital.streetAddress, hospital.city, hospital.state].filter(Boolean).join(", ")}
        {hospital.system ? ` · Part of ${hospital.system.name}` : ""}
      </p>
      {hospital.isSample ? (
        <p className="notice">This is a fictional sample hospital for local development.</p>
      ) : null}

      <section className="card" aria-labelledby="staffing-heading">
        <h2 id="staffing-heading">Nurse staffing by unit</h2>
        {rows.length === 0 ? (
          <p>No staffing data reported yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Unit</th>
                  <th scope="col">Measure</th>
                  <th scope="col">Latest value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td>{UNIT_LABELS[v.measure.unitType as UnitType] ?? v.measure.unitType}</td>
                    <td>{v.measure.name}</td>
                    <td>
                      <Figure
                        metric={v.measure.metric as StaffingMetric}
                        value={v.value}
                        periodStart={v.periodStart}
                        periodEnd={v.periodEnd}
                        sourceName={SOURCE.name}
                        sourceUrl={SOURCE.url}
                        flagged={v.flags.length > 0}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="ownership-heading">
        <h2 id="ownership-heading">Who owns it</h2>
        {owners.length === 0 ? (
          <p>No ownership data loaded yet.</p>
        ) : (
          <ul>
            {owners.map((o) => (
              <li key={o.id}>
                {o.owner.name}
                {o.percentageOwnership !== null ? ` (${o.percentageOwnership}%)` : ""}{" "}
                {o.owner.isPrivateEquity ? <span className="badge">Private equity</span> : null}
                {o.owner.isReit ? <span className="badge">REIT</span> : null}
              </li>
            ))}
          </ul>
        )}
        <p className="figure-meta">
          Source:{" "}
          <a
            href="https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/hospital-all-owners"
            rel="noopener noreferrer"
            target="_blank"
          >
            CMS Hospital All Owners
          </a>
        </p>
      </section>
    </>
  );
}
