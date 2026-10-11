# ADR 0002: Staffing source adapters and cross-state comparability

- **Status:** Accepted
- **Date:** 2026-10-11

## Context

There is no national dataset of unit-level hospital nurse staffing. Each state that publishes
anything publishes something different. Ownership data, by contrast, is already national through
CMS.

## Decision

- Every hospital carries a two-letter `state` code from day one.
- CMS ownership ingest loads every state. The v1 UI filters to Illinois.
- Each state's staffing data enters through a `StaffingSource` adapter
  (`listHospitals`, `listMeasures`, `listValues`, plus source metadata).
- A source measure maps to the shared vocabulary (`unitType` + `metric`) only when its definition
  truly matches. Unmapped measures remain state-specific and are never ranked or compared across
  states.

## Consequences

- Adding a state means writing one adapter and one methodology section, not changing the app.
- Cross-state comparisons are rarer but defensible.
- The Illinois Report Card adapter is the reference implementation.
