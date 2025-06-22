-- Migration: Pricing Schema Simplification (Task 47.2)
-- This migration implements the simplified 3-tier pricing structure

-- Step 1: Create new SubscriptionStatus enum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'trial', 'past_due');

-- Step 2: Update PricingTier enum to simplified structure
-- First, update any existing users with old tiers to new tiers
UPDATE "User" SET "currentTier" = 'starter' WHERE "currentTier" = 'basic';
UPDATE "User" SET "currentTier" = 'starter' WHERE "currentTier" = 'essential';
-- professional stays the same
-- enterprise stays the same
-- premium stays the same

-- Step 3: Drop and recreate PricingTier enum with new values
ALTER TYPE "PricingTier" RENAME TO "PricingTier_old";
CREATE TYPE "PricingTier" AS ENUM ('starter', 'professional', 'enterprise', 'premium');

-- Update User table to use new enum
ALTER TABLE "User" ALTER COLUMN "currentTier" TYPE "PricingTier" USING "currentTier"::text::"PricingTier";
ALTER TABLE "User" ALTER COLUMN "currentTier" SET DEFAULT 'starter';

-- Drop old enum
DROP TYPE "PricingTier_old";

-- Step 4: Backup existing subscription data before transformation
CREATE TABLE "Subscription_backup" AS SELECT * FROM "Subscription";

-- Step 5: Transform Subscription table to new structure
-- First, add new columns
ALTER TABLE "Subscription" ADD COLUMN "tier" "PricingTier";
ALTER TABLE "Subscription" ADD COLUMN "price" DECIMAL;
ALTER TABLE "Subscription" ADD COLUMN "billingCycle" "BillingInterval";
ALTER TABLE "Subscription" ADD COLUMN "status" "SubscriptionStatus";
ALTER TABLE "Subscription" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "endDate" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrate existing subscription data to new structure
-- Map old email-based subscriptions to job seeker premium tier
UPDATE "Subscription" SET 
  "tier" = 'premium',
  "price" = 19.00,
  "billingCycle" = 'monthly',
  "status" = 'active',
  "startDate" = "createdAt",
  "endDate" = NULL
WHERE "email" IS NOT NULL;

-- Step 6: Remove old columns from Subscription table
ALTER TABLE "Subscription" DROP COLUMN "email";
ALTER TABLE "Subscription" DROP COLUMN "zipCode";
ALTER TABLE "Subscription" DROP COLUMN "categories";

-- Step 7: Add constraints and indexes
ALTER TABLE "Subscription" ALTER COLUMN "tier" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "price" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "billingCycle" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "startDate" SET NOT NULL;

-- Add indexes for performance
CREATE INDEX "Subscription_tier_idx" ON "Subscription"("tier");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- Step 8: Clean up any add-on related data if it exists
-- Note: AddOn tables should already be removed, but this ensures cleanup
DROP TABLE IF EXISTS "UserAddOn" CASCADE;
DROP TABLE IF EXISTS "AddOn" CASCADE;
DROP TABLE IF EXISTS "UserSubscriptionAddOn" CASCADE;

-- Step 9: Update any references in other tables
-- Update Company subscriptionTier to use new enum values
UPDATE "Company" SET "subscriptionTier" = 'starter' WHERE "subscriptionTier" = 'basic';
UPDATE "Company" SET "subscriptionTier" = 'starter' WHERE "subscriptionTier" = 'essential';

COMMENT ON TABLE "Subscription" IS 'Simplified subscription model with 3 employer tiers (starter, professional, enterprise) and 1 job seeker tier (premium)';
COMMENT ON COLUMN "Subscription"."tier" IS 'Pricing tier: starter ($49), professional ($99), enterprise (custom), premium ($19 for job seekers)';
COMMENT ON COLUMN "Subscription"."price" IS 'Monthly price in USD for this subscription';
COMMENT ON COLUMN "Subscription"."billingCycle" IS 'Billing frequency: monthly or yearly';
COMMENT ON COLUMN "Subscription"."status" IS 'Current subscription status'; 