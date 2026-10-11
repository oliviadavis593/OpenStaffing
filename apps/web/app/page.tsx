import Link from "next/link";
import { listHospitals } from "@/lib/queries";

// Rebuilt after each ingest via /api/revalidate; hourly as a fallback.
export const revalidate = 3600;

export default async function HomePage() {
  const hospitals = await listHospitals();

  return (
    <>
      <h1>Is this hospital short-staffed, and who profits from it?</h1>
      <p className="lede">
        OpenStaffing shows how well each Illinois hospital staffs its nursing units, and who owns
        it, using public data. Every number links to its source.
      </p>

      <section className="card" aria-labelledby="hospitals-heading">
        <h2 id="hospitals-heading">Hospitals</h2>
        {hospitals.length === 0 ? (
          <p className="notice">
            No data loaded yet. Run <code>pnpm db:seed</code> for sample data, or{" "}
            <code>pnpm ingest il:hospitals</code> for the real thing. See the README.
          </p>
        ) : (
          <ul>
            {hospitals.map((h) => (
              <li key={h.slug}>
                <Link href={`/hospitals/${h.slug}`}>{h.name}</Link>
                {h.city ? `, ${h.city}` : ""}
                {h.isSample ? <span className="badge">Sample data</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
