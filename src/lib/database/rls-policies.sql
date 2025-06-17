-- Row Level Security (RLS) Policies for 209Jobs
-- Run these in your Supabase SQL editor to secure your database

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SearchHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- User table policies
-- Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON "User"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Employers can see basic info of jobseekers who applied to their jobs
CREATE POLICY "Employers can view applicant profiles" ON "User"
  FOR SELECT USING (
    role = 'jobseeker' 
    AND EXISTS (
      SELECT 1 FROM "JobApplication" ja
      JOIN "Job" j ON ja."jobId" = j.id
      WHERE ja."userId" = "User".id
      AND j."employerId" = auth.uid()::text
    )
  );

-- Job table policies
-- Everyone can view active jobs
CREATE POLICY "Anyone can view jobs" ON "Job"
  FOR SELECT USING (true);

-- Only employers can create jobs
CREATE POLICY "Employers can create jobs" ON "Job"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('employer', 'admin')
    )
  );

-- Employers can only edit their own jobs
CREATE POLICY "Employers can edit own jobs" ON "Job"
  FOR UPDATE USING (
    "employerId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Employers can only delete their own jobs
CREATE POLICY "Employers can delete own jobs" ON "Job"
  FOR DELETE USING (
    "employerId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Job Application policies
-- Users can only see their own applications
CREATE POLICY "Users can view own applications" ON "JobApplication"
  FOR SELECT USING ("userId" = auth.uid()::text);

-- Users can only create applications for themselves
CREATE POLICY "Users can create own applications" ON "JobApplication"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- Employers can see applications for their jobs
CREATE POLICY "Employers can view job applications" ON "JobApplication"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Job" 
      WHERE id = "JobApplication"."jobId" 
      AND "employerId" = auth.uid()::text
    )
  );

-- Employers can update application status for their jobs
CREATE POLICY "Employers can update application status" ON "JobApplication"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Job" 
      WHERE id = "JobApplication"."jobId" 
      AND "employerId" = auth.uid()::text
    )
  );

-- Saved Job policies
-- Users can only see and manage their own saved jobs
CREATE POLICY "Users can view own saved jobs" ON "SavedJob"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create own saved jobs" ON "SavedJob"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own saved jobs" ON "SavedJob"
  FOR DELETE USING ("userId" = auth.uid()::text);

-- Search History policies
-- Users can only see their own search history
CREATE POLICY "Users can view own search history" ON "SearchHistory"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create own search history" ON "SearchHistory"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- Admins can see all search history for analytics
CREATE POLICY "Admins can view all search history" ON "SearchHistory"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Alert policies
-- Users can only see and manage their own alerts
CREATE POLICY "Users can view own alerts" ON "Alert"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create own alerts" ON "Alert"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update own alerts" ON "Alert"
  FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own alerts" ON "Alert"
  FOR DELETE USING ("userId" = auth.uid()::text);

-- Company policies
-- Everyone can view company profiles
CREATE POLICY "Anyone can view companies" ON "Company"
  FOR SELECT USING (true);

-- Only company owners can edit their company
CREATE POLICY "Company owners can edit company" ON "Company"
  FOR UPDATE USING (
    "ownerId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Audit Log policies
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON "AuditLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- System can always insert audit logs
CREATE POLICY "System can create audit logs" ON "AuditLog"
  FOR INSERT WITH CHECK (true);

-- Additional security functions
-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid()::text 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a job
CREATE OR REPLACE FUNCTION owns_job(job_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "Job" 
    WHERE id = job_id 
    AND "employerId" = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sanitize user data for AI
CREATE OR REPLACE FUNCTION sanitize_user_for_ai(user_data JSONB)
RETURNS JSONB AS $$
BEGIN
  -- Remove sensitive fields before sending to AI
  RETURN user_data - 'passwordHash' - 'twoFactorSecret' - 'magicLinkToken' 
                   - 'passwordResetToken' - 'stripeCustomerId' - 'phoneNumber'
                   - 'resumeUrl' - 'profilePictureUrl';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_job_employer ON "Job"("employerId");
CREATE INDEX IF NOT EXISTS idx_application_user ON "JobApplication"("userId");
CREATE INDEX IF NOT EXISTS idx_application_job ON "JobApplication"("jobId");
CREATE INDEX IF NOT EXISTS idx_saved_job_user ON "SavedJob"("userId");
CREATE INDEX IF NOT EXISTS idx_search_history_user ON "SearchHistory"("userId");
CREATE INDEX IF NOT EXISTS idx_alert_user ON "Alert"("userId");
CREATE INDEX IF NOT EXISTS idx_company_owner ON "Company"("ownerId");

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT ON "Job" TO anon;
GRANT SELECT ON "Company" TO anon;
GRANT ALL ON "User" TO authenticated;
GRANT ALL ON "Job" TO authenticated;
GRANT ALL ON "JobApplication" TO authenticated;
GRANT ALL ON "SavedJob" TO authenticated;
GRANT ALL ON "SearchHistory" TO authenticated;
GRANT ALL ON "Alert" TO authenticated;
GRANT ALL ON "Company" TO authenticated;
GRANT INSERT ON "AuditLog" TO authenticated;
