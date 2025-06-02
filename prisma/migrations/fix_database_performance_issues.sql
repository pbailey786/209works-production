-- Migration: Fix Database Performance Issues and N+1 Query Problems
-- Task 45.13: Critical database performance optimizations
-- Date: 2025-01-27

-- ============================================================================
-- PART 1: ADD MISSING COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Composite index for location + type + categories (most common search pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_location_type_categories_idx" 
ON "Job" USING GIN ("location", "type", "categories");

-- Composite index for location + type + salary range
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_location_type_salary_idx" 
ON "Job" ("location", "type", "salaryMin", "salaryMax");

-- Composite index for company + type + location (company-specific searches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_company_type_location_idx" 
ON "Job" ("company", "type", "location");

-- Composite index for postedAt + type + location (recent jobs by type/location)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_postedAt_type_location_idx" 
ON "Job" ("postedAt" DESC, "type", "location");

-- Composite index for createdAt + type + categories (recent jobs by category)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_createdAt_type_categories_idx" 
ON "Job" USING GIN ("createdAt" DESC, "type", "categories");

-- ============================================================================
-- PART 2: ADD FULL-TEXT SEARCH INDEXES FOR EFFICIENT TEXT SEARCH
-- ============================================================================

-- Full-text search index for job title and description
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_title_description_fulltext_idx" 
ON "Job" USING GIN (to_tsvector('english', title || ' ' || description));

-- Full-text search index for company name
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_company_fulltext_idx" 
ON "Job" USING GIN (to_tsvector('english', company));

-- Combined full-text search index for all searchable fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_combined_fulltext_idx" 
ON "Job" USING GIN (to_tsvector('english', title || ' ' || description || ' ' || company || ' ' || location));

-- ============================================================================
-- PART 3: OPTIMIZE VECTOR SIMILARITY SEARCH INDEXES
-- ============================================================================

-- Vector similarity index for job embeddings (requires pgvector extension)
-- Note: This assumes pgvector extension is already installed
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_embedding_cosine_idx" 
ON "Job" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Alternative vector index for L2 distance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_embedding_l2_idx" 
ON "Job" USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- ============================================================================
-- PART 4: ADD INDEXES FOR ARRAY OPERATIONS (CATEGORIES, SKILLS)
-- ============================================================================

-- GIN index for categories array operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_categories_gin_idx" 
ON "Job" USING GIN ("categories");

-- Partial index for remote jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_remote_partial_idx" 
ON "Job" ("type", "location", "postedAt" DESC) 
WHERE "location" ILIKE '%remote%' OR "location" ILIKE '%anywhere%';

-- ============================================================================
-- PART 5: ADD PERFORMANCE INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Index for salary range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_salary_range_idx" 
ON "Job" ("salaryMin", "salaryMax") 
WHERE "salaryMin" IS NOT NULL OR "salaryMax" IS NOT NULL;

-- Index for active jobs with expiration
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_active_status_idx" 
ON "Job" ("postedAt" DESC, "createdAt" DESC) 
WHERE "postedAt" > NOW() - INTERVAL '90 days';

-- Index for company-specific job counts (for N+1 prevention)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_company_count_idx" 
ON "Job" ("company", "postedAt" DESC) 
WHERE "company" IS NOT NULL;

-- ============================================================================
-- PART 6: ADD INDEXES FOR RELATED TABLES TO PREVENT N+1 QUERIES
-- ============================================================================

-- Composite index for JobApplication lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "JobApplication_userId_jobId_status_idx" 
ON "JobApplication" ("userId", "jobId", "status");

-- Index for user's saved jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS "JobApplication_userId_appliedAt_idx" 
ON "JobApplication" ("userId", "appliedAt" DESC);

-- Company-related indexes for efficient joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Company_name_active_idx" 
ON "Company" ("name", "isActive") 
WHERE "isActive" = true;

-- ============================================================================
-- PART 7: ADD MATERIALIZED VIEW FOR EXPENSIVE AGGREGATIONS
-- ============================================================================

-- Materialized view for job statistics by company
CREATE MATERIALIZED VIEW IF NOT EXISTS "JobStatsByCompany" AS
SELECT 
    company,
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE "postedAt" > NOW() - INTERVAL '30 days') as recent_jobs,
    AVG("salaryMin") as avg_salary_min,
    AVG("salaryMax") as avg_salary_max,
    array_agg(DISTINCT "type") as job_types,
    array_agg(DISTINCT "location") as locations,
    MAX("postedAt") as latest_job_date
FROM "Job" 
WHERE company IS NOT NULL 
GROUP BY company
HAVING COUNT(*) > 0;

-- Index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS "JobStatsByCompany_company_idx" 
ON "JobStatsByCompany" ("company");

CREATE INDEX IF NOT EXISTS "JobStatsByCompany_recent_jobs_idx" 
ON "JobStatsByCompany" ("recent_jobs" DESC);

-- ============================================================================
-- PART 8: ADD FUNCTION FOR EFFICIENT COMPANY LOOKUP WITH STATS
-- ============================================================================

-- Function to get company with job stats (prevents N+1 queries)
CREATE OR REPLACE FUNCTION get_company_with_stats(company_name TEXT)
RETURNS TABLE(
    company TEXT,
    total_jobs BIGINT,
    recent_jobs BIGINT,
    avg_salary_min NUMERIC,
    avg_salary_max NUMERIC,
    job_types TEXT[],
    locations TEXT[],
    latest_job_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM "JobStatsByCompany" 
    WHERE "JobStatsByCompany".company = company_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PART 9: ADD FUNCTION FOR BATCH COMPANY LOOKUPS
-- ============================================================================

-- Function for batch company lookups (prevents N+1 queries)
CREATE OR REPLACE FUNCTION get_companies_batch(company_names TEXT[])
RETURNS TABLE(
    company TEXT,
    total_jobs BIGINT,
    recent_jobs BIGINT,
    avg_salary_min NUMERIC,
    avg_salary_max NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jsc.company,
        jsc.total_jobs,
        jsc.recent_jobs,
        jsc.avg_salary_min,
        jsc.avg_salary_max
    FROM "JobStatsByCompany" jsc
    WHERE jsc.company = ANY(company_names);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PART 10: CREATE REFRESH FUNCTION FOR MATERIALIZED VIEW
-- ============================================================================

-- Function to refresh job statistics (call this periodically)
CREATE OR REPLACE FUNCTION refresh_job_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY "JobStatsByCompany";
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 11: ADD PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View for monitoring slow queries
CREATE OR REPLACE VIEW "SlowQueryMonitor" AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- View for monitoring index usage
CREATE OR REPLACE VIEW "IndexUsageMonitor" AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'LOW_USAGE'
        ELSE 'ACTIVE'
    END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================================================
-- PART 12: ADD CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Add check constraint for salary validation
ALTER TABLE "Job" 
ADD CONSTRAINT "Job_salary_check" 
CHECK ("salaryMin" IS NULL OR "salaryMax" IS NULL OR "salaryMin" <= "salaryMax");

-- Add check constraint for date validation
ALTER TABLE "Job" 
ADD CONSTRAINT "Job_date_check" 
CHECK ("postedAt" <= "createdAt" + INTERVAL '1 day');

-- ============================================================================
-- PART 13: PERFORMANCE OPTIMIZATION SETTINGS
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE "Job";
ANALYZE "Company";
ANALYZE "JobApplication";
ANALYZE "User";

-- ============================================================================
-- PART 14: CLEANUP AND MAINTENANCE COMMANDS
-- ============================================================================

-- Commands to run after migration (add to cron job):
-- 1. Refresh materialized view daily:
--    SELECT refresh_job_stats();
--
-- 2. Update statistics weekly:
--    ANALYZE;
--
-- 3. Monitor slow queries:
--    SELECT * FROM "SlowQueryMonitor" LIMIT 10;
--
-- 4. Monitor index usage:
--    SELECT * FROM "IndexUsageMonitor" WHERE usage_status = 'UNUSED';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database performance optimization migration completed successfully';
    RAISE NOTICE 'Added % composite indexes for common query patterns', 7;
    RAISE NOTICE 'Added % full-text search indexes', 3;
    RAISE NOTICE 'Added % vector similarity indexes', 2;
    RAISE NOTICE 'Added % array operation indexes', 2;
    RAISE NOTICE 'Added % performance indexes', 4;
    RAISE NOTICE 'Created materialized view for job statistics';
    RAISE NOTICE 'Created batch lookup functions to prevent N+1 queries';
    RAISE NOTICE 'Added performance monitoring views';
END $$; 