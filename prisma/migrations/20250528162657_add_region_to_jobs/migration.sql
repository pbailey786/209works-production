/*
  Warnings:

  - You are about to alter the column `embedding` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("vector")` to `Text`.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InstagramAlertType" AS ENUM ('engagement_rate_drop', 'engagement_rate_spike', 'follower_count_change', 'post_performance_low', 'post_performance_high', 'reach_decline', 'impressions_decline');

-- AlterTable
ALTER TABLE "Advertisement" ADD COLUMN     "bidding" JSONB,
ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "content" JSONB,
ADD COLUMN     "conversions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentSpend" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "employerId" TEXT,
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "placement" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "schedule" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'banner';

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CompanyKnowledge" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmailAlert" ADD COLUMN     "frequency" "AlertFrequency" NOT NULL DEFAULT 'immediate';

-- AlterTable
ALTER TABLE "InstagramPost" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "InstagramSchedule" ADD COLUMN     "postTimes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "InstagramTemplate" ADD COLUMN     "captionTemplate" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "employerId" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "embedding" DROP NOT NULL,
ALTER COLUMN "embedding" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "linkedinUrl" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "stripeSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "mfaVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "UserAddOn" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdImpression" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "placement" TEXT,
    "page" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdClick" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "targetUrl" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "placement" TEXT,
    "referrer" TEXT,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdConversion" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "conversionType" TEXT NOT NULL,
    "conversionValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keywords" TEXT[],
    "location" TEXT,
    "jobType" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'immediate',
    "lastTriggered" TIMESTAMP(3),
    "totalJobsSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAlertMatch" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAlertMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramAnalytics" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "profileVisits" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clickThroughRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramAccountMetrics" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "mediaCount" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramAccountMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramEngagementAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" "InstagramAlertType" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "comparison" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailNotification" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'immediate',
    "lastTriggered" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramEngagementAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdImpression_adId_idx" ON "AdImpression"("adId");

-- CreateIndex
CREATE INDEX "AdImpression_userId_idx" ON "AdImpression"("userId");

-- CreateIndex
CREATE INDEX "AdImpression_sessionId_idx" ON "AdImpression"("sessionId");

-- CreateIndex
CREATE INDEX "AdImpression_createdAt_idx" ON "AdImpression"("createdAt");

-- CreateIndex
CREATE INDEX "AdClick_adId_idx" ON "AdClick"("adId");

-- CreateIndex
CREATE INDEX "AdClick_userId_idx" ON "AdClick"("userId");

-- CreateIndex
CREATE INDEX "AdClick_sessionId_idx" ON "AdClick"("sessionId");

-- CreateIndex
CREATE INDEX "AdClick_createdAt_idx" ON "AdClick"("createdAt");

-- CreateIndex
CREATE INDEX "AdConversion_adId_idx" ON "AdConversion"("adId");

-- CreateIndex
CREATE INDEX "AdConversion_userId_idx" ON "AdConversion"("userId");

-- CreateIndex
CREATE INDEX "AdConversion_sessionId_idx" ON "AdConversion"("sessionId");

-- CreateIndex
CREATE INDEX "AdConversion_conversionType_idx" ON "AdConversion"("conversionType");

-- CreateIndex
CREATE INDEX "AdConversion_createdAt_idx" ON "AdConversion"("createdAt");

-- CreateIndex
CREATE INDEX "JobAlert_userId_idx" ON "JobAlert"("userId");

-- CreateIndex
CREATE INDEX "JobAlert_isActive_idx" ON "JobAlert"("isActive");

-- CreateIndex
CREATE INDEX "JobAlert_lastTriggered_idx" ON "JobAlert"("lastTriggered");

-- CreateIndex
CREATE INDEX "JobAlertMatch_alertId_idx" ON "JobAlertMatch"("alertId");

-- CreateIndex
CREATE INDEX "JobAlertMatch_jobId_idx" ON "JobAlertMatch"("jobId");

-- CreateIndex
CREATE INDEX "JobAlertMatch_sentAt_idx" ON "JobAlertMatch"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobAlertMatch_alertId_jobId_key" ON "JobAlertMatch"("alertId", "jobId");

-- CreateIndex
CREATE INDEX "InstagramAnalytics_postId_idx" ON "InstagramAnalytics"("postId");

-- CreateIndex
CREATE INDEX "InstagramAnalytics_recordedAt_idx" ON "InstagramAnalytics"("recordedAt");

-- CreateIndex
CREATE INDEX "InstagramAnalytics_engagementRate_idx" ON "InstagramAnalytics"("engagementRate");

-- CreateIndex
CREATE INDEX "InstagramAccountMetrics_accountId_idx" ON "InstagramAccountMetrics"("accountId");

-- CreateIndex
CREATE INDEX "InstagramAccountMetrics_date_idx" ON "InstagramAccountMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramAccountMetrics_accountId_date_key" ON "InstagramAccountMetrics"("accountId", "date");

-- CreateIndex
CREATE INDEX "InstagramEngagementAlert_userId_idx" ON "InstagramEngagementAlert"("userId");

-- CreateIndex
CREATE INDEX "InstagramEngagementAlert_alertType_idx" ON "InstagramEngagementAlert"("alertType");

-- CreateIndex
CREATE INDEX "InstagramEngagementAlert_isActive_idx" ON "InstagramEngagementAlert"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_sessionId_idx" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_lastActivity_idx" ON "UserSession"("lastActivity");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SavedJob_userId_idx" ON "SavedJob"("userId");

-- CreateIndex
CREATE INDEX "SavedJob_jobId_idx" ON "SavedJob"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON "SavedJob"("userId", "jobId");

-- CreateIndex
CREATE INDEX "Advertisement_employerId_idx" ON "Advertisement"("employerId");

-- CreateIndex
CREATE INDEX "Advertisement_status_idx" ON "Advertisement"("status");

-- CreateIndex
CREATE INDEX "Advertisement_type_idx" ON "Advertisement"("type");

-- CreateIndex
CREATE INDEX "Advertisement_isActive_idx" ON "Advertisement"("isActive");

-- CreateIndex
CREATE INDEX "Advertisement_priority_idx" ON "Advertisement"("priority");

-- CreateIndex
CREATE INDEX "Alert_deletedAt_idx" ON "Alert"("deletedAt");

-- CreateIndex
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");

-- CreateIndex
CREATE INDEX "CompanyKnowledge_deletedAt_idx" ON "CompanyKnowledge"("deletedAt");

-- CreateIndex
CREATE INDEX "EmailAlert_frequency_idx" ON "EmailAlert"("frequency");

-- CreateIndex
CREATE INDEX "Job_region_idx" ON "Job"("region");

-- CreateIndex
CREATE INDEX "Job_region_type_idx" ON "Job"("region", "type");

-- CreateIndex
CREATE INDEX "Job_region_postedAt_idx" ON "Job"("region", "postedAt");

-- CreateIndex
CREATE INDEX "Job_deletedAt_idx" ON "Job"("deletedAt");

-- CreateIndex
CREATE INDEX "Job_employerId_idx" ON "Job"("employerId");

-- CreateIndex
CREATE INDEX "JobApplication_deletedAt_idx" ON "JobApplication"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "UserAddOn_deletedAt_idx" ON "UserAddOn"("deletedAt");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramAnalytics" ADD CONSTRAINT "InstagramAnalytics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramEngagementAlert" ADD CONSTRAINT "InstagramEngagementAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
