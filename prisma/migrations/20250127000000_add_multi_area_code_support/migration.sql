-- Migration: Add Multi-Area-Code Network Support
-- Phase 1: Database Schema Enhancement for 209 Works Multi-Area Network
-- Date: 2025-01-27
-- 
-- This migration adds foundational infrastructure for supporting multiple area codes
-- while maintaining complete backward compatibility with existing functionality.

-- ============================================================================
-- PART 1: ADD NEW COLUMNS TO JOBS TABLE
-- ============================================================================

-- Add area codes array with default to 209
ALTER TABLE "Job" ADD COLUMN "area_codes" TEXT[] DEFAULT ARRAY['209']::TEXT[];

-- Add city field for more granular location data
ALTER TABLE "Job" ADD COLUMN "city" TEXT;

-- Add target cities array for jobs that serve multiple cities
ALTER TABLE "Job" ADD COLUMN "target_cities" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add latitude and longitude for future geo-queries
ALTER TABLE "Job" ADD COLUMN "lat" FLOAT8;
ALTER TABLE "Job" ADD COLUMN "lng" FLOAT8;

-- ============================================================================
-- PART 2: BACKFILL EXISTING DATA WITH SAFE DEFAULTS
-- ============================================================================

-- Ensure all existing jobs have the default area code
UPDATE "Job" 
SET "area_codes" = ARRAY['209']::TEXT[] 
WHERE "area_codes" IS NULL OR array_length("area_codes", 1) IS NULL;

-- Extract city from location field where possible for existing jobs
-- This is a best-effort extraction for common patterns
UPDATE "Job" 
SET "city" = CASE
  WHEN "location" ILIKE '%stockton%' THEN 'Stockton'
  WHEN "location" ILIKE '%modesto%' THEN 'Modesto'
  WHEN "location" ILIKE '%tracy%' THEN 'Tracy'
  WHEN "location" ILIKE '%manteca%' THEN 'Manteca'
  WHEN "location" ILIKE '%lodi%' THEN 'Lodi'
  WHEN "location" ILIKE '%turlock%' THEN 'Turlock'
  WHEN "location" ILIKE '%merced%' THEN 'Merced'
  WHEN "location" ILIKE '%fresno%' THEN 'Fresno'
  WHEN "location" ILIKE '%ceres%' THEN 'Ceres'
  WHEN "location" ILIKE '%patterson%' THEN 'Patterson'
  WHEN "location" ILIKE '%newman%' THEN 'Newman'
  WHEN "location" ILIKE '%oakdale%' THEN 'Oakdale'
  WHEN "location" ILIKE '%ripon%' THEN 'Ripon'
  WHEN "location" ILIKE '%escalon%' THEN 'Escalon'
  ELSE NULL
END
WHERE "city" IS NULL;

-- ============================================================================
-- PART 3: CREATE OPTIMIZED INDEXES FOR AREA CODE QUERIES
-- ============================================================================

-- Index for area code filtering (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_area_codes_idx" 
ON "Job" USING GIN ("area_codes");

-- Index for city filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_city_idx" 
ON "Job" ("city") WHERE "city" IS NOT NULL;

-- Composite index for area code + job type (common filter combination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_area_codes_type_idx" 
ON "Job" USING GIN ("area_codes", "type");

-- Composite index for area code + posted date (for recent jobs by area)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_area_codes_posted_idx" 
ON "Job" USING GIN ("area_codes", "postedAt");

-- Spatial index for future geo-queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_location_geo_idx" 
ON "Job" ("lat", "lng") WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL;

-- ============================================================================
-- PART 4: CREATE HELPER FUNCTIONS FOR AREA CODE OPERATIONS
-- ============================================================================

-- Function to get jobs by area code with proper filtering
CREATE OR REPLACE FUNCTION get_jobs_by_area_code(
  target_area_code TEXT,
  job_limit INTEGER DEFAULT 20,
  job_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  city TEXT,
  area_codes TEXT[],
  posted_at TIMESTAMP,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.company,
    j.location,
    j.city,
    j.area_codes,
    j."postedAt",
    j."createdAt"
  FROM "Job" j
  WHERE target_area_code = ANY(j.area_codes)
    AND j."deletedAt" IS NULL
    AND j.status = 'active'
  ORDER BY j."postedAt" DESC
  LIMIT job_limit
  OFFSET job_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get area code statistics
CREATE OR REPLACE FUNCTION get_area_code_stats(target_area_code TEXT)
RETURNS TABLE (
  area_code TEXT,
  total_jobs BIGINT,
  active_jobs BIGINT,
  jobs_this_week BIGINT,
  top_cities TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    target_area_code,
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'active' AND "deletedAt" IS NULL) as active_jobs,
    COUNT(*) FILTER (WHERE "postedAt" >= NOW() - INTERVAL '7 days' AND status = 'active' AND "deletedAt" IS NULL) as jobs_this_week,
    ARRAY(
      SELECT j.city 
      FROM "Job" j 
      WHERE target_area_code = ANY(j.area_codes) 
        AND j.city IS NOT NULL 
        AND j.status = 'active' 
        AND j."deletedAt" IS NULL
      GROUP BY j.city 
      ORDER BY COUNT(*) DESC 
      LIMIT 5
    ) as top_cities
  FROM "Job" j
  WHERE target_area_code = ANY(j.area_codes);
END;
$$ LANGUAGE plpgsql;

-- Update table statistics for better query planning
ANALYZE "Job";

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Multi-area-code network migration completed successfully';
  RAISE NOTICE 'Added 5 new columns to Job table';
  RAISE NOTICE 'Created 5 optimized indexes for area code queries';
  RAISE NOTICE 'Created 2 helper functions for area code operations';
  RAISE NOTICE 'All existing jobs assigned to area code 209 by default';
  RAISE NOTICE 'Schema is ready for multi-area expansion';
END $$;
