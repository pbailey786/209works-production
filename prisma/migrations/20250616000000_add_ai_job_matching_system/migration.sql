-- CreateTable
CREATE TABLE "ResumeEmbedding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "processedText" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jobTitles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastJobProcessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatch" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "matchReason" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "emailOpened" BOOLEAN NOT NULL DEFAULT false,
    "emailOpenedAt" TIMESTAMP(3),
    "emailClicked" BOOLEAN NOT NULL DEFAULT false,
    "emailClickedAt" TIMESTAMP(3),
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "matchType" TEXT NOT NULL DEFAULT 'ai_featured',
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobProcessingQueue" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "jobId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobProcessingQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minMatchScore" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "maxEmailsPerDay" INTEGER NOT NULL DEFAULT 50,
    "maxEmailsPerHour" INTEGER NOT NULL DEFAULT 10,
    "batchSize" INTEGER NOT NULL DEFAULT 50,
    "emailTemplate" TEXT NOT NULL DEFAULT 'featured_job_match',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "processedJobs" INTEGER NOT NULL DEFAULT 0,
    "sentEmails" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeEmbedding_userId_key" ON "ResumeEmbedding"("userId");

-- CreateIndex
CREATE INDEX "ResumeEmbedding_userId_idx" ON "ResumeEmbedding"("userId");

-- CreateIndex
CREATE INDEX "ResumeEmbedding_lastJobProcessed_idx" ON "ResumeEmbedding"("lastJobProcessed");

-- CreateIndex
CREATE INDEX "ResumeEmbedding_skills_idx" ON "ResumeEmbedding"("skills");

-- CreateIndex
CREATE INDEX "ResumeEmbedding_jobTitles_idx" ON "ResumeEmbedding"("jobTitles");

-- CreateIndex
CREATE INDEX "ResumeEmbedding_industries_idx" ON "ResumeEmbedding"("industries");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_jobId_userId_key" ON "JobMatch"("jobId", "userId");

-- CreateIndex
CREATE INDEX "JobMatch_jobId_idx" ON "JobMatch"("jobId");

-- CreateIndex
CREATE INDEX "JobMatch_userId_idx" ON "JobMatch"("userId");

-- CreateIndex
CREATE INDEX "JobMatch_score_idx" ON "JobMatch"("score");

-- CreateIndex
CREATE INDEX "JobMatch_emailSent_idx" ON "JobMatch"("emailSent");

-- CreateIndex
CREATE INDEX "JobMatch_matchType_idx" ON "JobMatch"("matchType");

-- CreateIndex
CREATE INDEX "JobMatch_createdAt_idx" ON "JobMatch"("createdAt");

-- CreateIndex
CREATE INDEX "JobMatch_jobId_score_idx" ON "JobMatch"("jobId", "score");

-- CreateIndex
CREATE INDEX "JobMatch_userId_score_idx" ON "JobMatch"("userId", "score");

-- CreateIndex
CREATE INDEX "JobProcessingQueue_status_idx" ON "JobProcessingQueue"("status");

-- CreateIndex
CREATE INDEX "JobProcessingQueue_jobType_idx" ON "JobProcessingQueue"("jobType");

-- CreateIndex
CREATE INDEX "JobProcessingQueue_priority_idx" ON "JobProcessingQueue"("priority");

-- CreateIndex
CREATE INDEX "JobProcessingQueue_scheduledFor_idx" ON "JobProcessingQueue"("scheduledFor");

-- CreateIndex
CREATE INDEX "JobProcessingQueue_createdAt_idx" ON "JobProcessingQueue"("createdAt");

-- CreateIndex
CREATE INDEX "JobProcessingQueue_jobType_status_idx" ON "JobProcessingQueue"("jobType", "status");

-- CreateIndex
CREATE INDEX "JobProcessingQueue_status_scheduledFor_idx" ON "JobProcessingQueue"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "MatchingConfig_name_key" ON "MatchingConfig"("name");

-- CreateIndex
CREATE INDEX "MatchingConfig_name_idx" ON "MatchingConfig"("name");

-- CreateIndex
CREATE INDEX "MatchingConfig_isActive_idx" ON "MatchingConfig"("isActive");

-- CreateIndex
CREATE INDEX "MatchingConfig_minMatchScore_idx" ON "MatchingConfig"("minMatchScore");

-- AddForeignKey
ALTER TABLE "ResumeEmbedding" ADD CONSTRAINT "ResumeEmbedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_userId_fkey1" FOREIGN KEY ("userId") REFERENCES "ResumeEmbedding"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default matching configuration
INSERT INTO "MatchingConfig" (id, name, minMatchScore, maxEmailsPerDay, maxEmailsPerHour, batchSize, emailTemplate, isActive)
VALUES (
    gen_random_uuid(),
    'default_featured_matching',
    80.0,
    100,
    20,
    50,
    'featured_job_match',
    true
);