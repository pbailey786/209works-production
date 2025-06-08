-- Add duplicate tracking for job posts
-- This will help AI assistants monitor for duplicate/spam posts

-- Add fields to Job table for duplicate detection
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "titleHash" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "descriptionHash" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "duplicateScore" DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "flaggedAsDuplicate" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "duplicateOfJobId" TEXT;

-- Create indexes for duplicate detection
CREATE INDEX IF NOT EXISTS idx_job_title_hash ON "Job"("titleHash");
CREATE INDEX IF NOT EXISTS idx_job_description_hash ON "Job"("descriptionHash");
CREATE INDEX IF NOT EXISTS idx_job_employer_company ON "Job"("employerId", "company");
CREATE INDEX IF NOT EXISTS idx_job_flagged_duplicate ON "Job"("flaggedAsDuplicate");

-- Create table for tracking job posting patterns
CREATE TABLE IF NOT EXISTS "JobPostingPattern" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "employerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "titlePattern" TEXT NOT NULL,
    "descriptionPattern" TEXT,
    "locationPattern" TEXT,
    "salaryPattern" TEXT,
    "postingFrequency" INTEGER DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspiciousScore" DECIMAL(3,2) DEFAULT 0.0,
    "flaggedForReview" BOOLEAN DEFAULT FALSE,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "isBlacklisted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPostingPattern_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for pattern tracking
CREATE INDEX IF NOT EXISTS idx_pattern_employer ON "JobPostingPattern"("employerId");
CREATE INDEX IF NOT EXISTS idx_pattern_company ON "JobPostingPattern"("companyName");
CREATE INDEX IF NOT EXISTS idx_pattern_suspicious ON "JobPostingPattern"("suspiciousScore");
CREATE INDEX IF NOT EXISTS idx_pattern_flagged ON "JobPostingPattern"("flaggedForReview");
CREATE INDEX IF NOT EXISTS idx_pattern_frequency ON "JobPostingPattern"("postingFrequency");

-- Create table for duplicate job alerts
CREATE TABLE IF NOT EXISTS "DuplicateJobAlert" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "originalJobId" TEXT NOT NULL,
    "duplicateJobId" TEXT NOT NULL,
    "similarityScore" DECIMAL(3,2) NOT NULL,
    "detectionMethod" TEXT NOT NULL, -- 'title_hash', 'description_hash', 'ai_analysis', 'manual'
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'false_positive', 'ignored'
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "actionTaken" TEXT, -- 'removed', 'flagged', 'merged', 'none'
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateJobAlert_originalJobId_fkey" FOREIGN KEY ("originalJobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DuplicateJobAlert_duplicateJobId_fkey" FOREIGN KEY ("duplicateJobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for duplicate alerts
CREATE INDEX IF NOT EXISTS idx_duplicate_alert_original ON "DuplicateJobAlert"("originalJobId");
CREATE INDEX IF NOT EXISTS idx_duplicate_alert_duplicate ON "DuplicateJobAlert"("duplicateJobId");
CREATE INDEX IF NOT EXISTS idx_duplicate_alert_score ON "DuplicateJobAlert"("similarityScore");
CREATE INDEX IF NOT EXISTS idx_duplicate_alert_status ON "DuplicateJobAlert"("reviewStatus");
CREATE INDEX IF NOT EXISTS idx_duplicate_alert_method ON "DuplicateJobAlert"("detectionMethod");

