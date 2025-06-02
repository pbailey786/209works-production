-- Migration script to enhance job matching capabilities
-- This script adds missing fields to the Job table for better job matching

-- Add missing columns to Job table if they don't exist
DO $$ 
BEGIN
    -- Add skills array column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Job' AND column_name = 'skills') THEN
        ALTER TABLE "Job" ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
        CREATE INDEX IF NOT EXISTS "Job_skills_idx" ON "Job" USING GIN ("skills");
    END IF;

    -- Add experience level column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Job' AND column_name = 'experienceLevel') THEN
        ALTER TABLE "Job" ADD COLUMN "experienceLevel" TEXT;
        CREATE INDEX IF NOT EXISTS "Job_experienceLevel_idx" ON "Job" ("experienceLevel");
    END IF;

    -- Add remote work flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Job' AND column_name = 'isRemote') THEN
        ALTER TABLE "Job" ADD COLUMN "isRemote" BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS "Job_isRemote_idx" ON "Job" ("isRemote");
    END IF;

    -- Add expiration date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Job' AND column_name = 'expiresAt') THEN
        ALTER TABLE "Job" ADD COLUMN "expiresAt" TIMESTAMP;
        CREATE INDEX IF NOT EXISTS "Job_expiresAt_idx" ON "Job" ("expiresAt");
    END IF;

    -- Add status column for job lifecycle management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Job' AND column_name = 'status') THEN
        ALTER TABLE "Job" ADD COLUMN "status" TEXT DEFAULT 'active';
        CREATE INDEX IF NOT EXISTS "Job_status_idx" ON "Job" ("status");
    END IF;

    -- Add job posting date for better sorting
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Job' AND column_name = 'jobType') THEN
        -- Map the existing 'type' field to 'jobType' for consistency
        ALTER TABLE "Job" ADD COLUMN "jobType" TEXT;
        -- Copy data from type to jobType
        UPDATE "Job" SET "jobType" = "type";
        CREATE INDEX IF NOT EXISTS "Job_jobType_idx" ON "Job" ("jobType");
    END IF;

END $$;

-- Create full-text search indexes for better text matching
CREATE INDEX IF NOT EXISTS "Job_title_fulltext_idx" ON "Job" USING GIN (to_tsvector('english', "title"));
CREATE INDEX IF NOT EXISTS "Job_description_fulltext_idx" ON "Job" USING GIN (to_tsvector('english', "description"));
CREATE INDEX IF NOT EXISTS "Job_company_fulltext_idx" ON "Job" USING GIN (to_tsvector('english', "company"));

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "Job_location_type_salary_idx" ON "Job" ("location", "type", "salaryMin", "salaryMax");
CREATE INDEX IF NOT EXISTS "Job_active_recent_idx" ON "Job" ("status", "createdAt" DESC) WHERE "status" = 'active';
CREATE INDEX IF NOT EXISTS "Job_remote_type_idx" ON "Job" ("isRemote", "type") WHERE "isRemote" = true;

