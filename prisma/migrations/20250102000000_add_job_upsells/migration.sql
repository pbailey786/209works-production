-- Add upsell fields to JobPostOptimizer table
ALTER TABLE "JobPostOptimizer" ADD COLUMN "socialMediaShoutout" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobPostOptimizer" ADD COLUMN "placementBump" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobPostOptimizer" ADD COLUMN "upsellBundle" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobPostOptimizer" ADD COLUMN "upsellTotal" DECIMAL(10,2);

-- Add upsell fields to Job table
ALTER TABLE "Job" ADD COLUMN "socialMediaShoutout" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "placementBump" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "upsellBundle" BOOLEAN NOT NULL DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX "Job_socialMediaShoutout_idx" ON "Job"("socialMediaShoutout");
CREATE INDEX "Job_placementBump_idx" ON "Job"("placementBump");
CREATE INDEX "Job_upsellBundle_idx" ON "Job"("upsellBundle");

CREATE INDEX "JobPostOptimizer_socialMediaShoutout_idx" ON "JobPostOptimizer"("socialMediaShoutout");
CREATE INDEX "JobPostOptimizer_placementBump_idx" ON "JobPostOptimizer"("placementBump");
CREATE INDEX "JobPostOptimizer_upsellBundle_idx" ON "JobPostOptimizer"("upsellBundle");
