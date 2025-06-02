-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentJobTitle" TEXT,
ADD COLUMN     "educationExperience" TEXT,
ADD COLUMN     "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "preferredJobTypes" TEXT[],
ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "workAuthorization" TEXT;
