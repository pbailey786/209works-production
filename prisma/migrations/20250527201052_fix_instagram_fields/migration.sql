-- AlterTable
ALTER TABLE "InstagramPost" ADD COLUMN     "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "InstagramSchedule" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles';

-- AlterTable
ALTER TABLE "InstagramTemplate" ADD COLUMN     "type" "InstagramPostType" NOT NULL DEFAULT 'job_listing';
