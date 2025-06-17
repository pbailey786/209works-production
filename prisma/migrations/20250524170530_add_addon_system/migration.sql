-- CreateEnum
CREATE TYPE "AddOnCategory" AS ENUM ('recruitment_tools', 'candidate_management', 'branding', 'analytics', 'career_services', 'profile_enhancement', 'support', 'integration', 'marketing');

-- CreateEnum
CREATE TYPE "AddOnType" AS ENUM ('one_time', 'recurring', 'feature_unlock', 'usage_based');

-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('basic', 'essential', 'professional', 'enterprise', 'premium');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('monthly', 'yearly', 'one_time');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentTier" "PricingTier" NOT NULL DEFAULT 'basic',
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AddOn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "category" "AddOnCategory" NOT NULL,
    "type" "AddOnType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "compatibleTiers" "PricingTier"[],
    "requiredUserRole" "UserRole"[],
    "featuresIncluded" TEXT[],
    "usageLimits" JSONB,
    "dependsOnAddOns" TEXT[],
    "excludesAddOns" TEXT[],
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "badgeText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAddOn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "pricePaid" DECIMAL(10,2) NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "nextBillingDate" TIMESTAMP(3),
    "usageData" JSONB,
    "usageReset" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_name_key" ON "AddOn"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_slug_key" ON "AddOn"("slug");

-- CreateIndex
CREATE INDEX "AddOn_category_idx" ON "AddOn"("category");

-- CreateIndex
CREATE INDEX "AddOn_type_idx" ON "AddOn"("type");

-- CreateIndex
CREATE INDEX "AddOn_isActive_idx" ON "AddOn"("isActive");

-- CreateIndex
CREATE INDEX "AddOn_displayOrder_idx" ON "AddOn"("displayOrder");

-- CreateIndex
CREATE INDEX "UserAddOn_userId_idx" ON "UserAddOn"("userId");

-- CreateIndex
CREATE INDEX "UserAddOn_addOnId_idx" ON "UserAddOn"("addOnId");

-- CreateIndex
CREATE INDEX "UserAddOn_isActive_idx" ON "UserAddOn"("isActive");

-- CreateIndex
CREATE INDEX "UserAddOn_expiresAt_idx" ON "UserAddOn"("expiresAt");

-- CreateIndex
CREATE INDEX "UserAddOn_nextBillingDate_idx" ON "UserAddOn"("nextBillingDate");

-- CreateIndex
CREATE UNIQUE INDEX "UserAddOn_userId_addOnId_key" ON "UserAddOn"("userId", "addOnId");

-- AddForeignKey
ALTER TABLE "UserAddOn" ADD CONSTRAINT "UserAddOn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddOn" ADD CONSTRAINT "UserAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
