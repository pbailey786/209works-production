-- CreateTable
CREATE TABLE "JobSeekerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zipCode" TEXT,
    "distanceWillingToTravel" INTEGER,
    "availabilityDays" TEXT[],
    "availabilityShifts" TEXT[],
    "jobTypes" TEXT[],
    "skills" TEXT[],
    "careerGoal" TEXT,
    "optInEmailAlerts" BOOLEAN NOT NULL DEFAULT false,
    "optInSmsAlerts" BOOLEAN NOT NULL DEFAULT false,
    "allowEmployerMessages" BOOLEAN NOT NULL DEFAULT false,
    "resumeData" JSONB,
    "whatAreYouGoodAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSeekerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industryType" TEXT,
    "logoUrl" TEXT,
    "location" TEXT,
    "hiresTeens" BOOLEAN NOT NULL DEFAULT false,
    "hiresSeniors" BOOLEAN NOT NULL DEFAULT false,
    "providesTraining" BOOLEAN NOT NULL DEFAULT false,
    "requiresBackgroundCheck" BOOLEAN NOT NULL DEFAULT false,
    "jobRolesCommon" TEXT[],
    "postingPrefersAi" BOOLEAN NOT NULL DEFAULT false,
    "contactMethod" TEXT,
    "hiringGoal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobSeekerProfile_userId_key" ON "JobSeekerProfile"("userId");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_userId_idx" ON "JobSeekerProfile"("userId");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_zipCode_idx" ON "JobSeekerProfile"("zipCode");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_careerGoal_idx" ON "JobSeekerProfile"("careerGoal");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_optInEmailAlerts_idx" ON "JobSeekerProfile"("optInEmailAlerts");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON "EmployerProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployerProfile_userId_idx" ON "EmployerProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployerProfile_companyName_idx" ON "EmployerProfile"("companyName");

-- CreateIndex
CREATE INDEX "EmployerProfile_industryType_idx" ON "EmployerProfile"("industryType");

-- CreateIndex
CREATE INDEX "EmployerProfile_hiringGoal_idx" ON "EmployerProfile"("hiringGoal");

-- AddForeignKey
ALTER TABLE "JobSeekerProfile" ADD CONSTRAINT "JobSeekerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
