-- Manual migration to fix Subscription model and PricingTier enum
-- This needs to be run manually due to PostgreSQL enum constraints

-- Step 1: Add new enum value for PricingTier
ALTER TYPE "PricingTier" ADD VALUE 'starter';

-- Step 2: Add missing fields to Subscription table
ALTER TABLE "Subscription" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Subscription" ADD COLUMN "tier" "PricingTier" NOT NULL DEFAULT 'starter';
ALTER TABLE "Subscription" ADD COLUMN "status" "SubscriptionStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "Subscription" ADD COLUMN "billingCycle" "BillingInterval" NOT NULL DEFAULT 'monthly';
ALTER TABLE "Subscription" ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Subscription" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "endDate" TIMESTAMP(3);

-- Step 3: Create indexes
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_tier_idx" ON "Subscription"("tier");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- Step 4: Update existing records to have valid data
UPDATE "Subscription" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL; 