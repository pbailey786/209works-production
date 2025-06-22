-- CreateTable
CREATE TABLE "SearchAnalytics" (
    "id" TEXT NOT NULL,
    "query" TEXT,
    "location" TEXT,
    "jobType" TEXT,
    "category" TEXT,
    "datePosted" TEXT,
    "sortBy" TEXT,
    "sortOrder" TEXT,
    "resultCount" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchAnalytics_pkey" PRIMARY KEY ("id")
);
