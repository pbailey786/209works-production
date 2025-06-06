import { DomainConfig } from './config';

export interface JobFilterParams {
  location?: string;
  radius?: number;
  cities?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function getDomainJobFilters(
  domainConfig: DomainConfig
): JobFilterParams {
  return {
    location: domainConfig.region,
    radius: domainConfig.radius,
    cities: domainConfig.cities,
    coordinates: domainConfig.coordinates,
  };
}

// Prisma-compatible filter object
export function generatePrismaJobFilter(domainConfig: DomainConfig) {
  const filters = getDomainJobFilters(domainConfig);

  const locationFilters: any[] = [];

  // Filter by cities
  if (filters.cities && filters.cities.length > 0) {
    filters.cities.forEach(city => {
      locationFilters.push({
        location: {
          contains: city,
          mode: 'insensitive',
        },
      });
    });
  }

  // If no city filters, use region
  if (locationFilters.length === 0 && filters.location) {
    locationFilters.push({
      location: {
        contains: filters.location,
        mode: 'insensitive',
      },
    });
  }

  return {
    OR: locationFilters.length > 0 ? locationFilters : undefined,
  };
}

// Helper to determine if a job matches the domain's region
export function isJobInDomainRegion(
  job: any,
  domainConfig: DomainConfig
): boolean {
  if (!job.location) return false;

  const location = job.location.toLowerCase();
  const filters = getDomainJobFilters(domainConfig);

  // Check if job location matches any of the domain's cities
  if (filters.cities) {
    for (const city of filters.cities) {
      if (location.includes(city.toLowerCase())) {
        return true;
      }
    }
  }

  // Check if job location matches the region
  if (filters.location && location.includes(filters.location.toLowerCase())) {
    return true;
  }

  return false;
}