-- Add some sample data improvements for testing
-- Update existing jobs with some sample skills data
UPDATE "Job" SET 
    "skills" = CASE 
        WHEN "title" ILIKE '%frontend%' OR "title" ILIKE '%react%' OR "title" ILIKE '%javascript%' THEN 
            ARRAY['JavaScript', 'React', 'HTML', 'CSS', 'TypeScript']
        WHEN "title" ILIKE '%backend%' OR "title" ILIKE '%node%' OR "title" ILIKE '%python%' OR "title" ILIKE '%java%' THEN 
            ARRAY['Node.js', 'Python', 'Java', 'API Development', 'Database']
        WHEN "title" ILIKE '%fullstack%' OR "title" ILIKE '%full stack%' THEN 
            ARRAY['JavaScript', 'React', 'Node.js', 'Database', 'API Development']
        WHEN "title" ILIKE '%devops%' OR "title" ILIKE '%cloud%' OR "title" ILIKE '%aws%' THEN 
            ARRAY['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux']
        WHEN "title" ILIKE '%data%' OR "title" ILIKE '%analyst%' OR "title" ILIKE '%scientist%' THEN 
            ARRAY['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'Statistics']
        WHEN "title" ILIKE '%mobile%' OR "title" ILIKE '%ios%' OR "title" ILIKE '%android%' THEN 
            ARRAY['Swift', 'Java', 'React Native', 'Mobile Development']
        ELSE ARRAY['Problem Solving', 'Communication', 'Teamwork']
    END,
    "experienceLevel" = CASE 
        WHEN "title" ILIKE '%senior%' OR "title" ILIKE '%lead%' OR "title" ILIKE '%principal%' THEN 'senior'
        WHEN "title" ILIKE '%junior%' OR "title" ILIKE '%entry%' OR "title" ILIKE '%intern%' THEN 'junior'
        WHEN "title" ILIKE '%mid%' OR "title" ILIKE '%intermediate%' THEN 'mid'
        ELSE 'mid'
    END,
    "isRemote" = CASE 
        WHEN "description" ILIKE '%remote%' OR "location" ILIKE '%remote%' THEN true
        ELSE false
    END,
    "status" = 'active',
    "expiresAt" = "createdAt" + INTERVAL '30 days'
WHERE "skills" IS NULL OR "skills" = ARRAY[]::TEXT[];

-- Add some sample data to enhance job matching capabilities
-- This helps demonstrate the algorithm with realistic data
INSERT INTO "Job" (
    "id", "title", "company", "description", "location", "salaryMin", "salaryMax", 
    "type", "categories", "source", "url", "postedAt", "skills", "experienceLevel", 
    "isRemote", "status", "expiresAt"
) VALUES 
(
    gen_random_uuid(),
    'Senior Frontend Developer',
    'TechCorp Inc',
    'We are looking for an experienced Frontend Developer to join our team. You will be responsible for developing user interfaces using React, TypeScript, and modern CSS frameworks. Strong knowledge of responsive design and performance optimization required.',
    'San Francisco, CA',
    120000,
    160000,
    'full_time',
    ARRAY['technology', 'frontend', 'web development'],
    'company_website',
    'https://example.com/job/1',
    NOW() - INTERVAL '2 days',
    ARRAY['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Redux', 'Webpack'],
    'senior',
    false,
    'active',
    NOW() + INTERVAL '28 days'
),
(
    gen_random_uuid(),
    'Full Stack Developer - Remote',
    'StartupXYZ',
    'Join our dynamic team as a Full Stack Developer. You will work on both frontend and backend technologies including React, Node.js, and PostgreSQL. Experience with cloud platforms and agile methodologies is a plus.',
    'Remote',
    90000,
    130000,
    'full_time',
    ARRAY['technology', 'fullstack', 'web development'],
    'job_board',
    'https://example.com/job/2',
    NOW() - INTERVAL '1 day',
    ARRAY['React', 'Node.js', 'JavaScript', 'PostgreSQL', 'AWS', 'Docker'],
    'mid',
    true,
    'active',
    NOW() + INTERVAL '29 days'
),
(
    gen_random_uuid(),
    'Junior Backend Developer',
    'InnovateLabs',
    'Entry-level position for a Backend Developer. You will learn and work with Python, Django, and REST APIs. Great opportunity for career growth in a supportive environment.',
    'Austin, TX',
    65000,
    85000,
    'full_time',
    ARRAY['technology', 'backend', 'python'],
    'company_website',
    'https://example.com/job/3',
    NOW() - INTERVAL '3 days',
    ARRAY['Python', 'Django', 'REST API', 'PostgreSQL', 'Git'],
    'junior',
    false,
    'active',
    NOW() + INTERVAL '27 days'
),
(
    gen_random_uuid(),
    'DevOps Engineer',
    'CloudFirst Solutions',
    'We need a DevOps Engineer to manage our cloud infrastructure. Experience with AWS, Kubernetes, and CI/CD pipelines required. You will be responsible for deployment automation and monitoring.',
    'Seattle, WA',
    110000,
    140000,
    'full_time',
    ARRAY['technology', 'devops', 'cloud'],
    'job_board',
    'https://example.com/job/4',
    NOW() - INTERVAL '1 day',
    ARRAY['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'Linux'],
    'senior',
    true,
    'active',
    NOW() + INTERVAL '29 days'
),
(
    gen_random_uuid(),
    'Data Scientist',
    'Analytics Pro',
    'Data Scientist position focusing on machine learning and predictive analytics. Strong background in Python, statistics, and data visualization required. Experience with big data technologies is preferred.',
    'New York, NY',
    100000,
    135000,
    'full_time',
    ARRAY['data science', 'machine learning', 'analytics'],
    'company_website',
    'https://example.com/job/5',
    NOW() - INTERVAL '4 days',
    ARRAY['Python', 'Machine Learning', 'Statistics', 'SQL', 'Pandas', 'Scikit-learn'],
    'mid',
    false,
    'active',
    NOW() + INTERVAL '26 days'
)
ON CONFLICT (id) DO NOTHING;

-- Update Alert table to ensure compatibility with new JobAlert structure
-- This ensures backward compatibility with the existing alert system
DO $$ 
BEGIN
    -- Ensure the JobAlert table exists with the right structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Alert') THEN
        -- Rename old Alert table to JobAlert if needed
        ALTER TABLE IF EXISTS "Alert" RENAME TO "JobAlert";
    END IF;
END $$;

-- Add performance-focused indexes
CREATE INDEX IF NOT EXISTS "Job_created_status_idx" ON "Job" ("createdAt" DESC, "status");
CREATE INDEX IF NOT EXISTS "Job_salary_range_idx" ON "Job" ("salaryMin", "salaryMax") WHERE "salaryMin" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Job_location_remote_idx" ON "Job" ("location", "isRemote");

-- Analyze tables for better query planning
ANALYZE "Job";
ANALYZE "JobAlert";

COMMENT ON COLUMN "Job"."skills" IS 'Array of skills required for the job, used for enhanced matching';
COMMENT ON COLUMN "Job"."experienceLevel" IS 'Experience level required (junior, mid, senior, lead, principal)';
COMMENT ON COLUMN "Job"."isRemote" IS 'Whether the job allows remote work';
COMMENT ON COLUMN "Job"."status" IS 'Job status (active, expired, filled, draft)';
COMMENT ON COLUMN "Job"."expiresAt" IS 'When the job posting expires';

-- Create a view for active jobs to simplify queries
CREATE OR REPLACE VIEW "ActiveJobs" AS
SELECT * FROM "Job" 
WHERE "status" = 'active' 
  AND ("expiresAt" IS NULL OR "expiresAt" > NOW());

COMMENT ON VIEW "ActiveJobs" IS 'View containing only active, non-expired jobs for matching algorithms'; 