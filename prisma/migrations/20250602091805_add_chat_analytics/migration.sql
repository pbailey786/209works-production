-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "expectedSalaryMax" INTEGER,
ADD COLUMN     "expectedSalaryMin" INTEGER,
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "isOpenToRemote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ChatAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "jobsFound" INTEGER DEFAULT 0,
    "responseTime" DOUBLE PRECISION DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatAnalytics_userId_idx" ON "ChatAnalytics"("userId");

-- CreateIndex
CREATE INDEX "ChatAnalytics_sessionId_idx" ON "ChatAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "ChatAnalytics_createdAt_idx" ON "ChatAnalytics"("createdAt");

-- CreateIndex
CREATE INDEX "ChatAnalytics_question_idx" ON "ChatAnalytics"("question");

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
