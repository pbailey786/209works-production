-- Add database constraints to ensure emails are always lowercase
-- Run this in Supabase SQL Editor after cleaning up duplicates

-- Create a function to automatically lowercase emails
CREATE OR REPLACE FUNCTION lowercase_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically lowercase emails on insert/update
DROP TRIGGER IF EXISTS trigger_lowercase_email ON "User";
CREATE TRIGGER trigger_lowercase_email
  BEFORE INSERT OR UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION lowercase_email();

-- Add a check constraint to ensure emails are lowercase
ALTER TABLE "User" 
ADD CONSTRAINT check_email_lowercase 
CHECK (email = LOWER(email));

-- Verify the constraint works
-- This should succeed
-- INSERT INTO "User" (id, email, "passwordHash", role) 
-- VALUES (gen_random_uuid(), 'test@example.com', 'hash', 'jobseeker');

-- This should fail due to uppercase
-- INSERT INTO "User" (id, email, "passwordHash", role) 
-- VALUES (gen_random_uuid(), 'Test@Example.com', 'hash', 'jobseeker');
