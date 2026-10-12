-- CreateEnum
CREATE TYPE "QualityFlagReason" AS ENUM ('ZERO_REPORTED', 'LARGE_CHANGE', 'MISSING_UNIT', 'OTHER');

-- CreateEnum
CREATE TYPE "OwnershipChangeType" AS ENUM ('OWNER_ADDED', 'OWNER_REMOVED', 'PERCENT_CHANGED', 'PE_FLAG_ADDED', 'REIT_FLAG_ADDED');

-- CreateEnum
CREATE TYPE "CrosswalkStatus" AS ENUM ('AUTO_ACCEPTED', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IngestStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "city" TEXT,
    "streetAddress" TEXT,
    "zip" TEXT,
    "reportCardEntityId" INTEGER,
    "ccn" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "houseDistrict" INTEGER,
    "senateDistrict" INTEGER,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "systemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSystem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HealthSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measure" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceMeasureId" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitType" TEXT,
    "metric" TEXT,
    "defaultUnit" TEXT,
    "evidence" TEXT,

    CONSTRAINT "Measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasureValue" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "measureId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "numerator" INTEGER,
    "denominator" INTEGER,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeasureValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityFlag" (
    "id" TEXT NOT NULL,
    "measureValueId" TEXT NOT NULL,
    "reason" "QualityFlagReason" NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "cmsAssociateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerType" TEXT,
    "isPrivateEquity" BOOLEAN,
    "isReit" BOOLEAN,
    "isHoldingCompany" BOOLEAN,
    "isForProfit" BOOLEAN,
    "isNonProfit" BOOLEAN,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ownership" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "cmsEnrollmentId" TEXT NOT NULL,
    "percentageOwnership" DOUBLE PRECISION,
    "effectiveDate" DATE,
    "snapshotMonth" DATE NOT NULL,

    CONSTRAINT "Ownership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnershipChange" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "ownerId" TEXT,
    "type" "OwnershipChangeType" NOT NULL,
    "fromSnapshot" DATE NOT NULL,
    "toSnapshot" DATE NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnershipChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrosswalkMatch" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceHospitalId" TEXT NOT NULL,
    "ccn" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" "CrosswalkStatus" NOT NULL,
    "note" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrosswalkMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "IngestStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_slug_key" ON "Hospital"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_reportCardEntityId_key" ON "Hospital"("reportCardEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_ccn_key" ON "Hospital"("ccn");

-- CreateIndex
CREATE INDEX "Hospital_state_idx" ON "Hospital"("state");

-- CreateIndex
CREATE INDEX "Hospital_systemId_idx" ON "Hospital"("systemId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthSystem_slug_key" ON "HealthSystem"("slug");

-- CreateIndex
CREATE INDEX "Measure_metric_unitType_idx" ON "Measure"("metric", "unitType");

-- CreateIndex
CREATE UNIQUE INDEX "Measure_source_sourceMeasureId_key" ON "Measure"("source", "sourceMeasureId");

-- CreateIndex
CREATE INDEX "MeasureValue_measureId_periodEnd_idx" ON "MeasureValue"("measureId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "MeasureValue_hospitalId_measureId_periodStart_periodEnd_key" ON "MeasureValue"("hospitalId", "measureId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "QualityFlag_measureValueId_reason_key" ON "QualityFlag"("measureValueId", "reason");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_cmsAssociateId_key" ON "Owner"("cmsAssociateId");

-- CreateIndex
CREATE INDEX "Ownership_hospitalId_snapshotMonth_idx" ON "Ownership"("hospitalId", "snapshotMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Ownership_cmsEnrollmentId_ownerId_snapshotMonth_key" ON "Ownership"("cmsEnrollmentId", "ownerId", "snapshotMonth");

-- CreateIndex
CREATE INDEX "OwnershipChange_toSnapshot_idx" ON "OwnershipChange"("toSnapshot");

-- CreateIndex
CREATE INDEX "OwnershipChange_hospitalId_idx" ON "OwnershipChange"("hospitalId");

-- CreateIndex
CREATE INDEX "CrosswalkMatch_status_idx" ON "CrosswalkMatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CrosswalkMatch_source_sourceHospitalId_ccn_key" ON "CrosswalkMatch"("source", "sourceHospitalId", "ccn");

-- CreateIndex
CREATE INDEX "IngestRun_source_startedAt_idx" ON "IngestRun"("source", "startedAt");

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "HealthSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureValue" ADD CONSTRAINT "MeasureValue_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureValue" ADD CONSTRAINT "MeasureValue_measureId_fkey" FOREIGN KEY ("measureId") REFERENCES "Measure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityFlag" ADD CONSTRAINT "QualityFlag_measureValueId_fkey" FOREIGN KEY ("measureValueId") REFERENCES "MeasureValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipChange" ADD CONSTRAINT "OwnershipChange_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipChange" ADD CONSTRAINT "OwnershipChange_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
