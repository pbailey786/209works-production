-- SQL script to create or update admin user
-- Run this in your database (Supabase SQL editor or PostgreSQL client)

-- Option 1: Update existing user to admin role
-- Replace 'your-email@example.com' with your actual email
UPDATE "User" 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Option 2: Create new admin user (if you don't have an account yet)
-- Replace the values with your actual information
-- Note: You'll need to hash the password first (see Node.js script below)
INSERT INTO "User" (
  id,
  email,
  name,
  "passwordHash",
  role,
  "isEmailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'admin@209.works',
  'Admin User',
  '$2a$10$your-hashed-password-here', -- Replace with actual hashed password
  'admin',
  true,
  NOW(),
  NOW()
);

-- Verify the admin user was created/updated
SELECT id, email, name, role, "isEmailVerified", "createdAt" 
FROM "User" 
WHERE role = 'admin';
