// Simplified job query builder without case-insensitive mode  
export function buildJobQueryFromFiltersSafe(filters: any) {
  const query: any = {
    status: 'active',
    AND: [],
  };

  // Add basic filters to ensure we only get active, non-expired jobs
  query.AND.push({
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  });

  // HYPERLOCAL FILTERING: Prioritize local/hybrid over remote
  const userRequestsRemote = filters.isRemote === true || 
    (filters.other && filters.other.toLowerCase().includes('remote'));
  const userPreferencesLocal = filters.isLocalPreferred === true;
  
  if (!userRequestsRemote) {
    if (userPreferencesLocal) {
      // User explicitly wants local jobs - exclude all remote
      query.AND.push({ isRemote: false });
    } else {
      // Default hyperlocal filtering
      query.AND.push({
        OR: [
          { isRemote: false }, // Local jobs
          { 
            AND: [
              { isRemote: true }, // Hybrid/remote jobs that also have local presence
              {
                OR: [
                  // Check location field for Central Valley cities
                  { location: { contains: 'Stockton' } },
                  { location: { contains: 'Modesto' } },
                  { location: { contains: 'Tracy' } },
                  { location: { contains: 'Manteca' } },
                  { location: { contains: 'Lodi' } },
                  { location: { contains: 'Turlock' } },
                  { location: { contains: 'Merced' } },
                  { location: { contains: 'Sacramento' } },
                  { location: { contains: 'Central Valley' } },
                  { location: { contains: '209' } }
                ]
              }
            ]
          }
        ]
      });
    }
  }

  // If we have previous jobs and this is a sorting request, filter to those jobs
  if (
    filters.previousJobs &&
    filters.previousJobs.length > 0 &&
    filters.sortBy !== 'relevance'
  ) {
    const jobIds = filters.previousJobs
      .map((job: any) => job.id)
      .filter(Boolean);
    if (jobIds.length > 0) {
      query.AND.push({ id: { in: jobIds } });
    }
  }

  // Location filter with case-insensitive search
  if (filters.location && filters.location !== '209 area') {
    query.AND.push({
      location: {
        contains: filters.location,
      },
    });
  }
  // Note: If location is '209 area' or null, we rely on hyperlocal filtering above

  // Job type filter
  if (filters.job_type) {
    query.AND.push({ jobType: filters.job_type });
  }

  // Company filter
  if (filters.company) {
    query.AND.push({
      company: {
        contains: filters.company,
      },
    });
  }

  // Industry filter - search in categories, title, and description
  if (filters.industry) {
    query.AND.push({
      OR: [
        {
          categories: {
            has: filters.industry,
          },
        },
        {
          title: {
            contains: filters.industry,
          },
        },
        {
          description: {
            contains: filters.industry,
          },
        },
      ],
    });
  }

  // Role/title filter
  if (filters.role) {
    query.AND.push({
      title: {
        contains: filters.role,
      },
    });
  }

  // Remote filter
  if (typeof filters.isRemote === 'boolean') {
    query.AND.push({ isRemote: filters.isRemote });
  }

  // General search terms
  if (filters.other && !filters.previousJobs) {
    query.AND.push({
      OR: [
        { title: { contains: filters.other } },
        { description: { contains: filters.other } },
        { company: { contains: filters.other } },
      ],
    });
  }

  // Clean up empty AND array
  if (query.AND.length === 0) {
    delete query.AND;
  }

  return query;
}