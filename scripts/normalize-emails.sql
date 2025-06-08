-- Script to normalize email addresses to lowercase and remove duplicates
-- Run this in Supabase SQL Editor

-- First, let's see what duplicates we have
SELECT 
  LOWER(email) as normalized_email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as user_ids,
  STRING_AGG(email, ', ') as original_emails
FROM "User"
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- Update all emails to lowercase
UPDATE "User" 
SET email = LOWER(email)
WHERE email != LOWER(email);

-- For duplicate emails, we need to handle them manually
-- This query shows which duplicates exist after normalization
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as user_ids,
  STRING_AGG(role::text, ', ') as roles,
  STRING_AGG("createdAt"::text, ', ') as created_dates
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;

-- Manual cleanup for digitalstele@gmail.com specifically
-- Keep the employer account that was created first, delete the duplicate
DELETE FROM "User" 
WHERE email = 'digitalstele@gmail.com' 
AND id = '1eb31abb-b8f9-4edc-8713-78cd6e420849';

-- Verify no more duplicates exist
SELECT 
  email,
  COUNT(*) as count
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;
