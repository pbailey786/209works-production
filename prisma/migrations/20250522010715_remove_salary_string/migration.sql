/*
  Warnings:

  - You are about to drop the column `salary` on the `Job` table. All the data in the column will be lost.
  - The `jobType` column on the `SearchAnalytics` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "Job_description_idx";

-- DropIndex
DROP INDEX "Job_salary_idx";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "salary",
ADD COLUMN     "salaryMax" INTEGER,
ADD COLUMN     "salaryMin" INTEGER;

-- AlterTable
ALTER TABLE "SearchAnalytics" DROP COLUMN "jobType",
ADD COLUMN     "jobType" "JobType";

-- CreateIndex
CREATE INDEX "SearchAnalytics_createdAt_idx" ON "SearchAnalytics"("createdAt");

-- AddForeignKey
ALTER TABLE "SearchAnalytics" ADD CONSTRAINT "SearchAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
