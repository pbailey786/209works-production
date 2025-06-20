-- Performance optimization indexes for 209 Works
-- These indexes are specifically designed to improve dashboard query performance

-- User table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_email_role_idx" ON "User" ("email", "role");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_role_isActive_idx" ON "User" ("role", "isActive");

-- Job table optimizations for employer dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_employerId_status_deletedAt_idx" ON "Job" ("employerId", "status", "deletedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_employerId_deletedAt_postedAt_idx" ON "Job" ("employerId", "deletedAt", "postedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_employerId_status_postedAt_idx" ON "Job" ("employerId", "status", "postedAt");

-- JobApplication table optimizations for application counting
CREATE INDEX CONCURRENTLY IF NOT EXISTS "JobApplication_job_employerId_appliedAt_idx" ON "JobApplication" ("jobId") 
  INCLUDE ("appliedAt") WHERE "deletedAt" IS NULL;

-- Composite index for job applications with employer filtering
-- This requires a custom query since we need to join through Job table
-- We'll add this as a partial index for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "JobApplication_appliedAt_status_idx" ON "JobApplication" ("appliedAt", "status") 
  WHERE "deletedAt" IS NULL;

-- Subscription table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Subscription_userId_status_tier_idx" ON "Subscription" ("userId", "status", "tier");

-- JobPostingCredit optimizations for credit counting
CREATE INDEX CONCURRENTLY IF NOT EXISTS "JobPostingCredit_userId_isUsed_expiresAt_idx" ON "JobPostingCredit" ("userId", "isUsed", "expiresAt");

-- UserSession optimizations for session management
CREATE INDEX CONCURRENTLY IF NOT EXISTS "UserSession_userId_expiresAt_lastActivity_idx" ON "UserSession" ("userId", "expiresAt", "lastActivity");

-- EmailLog optimizations for email tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EmailLog_userId_emailType_sentAt_idx" ON "EmailLog" ("userId", "emailType", "sentAt");

-- Alert optimizations for user alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Alert_userId_isActive_frequency_idx" ON "Alert" ("userId", "isActive", "frequency");

-- SavedJob optimizations for user saved jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SavedJob_userId_savedAt_idx" ON "SavedJob" ("userId", "savedAt");

-- SearchHistory optimizations for user search tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SearchHistory_userId_searchedAt_idx" ON "SearchHistory" ("userId", "searchedAt");

-- Company optimizations for employer lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Company_isActive_name_idx" ON "Company" ("isActive", "name");

-- Performance optimization for job counting queries
-- This helps with the dashboard stats queries that count jobs by employer
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_employerId_status_createdAt_idx" ON "Job" ("employerId", "status", "createdAt") 
  WHERE "deletedAt" IS NULL;

-- Optimization for application counting with date ranges
CREATE INDEX CONCURRENTLY IF NOT EXISTS "JobApplication_appliedAt_partial_idx" ON "JobApplication" ("appliedAt") 
  WHERE "deletedAt" IS NULL AND "appliedAt" >= (CURRENT_DATE - INTERVAL '30 days');

-- Add statistics update for better query planning
ANALYZE "User";
ANALYZE "Job";
ANALYZE "JobApplication";
ANALYZE "Subscription";
ANALYZE "JobPostingCredit";
ANALYZE "UserSession";
ANALYZE "EmailLog";
ANALYZE "Alert";
ANALYZE "SavedJob";
ANALYZE "SearchHistory";
ANALYZE "Company";

-- Create a function to refresh statistics periodically
CREATE OR REPLACE FUNCTION refresh_table_statistics()
RETURNS void AS $$
BEGIN
  ANALYZE "User";
  ANALYZE "Job";
  ANALYZE "JobApplication";
  ANALYZE "Subscription";
  ANALYZE "JobPostingCredit";
  ANALYZE "UserSession";
  ANALYZE "EmailLog";
  ANALYZE "Alert";
  ANALYZE "SavedJob";
  ANALYZE "SearchHistory";
  ANALYZE "Company";
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON INDEX "User_email_role_idx" IS 'Optimizes user lookups by email and role filtering';
COMMENT ON INDEX "Job_employerId_status_deletedAt_idx" IS 'Optimizes employer dashboard job counting queries';
COMMENT ON INDEX "JobApplication_appliedAt_status_idx" IS 'Optimizes application counting with date filtering';
COMMENT ON FUNCTION refresh_table_statistics() IS 'Refreshes table statistics for better query planning';
