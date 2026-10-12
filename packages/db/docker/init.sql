-- Runs once when the local Postgres container is first created.
-- The postgis/postgis image already installs postgis (plus postgis_topology,
-- fuzzystrmatch and postgis_tiger_geocoder), so only pg_trgm is added here.
-- These are deliberately not tracked by Prisma; see prisma/schema.prisma.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
