// Basic job types for production use
export interface JobData {
  id: number | string;
  title: string;
  company: string;
  description: string;
  location?: string; // Made optional to match existing types
  type: string;
  postedAt: string;
  url?: string;
  salaryMin?: number;
  salaryMax?: number;
  categories?: string[];
  isRemote?: boolean;
  status?: string;
  source?: string;

  // Multi-area-code network fields
  areaCodes?: string[];
  city?: string | null;
  targetCities?: string[];
  lat?: number | null;
  lng?: number | null;
}

export interface CompanyInfo {
  logo?: string;
  size?: string;
  industry?: string;
  founded?: string;
  website?: string;
  description?: string;
}

export interface EnhancedJobData extends JobData {
  companyInfo: CompanyInfo;
  viewsCount: number;
  applicantsCount: number;
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  experienceLevel?: string;
  applicationDeadline?: string;
  responsibilities?: string[];
}

// Area code specific types
export interface AreaCodeConfig {
  areaCode: string;
  region: string;
  displayName: string;
  cities: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  radius?: number;
}

export interface JobWithAreaCode extends JobData {
  areaCodes: string[];
  city: string | null;
  targetCities: string[];
  lat: number | null;
  lng: number | null;
}

// Simple function to create enhanced job data from basic job data
export function generateEnhancedJobData(baseJob: any): EnhancedJobData {
  return {
    ...baseJob,
    location: baseJob.location || 'Location not specified',
    companyInfo: {
      logo: undefined, // No placeholder logos in production
      size: 'Unknown',
      industry: 'Various',
      founded: 'Unknown',
      website: baseJob.company ? `https://${baseJob.company.toLowerCase().replace(/\s+/g, '')}.com` : undefined,
      description: `${baseJob.company} is a company looking for talented individuals.`,
    },
    viewsCount: 0,
    applicantsCount: 0,
    requirements: [],
    benefits: [],
    skills: [],
    experienceLevel: 'Mid-level',
    applicationDeadline: undefined,
    responsibilities: [],
  };
}
