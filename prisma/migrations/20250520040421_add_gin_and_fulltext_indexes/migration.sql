-- This is an empty migration.

-- Add a full-text index for title, company, and description
CREATE INDEX IF NOT EXISTS job_fulltext_idx ON "Job" USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company,'') || ' ' || coalesce(description,'')));