-- Create function to calculate text similarity hash
CREATE OR REPLACE FUNCTION calculate_text_hash(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Simple hash function for duplicate detection
    -- Remove common words, normalize spacing, convert to lowercase
    RETURN md5(
        regexp_replace(
            regexp_replace(
                lower(trim(input_text)),
                '\s+', ' ', 'g'
            ),
            '\b(the|and|or|but|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|around|under|over|inside|outside|within|without|against|toward|towards|across|behind|beside|beneath|beyond|near|next|off|onto|upon|via|per|plus|minus|times|versus|vs|inc|llc|ltd|corp|corporation|company|co|group|team|staff|employee|employees|work|job|position|role|opportunity|career|hiring|seeking|looking|wanted|needed|required|must|should|will|can|may|able|experience|years|year|month|months|week|weeks|day|days|hour|hours|full|part|time|remote|onsite|office|home|salary|wage|pay|compensation|benefits|insurance|health|dental|vision|vacation|pto|401k|retirement|bonus|commission|tips|overtime|flexible|schedule|shift|morning|afternoon|evening|night|weekend|weekday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b',
                '', 'gi'
            )
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to detect potential duplicates
CREATE OR REPLACE FUNCTION detect_job_duplicates(job_id TEXT)
RETURNS TABLE(
    duplicate_job_id TEXT,
    similarity_score DECIMAL(3,2),
    detection_method TEXT
) AS $$
DECLARE
    current_job RECORD;
    title_hash TEXT;
    desc_hash TEXT;
BEGIN
    -- Get the current job details
    SELECT * INTO current_job FROM "Job" WHERE id = job_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate hashes
    title_hash := calculate_text_hash(current_job.title);
    desc_hash := calculate_text_hash(current_job.description);
    
    -- Find jobs with identical title hash (exact duplicates)
    RETURN QUERY
    SELECT 
        j.id,
        1.0::DECIMAL(3,2),
        'title_hash'::TEXT
    FROM "Job" j
    WHERE j.id != job_id
        AND j."employerId" = current_job."employerId"
        AND calculate_text_hash(j.title) = title_hash
        AND j."deletedAt" IS NULL
        AND j.status = 'active';
    
    -- Find jobs with identical description hash
    RETURN QUERY
    SELECT 
        j.id,
        0.95::DECIMAL(3,2),
        'description_hash'::TEXT
    FROM "Job" j
    WHERE j.id != job_id
        AND j."employerId" = current_job."employerId"
        AND calculate_text_hash(j.description) = desc_hash
        AND j."deletedAt" IS NULL
        AND j.status = 'active'
        AND j.id NOT IN (
            SELECT duplicate_job_id FROM detect_job_duplicates(job_id) WHERE detection_method = 'title_hash'
        );
    
    -- Find jobs with same company and very similar titles (potential duplicates)
    RETURN QUERY
    SELECT 
        j.id,
        0.8::DECIMAL(3,2),
        'company_title_similarity'::TEXT
    FROM "Job" j
    WHERE j.id != job_id
        AND j.company = current_job.company
        AND j.location = current_job.location
        AND similarity(j.title, current_job.title) > 0.7
        AND j."deletedAt" IS NULL
        AND j.status = 'active'
        AND j.id NOT IN (
            SELECT duplicate_job_id FROM detect_job_duplicates(job_id) 
            WHERE detection_method IN ('title_hash', 'description_hash')
        );
END;
$$ LANGUAGE plpgsql;

-- Enable pg_trgm extension for similarity function (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigger to automatically detect duplicates when a job is created
CREATE OR REPLACE FUNCTION trigger_detect_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    duplicate_record RECORD;
BEGIN
    -- Only check for duplicates on INSERT and when status is active
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- Update the job with calculated hashes
        UPDATE "Job" 
        SET 
            "titleHash" = calculate_text_hash(NEW.title),
            "descriptionHash" = calculate_text_hash(NEW.description)
        WHERE id = NEW.id;
        
        -- Check for duplicates
        FOR duplicate_record IN 
            SELECT * FROM detect_job_duplicates(NEW.id)
        LOOP
            -- Insert duplicate alert
            INSERT INTO "DuplicateJobAlert" (
                "originalJobId",
                "duplicateJobId", 
                "similarityScore",
                "detectionMethod"
            ) VALUES (
                duplicate_record.duplicate_job_id,
                NEW.id,
                duplicate_record.similarity_score,
                duplicate_record.detection_method
            );
            
            -- Flag the new job if high similarity
            IF duplicate_record.similarity_score >= 0.9 THEN
                UPDATE "Job" 
                SET 
                    "flaggedAsDuplicate" = TRUE,
                    "duplicateOfJobId" = duplicate_record.duplicate_job_id,
                    "duplicateScore" = duplicate_record.similarity_score
                WHERE id = NEW.id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS detect_duplicates_trigger ON "Job";
CREATE TRIGGER detect_duplicates_trigger
    AFTER INSERT ON "Job"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_detect_duplicates();

-- Create view for admin dashboard to monitor duplicates
CREATE OR REPLACE VIEW "DuplicateJobsView" AS
SELECT 
    dja.id as alert_id,
    dja."similarityScore",
    dja."detectionMethod",
    dja."reviewStatus",
    dja."detectedAt",
    
    -- Original job details
    j1.id as original_job_id,
    j1.title as original_title,
    j1.company as original_company,
    j1."employerId" as original_employer_id,
    u1.email as original_employer_email,
    j1."postedAt" as original_posted_at,
    
    -- Duplicate job details
    j2.id as duplicate_job_id,
    j2.title as duplicate_title,
    j2.company as duplicate_company,
    j2."employerId" as duplicate_employer_id,
    u2.email as duplicate_employer_email,
    j2."postedAt" as duplicate_posted_at,
    j2."flaggedAsDuplicate"
    
FROM "DuplicateJobAlert" dja
JOIN "Job" j1 ON dja."originalJobId" = j1.id
JOIN "Job" j2 ON dja."duplicateJobId" = j2.id
JOIN "User" u1 ON j1."employerId" = u1.id
JOIN "User" u2 ON j2."employerId" = u2.id
WHERE j1."deletedAt" IS NULL 
    AND j2."deletedAt" IS NULL
ORDER BY dja."detectedAt" DESC, dja."similarityScore" DESC;
