// Debug the exact query with job_type filter
const { PrismaClient } = require('@prisma/client');

async function debugWithJobType() {
  const prisma = new PrismaClient();
  
  try {
    // Test the exact query with job_type filter added
    const result = await prisma.job.findMany({
      where: {
        status: 'active',
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          {
            OR: [
              { isRemote: false },
              { 
                AND: [
                  { isRemote: true },
                  {
                    OR: [
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
          },
          // Add job type filter
          { jobType: 'full_time' },
          {
            OR: [
              {
                categories: {
                  has: 'warehouse',
                },
              },
              {
                title: {
                  contains: 'warehouse',
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: 'warehouse',
                  mode: 'insensitive',
                },
              },
            ],
          }
        ]
      },
      take: 5,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        isRemote: true,
        jobType: true,
        categories: true
      }
    });
    
    console.log('Results with jobType filter:', result.length);
    result.forEach(job => {
      console.log(`- ${job.title} at ${job.company} in ${job.location} (type: ${job.jobType}, remote: ${job.isRemote})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugWithJobType();