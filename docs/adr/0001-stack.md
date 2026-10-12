# ADR 0001: Stack and hosting

- **Status:** Accepted
- **Date:** 2026-10-11

## Context

OpenStaffing is built mostly by one maintainer on evenings and weekends, with volunteers who may
contribute for a single hack night. It must be cheap to host, fast on phones, and easy to set up.

## Decision

- TypeScript everywhere, in an npm workspaces + Turborepo monorepo.
- Next.js (App Router) on Vercel. Hospital pages are static and revalidated after each ingest.
- Postgres (Neon in production, Docker locally) with Prisma, plus `pg_trgm` for fuzzy matching
  and PostGIS for districts.
- Ingest runs as plain Node scripts on GitHub Actions schedules, so long jobs avoid serverless
  timeouts and run logs are public.
- Zod validates every external response; a changed upstream API stops ingest instead of
  publishing bad numbers.
- Vitest for unit tests; Playwright smoke tests later.
- No AI in v1. Plain-language summaries come from templates over computed numbers, so nothing can
  be invented.

## Consequences

- One language and one set of tools for every contributor.
- Hosting stays near free at Illinois scale.
- Public Actions logs double as an audit trail for every data refresh.
