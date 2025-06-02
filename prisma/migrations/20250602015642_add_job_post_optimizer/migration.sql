-- CreateEnum
CREATE TYPE "JobPostStatus" AS ENUM ('draft', 'optimized', 'published', 'archived');

-- CreateTable
CREATE TABLE "ShouldIApplyUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userTier" TEXT NOT NULL DEFAULT 'free',
    "analysisType" TEXT NOT NULL DEFAULT 'basic',
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShouldIApplyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPostOptimizer" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "pay" TEXT,
    "schedule" TEXT,
    "companyDescription" TEXT,
    "idealFit" TEXT,
    "culture" TEXT,
    "growthPath" TEXT,
    "perks" TEXT,
    "applicationCTA" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawInput" JSONB,
    "aiGeneratedOutput" TEXT,
    "optimizationPrompt" TEXT,
    "status" "JobPostStatus" NOT NULL DEFAULT 'draft',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPostOptimizer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShouldIApplyUsage_userId_idx" ON "ShouldIApplyUsage"("userId");

-- CreateIndex
CREATE INDEX "ShouldIApplyUsage_jobId_idx" ON "ShouldIApplyUsage"("jobId");

-- CreateIndex
CREATE INDEX "ShouldIApplyUsage_usedAt_idx" ON "ShouldIApplyUsage"("usedAt");

-- CreateIndex
CREATE INDEX "ShouldIApplyUsage_userId_usedAt_idx" ON "ShouldIApplyUsage"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "JobPostOptimizer_employerId_idx" ON "JobPostOptimizer"("employerId");

-- CreateIndex
CREATE INDEX "JobPostOptimizer_status_idx" ON "JobPostOptimizer"("status");

-- CreateIndex
CREATE INDEX "JobPostOptimizer_createdAt_idx" ON "JobPostOptimizer"("createdAt");

-- AddForeignKey
ALTER TABLE "ShouldIApplyUsage" ADD CONSTRAINT "ShouldIApplyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShouldIApplyUsage" ADD CONSTRAINT "ShouldIApplyUsage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostOptimizer" ADD CONSTRAINT "JobPostOptimizer_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPostOptimizer" ADD CONSTRAINT "JobPostOptimizer_publishedJobId_fkey" FOREIGN KEY ("publishedJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
