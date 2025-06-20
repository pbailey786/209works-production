-- Add Application Preferences and Required Questions Support
-- This migration adds external application options and required question validation

-- Add application method and external application support to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "applicationMethod" TEXT DEFAULT 'internal';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "externalApplicationUrl" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "applicationEmail" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "applicationInstructions" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "questionsRequired" BOOLEAN DEFAULT false;

-- Add question responses to JobApplication table
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "questionResponses" JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "Job_applicationMethod_idx" ON "Job"("applicationMethod");
CREATE INDEX IF NOT EXISTS "Job_questionsRequired_idx" ON "Job"("questionsRequired");

-- Add constraints to ensure data integrity
ALTER TABLE "Job" ADD CONSTRAINT "Job_applicationMethod_check" 
CHECK ("applicationMethod" IN ('internal', 'external_url', 'email'));

-- Add constraint to ensure external URL is provided when method is external_url
ALTER TABLE "Job" ADD CONSTRAINT "Job_externalUrl_check" 
CHECK (
  ("applicationMethod" != 'external_url') OR 
  ("applicationMethod" = 'external_url' AND "externalApplicationUrl" IS NOT NULL)
);

-- Add constraint to ensure email is provided when method is email
ALTER TABLE "Job" ADD CONSTRAINT "Job_applicationEmail_check" 
CHECK (
  ("applicationMethod" != 'email') OR 
  ("applicationMethod" = 'email' AND "applicationEmail" IS NOT NULL)
);

-- Update existing jobs to have default application method
UPDATE "Job" SET "applicationMethod" = 'internal' WHERE "applicationMethod" IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN "Job"."applicationMethod" IS 'How applicants should apply: internal (209 Works system), external_url (company website), or email (send to employer email)';
COMMENT ON COLUMN "Job"."externalApplicationUrl" IS 'URL where applicants should apply when applicationMethod is external_url';
COMMENT ON COLUMN "Job"."applicationEmail" IS 'Email address where applicants should send applications when applicationMethod is email';
COMMENT ON COLUMN "Job"."applicationInstructions" IS 'Custom instructions for applicants on how to apply';
COMMENT ON COLUMN "Job"."questionsRequired" IS 'Whether applicants must answer all supplemental questions to apply';
COMMENT ON COLUMN "JobApplication"."questionResponses" IS 'JSON object containing answers to supplemental questions {questionId: answer}';
