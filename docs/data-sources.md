# Data sources

Every number on OpenStaffing comes from one of these public sources. Each page links to the
source it used.

## Illinois Hospital Report Card

- **Publisher:** Illinois Department of Public Health
- **Site:** https://healthcarereportcard.illinois.gov
- **API docs:** https://healthcarereportcard.illinois.gov/api/docs
- **What we use:** unit-level nurse staffing for medical-surgical, critical care, mother-baby, and
  NICU units: total RN hours per patient day, total nursing hours per patient day, RN turnover, RN
  vacancy, percent of hours worked by employed and contract RNs, and skill mix.
- **Endpoints:** `GET /api/measures`, `GET /api/measures/:id`, `GET /api/hospitals`,
  `GET /api/values` (filters: `measure_id`, `entity_id`, `date_start`, `date_end`, with `__gte`,
  `__lte`, `__gt`, `__lt`, `__neq` modifiers). Paginated, up to 100 per page.
- **Caveats:** hospitals self-report. The state notes that some differences reflect how each
  hospital defines the complexity of care in a unit.
- **To verify in code:** the pagination envelope and the hospital model's field names. The
  client accepts both common shapes until confirmed (see
  `packages/ingest/src/sources/il-report-card/schemas.ts`).

## CMS Hospital All Owners

- **Publisher:** Centers for Medicare & Medicaid Services
- **Dataset:** https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/hospital-all-owners
- **What we use:** every owner of every Medicare-enrolled hospital: name, type, ownership
  percentage, association date, and yes/no flags for private equity, REIT, holding company,
  for-profit, and non-profit.
- **Format:** CSV, a new snapshot monthly. Joined to hospitals through the CMS Hospital
  Enrollments file (state and CCN).
- **Caveats:** an HHS analysis found problematic owner data for a meaningful share of hospitals.
  Ownership flags are cross-checked against the PESP tracker.
- **To verify in code:** column headers against the current data dictionary (see
  `packages/ingest/src/sources/cms/all-owners.ts`).

## PESP Private Equity Hospital Tracker

- **Publisher:** Private Equity Stakeholder Project
- **Tracker:** https://pestakeholder.org/pesp-private-equity-hospital-tracker/
- **Use:** a cross-check for private equity ownership flags. Ask PESP for permission and their
  preferred citation before importing; credit and link them wherever their data appears.

## Census TIGER/Line and Geocoder

- **Publisher:** U.S. Census Bureau
- **Use:** geocoding hospital addresses and assigning Illinois House and Senate districts.

## Licensing and attribution

OpenStaffing code is MIT licensed. Republished data stays subject to its publisher's terms. Every
page and every CSV download names its source and reporting period.
