// Test case insensitive query
const { PrismaClient } = require('@prisma/client');

async function testCaseInsensitive() {
  const prisma = new PrismaClient();
  
  try {
    // Test the exact query we're building
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
        categories: true
      }
    });
    
    console.log('Full query results:', result.length);
    result.forEach(job => {
      console.log(`- ${job.title} at ${job.company} in ${job.location} (remote: ${job.isRemote})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCaseInsensitive();