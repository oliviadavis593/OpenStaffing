import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OpenStaffing", template: "%s | OpenStaffing" },
  description:
    "Free, open-source data on how well hospitals staff their nurses, and who owns them. Every number links to its public source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only">
          Skip to content
        </a>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              OpenStaffing
            </Link>
            <nav aria-label="Main">
              <Link href="/">Hospitals</Link>
              <Link href="/methodology">Methodology</Link>
            </nav>
          </div>
        </header>
        <main id="main" className="container">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container">
            <p>
              OpenStaffing republishes public data from the Illinois Hospital Report Card and the
              Centers for Medicare &amp; Medicaid Services. It is not affiliated with any hospital,
              union, or government agency. See the <Link href="/methodology">methodology</Link> for
              sources and limits.
            </p>
            <p>No cookies, no ad trackers. Open source under the MIT License.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
