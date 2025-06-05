-- Add new fields to AuditLog table
ALTER TABLE "AuditLog" ADD COLUMN "targetType" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "targetId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "performedBy" TEXT;

-- Create indexes for new AuditLog fields
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");
CREATE INDEX "AuditLog_targetType_idx" ON "AuditLog"("targetType");

-- CreateTable
CREATE TABLE "AnalyticsReport" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "recipients" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsReport_type_idx" ON "AnalyticsReport"("type");

-- CreateIndex
CREATE INDEX "AnalyticsReport_generatedBy_idx" ON "AnalyticsReport"("generatedBy");

-- CreateIndex
CREATE INDEX "AnalyticsReport_status_idx" ON "AnalyticsReport"("status");

-- CreateIndex
CREATE INDEX "AnalyticsReport_createdAt_idx" ON "AnalyticsReport"("createdAt");

-- CreateIndex
CREATE INDEX "ImpersonationSession_adminId_idx" ON "ImpersonationSession"("adminId");

-- CreateIndex
CREATE INDEX "ImpersonationSession_targetUserId_idx" ON "ImpersonationSession"("targetUserId");

-- CreateIndex
CREATE INDEX "ImpersonationSession_isActive_idx" ON "ImpersonationSession"("isActive");

-- CreateIndex
CREATE INDEX "ImpersonationSession_expiresAt_idx" ON "ImpersonationSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ImpersonationSession_createdAt_idx" ON "ImpersonationSession"("createdAt");

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
