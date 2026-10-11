import type { Metadata } from "next";
import { METRIC_DEFINITIONS, STAFFING_METRICS } from "@openstaffing/core";

export const metadata: Metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <>
      <h1>Methodology</h1>
      <p className="lede">
        What each number means, where it comes from, and what it cannot tell you. This page is a
        draft and will grow with the project.
      </p>

      <section className="card" aria-labelledby="measures-heading">
        <h2 id="measures-heading">Staffing measures</h2>
        <dl>
          {STAFFING_METRICS.map((key) => {
            const m = METRIC_DEFINITIONS[key];
            return (
              <div key={key}>
                <dt>
                  <strong>{m.label}</strong>
                </dt>
                <dd>{m.description}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="card" aria-labelledby="limits-heading">
        <h2 id="limits-heading">Known limits</h2>
        <ul>
          <li>
            Hospitals report their own staffing data to the Illinois Department of Public Health.
            The state notes that differences can reflect how each hospital defines the complexity of
            care in a unit.
          </li>
          <li>
            Federal ownership data has known gaps. Owner records for some hospitals are incomplete
            or inconsistent.
          </li>
          <li>
            Values that look unusual (zeros, missing units, or changes over 50% from the previous
            period) are shown with a &ldquo;Check data&rdquo; label rather than hidden.
          </li>
          <li>
            Staffing measures are only compared across states when their definitions truly match.
          </li>
        </ul>
      </section>

      <section className="card" aria-labelledby="sources-heading">
        <h2 id="sources-heading">Sources</h2>
        <ul>
          <li>
            <a href="https://healthcarereportcard.illinois.gov">Illinois Hospital Report Card</a>
          </li>
          <li>
            <a href="https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/hospital-all-owners">
              CMS Hospital All Owners
            </a>
          </li>
        </ul>
        <p>Found an error? Open an issue on GitHub so it can be checked and corrected in public.</p>
      </section>
    </>
  );
}
