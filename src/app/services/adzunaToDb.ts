import { fetchAdzunaJobs, AdzunaJob } from './adzunaService';
import { prisma } from '@/lib/database/prisma';
import { JobType } from '@prisma/client';

function mapContractTimeToJobType(contract_time?: string): JobType {
  switch (contract_time) {
    case 'full_time':
      return 'full_time';
    case 'part_time':
      return 'part_time';
    case 'contract':
      return 'contract';
    case 'internship':
      return 'internship';
    case 'temporary':
      return 'temporary';
    case 'volunteer':
      return 'volunteer';
    default:
      return 'other';
  }
}

export async function upsertAdzunaJobsToDb(
  cities?: string[],
  resultsPerCity?: number
) {
  const adzunaJobs = await fetchAdzunaJobs(cities, resultsPerCity);
  let upserted = 0;
  for (const job of adzunaJobs) {
    try {
      const jobData = {
        title: job.title,
        company: job.company?.display_name || 'Unknown',
        description: job.description,
        location: job.location?.display_name || '',
        salaryMin: job.salary_min ?? null,
        salaryMax: job.salary_max ?? null,
        jobType: mapContractTimeToJobType(job.contract_time),
        categories: job.category?.label ? [job.category.label] : [],
        source: 'adzuna',
        url: job.redirect_url,
        postedAt: new Date(job.created),
      };
      await prisma.job.upsert({
        where: { id: job.id },
        update: jobData,
        create: {
          id: job.id,
          ...jobData,
        },
      });
      upserted++;
    } catch (err) {
      console.error('Failed to upsert job', job.id, err);
    }
  }
  console.log(`Upserted ${upserted} Adzuna jobs to DB.`);
}

// If run directly (node src/app/services/adzunaToDb.ts), execute upsert
if (require.main === module) {
  // Import the full city list from adzunaService
  const { area209Cities } = require('./adzunaService');
  upsertAdzunaJobsToDb(area209Cities, 50).then(() => process.exit(0));
}
