-- Manual Migration: Consolidate Job.company references with Company model
-- This addresses the data consistency issue identified in the schema analysis

-- Step 1: Create companies from existing job.company strings
INSERT INTO "Company" (id, name, slug, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid() as id,
  DISTINCT company as name,
  LOWER(REGEXP_REPLACE(company, '[^a-zA-Z0-9]+', '-', 'g')) as slug,
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Job" 
WHERE company IS NOT NULL 
  AND company != ''
  AND company NOT IN (SELECT name FROM "Company")
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update job records to reference the Company model
UPDATE "Job" 
SET "companyId" = (
  SELECT id 
  FROM "Company" 
  WHERE "Company".name = "Job".company
)
WHERE "companyId" IS NULL 
  AND company IS NOT NULL 
  AND company != '';

-- Step 3: Handle edge cases and orphaned records
-- Mark jobs without valid company references
UPDATE "Job" 
SET company = 'Unknown Company'
WHERE (company IS NULL OR company = '') 
  AND "companyId" IS NULL;

-- Create "Unknown Company" entry for orphaned jobs
INSERT INTO "Company" (id, name, slug, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Unknown Company',
  'unknown-company',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Link orphaned jobs to "Unknown Company"
UPDATE "Job" 
SET "companyId" = (
  SELECT id 
  FROM "Company" 
  WHERE name = 'Unknown Company'
)
WHERE "companyId" IS NULL;

-- Step 4: Data validation queries
-- Run these to verify the migration worked correctly

-- Check for jobs without company references
SELECT COUNT(*) as orphaned_jobs
FROM "Job" 
WHERE "companyId" IS NULL;

-- Check company consistency
SELECT 
  j.company as job_company_string,
  c.name as company_model_name,
  COUNT(*) as job_count
FROM "Job" j
LEFT JOIN "Company" c ON j."companyId" = c.id
GROUP BY j.company, c.name
ORDER BY job_count DESC
LIMIT 20;

-- Check for duplicate companies (different cases/spellings)
SELECT 
  name,
  COUNT(*) as duplicate_count
FROM "Company"
GROUP BY LOWER(name)
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Future migration step (run after verifying data integrity):
-- ALTER TABLE "Job" ALTER COLUMN "companyId" SET NOT NULL;
-- ALTER TABLE "Job" DROP COLUMN company; -- Remove after full migration

-- Performance optimization: Add index if not exists
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Job_companyId_performance_idx" ON "Job"("companyId");

-- Analytics: Show migration results
SELECT 
  'Total Jobs' as metric,
  COUNT(*) as value
FROM "Job"
UNION ALL
SELECT 
  'Jobs with Company ID' as metric,
  COUNT(*) as value
FROM "Job" 
WHERE "companyId" IS NOT NULL
UNION ALL
SELECT 
  'Total Companies' as metric,
  COUNT(*) as value
FROM "Company"
UNION ALL
SELECT 
  'Companies with Jobs' as metric,
  COUNT(DISTINCT "companyId") as value
FROM "Job" 
WHERE "companyId" IS NOT NULL; 