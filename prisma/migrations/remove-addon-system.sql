-- Migration: Remove Add-On System
-- This removes the entire add-on marketplace system as part of strategic simplification

-- Drop indexes first
DROP INDEX IF EXISTS "AddOn_category_idx";
DROP INDEX IF EXISTS "AddOn_type_idx";
DROP INDEX IF EXISTS "AddOn_isActive_idx";
DROP INDEX IF EXISTS "AddOn_displayOrder_idx";

DROP INDEX IF EXISTS "UserAddOn_userId_idx";
DROP INDEX IF EXISTS "UserAddOn_addOnId_idx";
DROP INDEX IF EXISTS "UserAddOn_isActive_idx";
DROP INDEX IF EXISTS "UserAddOn_expiresAt_idx";
DROP INDEX IF EXISTS "UserAddOn_nextBillingDate_idx";

-- Drop constraints
ALTER TABLE "UserAddOn" DROP CONSTRAINT IF EXISTS "UserAddOn_userId_fkey";
ALTER TABLE "UserAddOn" DROP CONSTRAINT IF EXISTS "UserAddOn_addOnId_fkey";
ALTER TABLE "UserAddOn" DROP CONSTRAINT IF EXISTS "UserAddOn_userId_addOnId_key";

-- Drop tables
DROP TABLE IF EXISTS "UserAddOn";
DROP TABLE IF EXISTS "AddOn";

-- Drop enums (if not used elsewhere)
DROP TYPE IF EXISTS "AddOnCategory";
DROP TYPE IF EXISTS "AddOnType";

-- Remove userAddOns relation from User table
-- Note: This will be handled in the Prisma schema update 