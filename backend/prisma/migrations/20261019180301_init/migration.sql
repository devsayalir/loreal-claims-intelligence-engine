-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('EFFICACY', 'SENSORY', 'CONSUMER_PERCEPTION', 'SAFETY');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'FORMULA_SUBMITTED', 'EVIDENCE_ATTACHED', 'ASSESSED');

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "claimText" TEXT NOT NULL,
    "claimType" "ClaimType" NOT NULL DEFAULT 'EFFICACY',
    "status" "ClaimStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedBy" TEXT,
    "reviewNote" TEXT,
    "formulaReference" TEXT,
    "formulaDetails" TEXT,
    "studyDesign" TEXT,
    "sampleSize" INTEGER,
    "studyDuration" TEXT,
    "evidenceText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "justified" BOOLEAN NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "evidenceSnapshot" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Assessment_claimId_createdAt_idx" ON "Assessment"("claimId", "createdAt");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
