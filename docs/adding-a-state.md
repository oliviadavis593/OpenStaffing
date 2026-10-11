# Adding a state

OpenStaffing grows one state at a time. Ownership data is already national; staffing data needs
an adapter per state.

## Before writing code

A state is added when two things are true:

1. **It publishes usable hospital staffing data.** Record what exists, its granularity (hospital
   or unit), format (API, CSV, PDF), refresh cadence, and license.
2. **A local partner wants it,** such as a nurses' union, a staffing campaign, or an advocacy
   group.

## Checklist

- [ ] Research notes added to `docs/states/<code>.md` with links to every official source
- [ ] Adapter in `packages/ingest/src/sources/<state>-<source>/` implementing `StaffingSource`
      (`packages/ingest/src/sources/types.ts`)
- [ ] Zod schemas for every response, with recorded fixtures and tests
- [ ] Measures mapped to the shared vocabulary in `packages/core/src/measures.ts` **only** where
      the definition truly matches; everything else stays state-specific
- [ ] State code added to `STATES_WITH_STAFFING_DATA` in `packages/core/src/states.ts`
- [ ] A methodology section for the state (sources, periods, caveats)
- [ ] CLI commands added to `packages/ingest/src/cli.ts`
- [ ] Local partner previews the state's pages before public release

## Template

Copy the Illinois adapter (`packages/ingest/src/sources/il-report-card/`) as a starting point.
