-- SQL script to update your user to admin role
-- Run this in your Supabase SQL editor

-- First, let's see what users exist
SELECT id, email, name, role, "isEmailVerified", "createdAt" 
FROM "User" 
ORDER BY "createdAt" DESC;

-- Update the user to admin role
-- Replace 'your-actual-email@domain.com' with your real email address
UPDATE "User" 
SET role = 'admin' 
WHERE email = 'your-actual-email@domain.com';

-- Alternative: If you know your user ID, you can use that instead
-- UPDATE "User" 
-- SET role = 'admin' 
-- WHERE id = 'your-user-id-here';

-- Verify the update worked
SELECT id, email, name, role, "isEmailVerified", "createdAt" 
FROM "User" 
WHERE role = 'admin';

-- If no users exist yet, create an admin user
-- (Uncomment and modify the lines below if needed)
/*
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
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  'admin',
  true,
  NOW(),
  NOW()
);
*/
