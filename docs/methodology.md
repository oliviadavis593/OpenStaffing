# Methodology (draft)

This is the working draft of the public Methodology page. Keep the two in sync.

## Measures

Definitions live in `packages/core/src/measures.ts` and render on `/methodology`. Each measure
records whether more is better, less is better, or neither, and its unit.

## Peer comparison

Each hospital is compared with the statewide median and its percentile rank for each measure.
Peer groups (planned): same region and similar bed count. The exact definition will be published
here before peer comparisons go live.

## Quality flags

A value is flagged, and shown with a "Check data" label, when it is:

- reported as zero where the unit likely exists,
- missing a unit, or
- more than 50% different from the same hospital's previous period.

Flagged values are never hidden.

## Matching hospitals across datasets

State and federal datasets use different hospital IDs. We normalize names and addresses, score
candidate matches with trigram similarity, auto-accept strong matches, and review the rest by
hand. Every decision is stored and auditable.

## Comparing across states

Staffing measures are only compared across states when their definitions truly match. Otherwise
each state's measures stand on their own.

## Corrections

Report errors through a GitHub issue using the "Data error" template. Corrections are made in
public with a note of what changed.
