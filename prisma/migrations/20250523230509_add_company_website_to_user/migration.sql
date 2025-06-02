CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

/*
  Warnings:

  - The values [user] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `embedding` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'employer', 'jobseeker');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'jobseeker';
COMMIT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "embedding" extensions.vector NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyWebsite" TEXT,
ALTER COLUMN "role" SET DEFAULT 'jobseeker';
