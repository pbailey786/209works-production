// AdzunaToDb - Database import service
// This service handles importing Adzuna job data to the database

import { prisma } from '@/app/api/auth/prisma';

export interface AdzunaJobData {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  category?: string;
}

export class AdzunaToDbService {
  async importJobToDatabase(jobData: AdzunaJobData): Promise<void> {
    try {
      await prisma.job.create({
        data: {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          salaryMin: jobData.salary_min,
          salaryMax: jobData.salary_max,
          source: 'adzuna',
          url: jobData.url,
          postedAt: new Date(),
          jobType: 'full_time', // Default value, adjust as needed
          // Add other required fields based on your schema
        }
      });
    } catch (error) {
      console.error('Error importing job to database:', error);
      throw error;
    }
  }

  async batchImportJobs(jobs: AdzunaJobData[]): Promise<void> {
    // TODO: Implement batch import with proper error handling
    for (const job of jobs) {
      await this.importJobToDatabase(job);
    }
  }
}

export default AdzunaToDbService;