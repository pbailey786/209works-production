const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPagination() {
  console.log('Testing pagination directly with Prisma...\n');
  
  try {
    // Test 1: Get total count
    const totalJobs = await prisma.job.count();
    console.log(`Total jobs in database: ${totalJobs}`);
    
    // Test 2: Page 1 (first 5 jobs)
    console.log('\n--- Page 1 (limit 5) ---');
    const page1 = await prisma.job.findMany({
      take: 5,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        createdAt: true,
      },
    });
    
    console.log(`Found ${page1.length} jobs on page 1:`);
    page1.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title} at ${job.company} (${job.id})`);
    });
    
    // Test 3: Page 2 (next 5 jobs)
    console.log('\n--- Page 2 (limit 5) ---');
    const page2 = await prisma.job.findMany({
      take: 5,
      skip: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        createdAt: true,
      },
    });
    
    console.log(`Found ${page2.length} jobs on page 2:`);
    page2.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title} at ${job.company} (${job.id})`);
    });
    
    // Test 4: Search with pagination
    console.log('\n--- Search "developer" with pagination ---');
    const searchResults = await prisma.job.findMany({
      where: {
        OR: [
          { title: { contains: 'developer', mode: 'insensitive' } },
          { description: { contains: 'developer', mode: 'insensitive' } },
        ],
      },
      take: 3,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
      },
    });
    
    console.log(`Found ${searchResults.length} developer jobs:`);
    searchResults.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title} at ${job.company}`);
    });
    
    // Test 5: Calculate pagination metadata
    const limit = 5;
    const totalPages = Math.ceil(totalJobs / limit);
    console.log(`\n--- Pagination Metadata ---`);
    console.log(`Total jobs: ${totalJobs}`);
    console.log(`Jobs per page: ${limit}`);
    console.log(`Total pages: ${totalPages}`);
    console.log(`Page 1 has next page: ${totalJobs > limit}`);
    console.log(`Page 2 has previous page: true`);
    console.log(`Page 2 has next page: ${totalJobs > limit * 2}`);
    
    console.log('\n✅ Pagination test completed successfully!');
    
  } catch (error) {
    console.error('❌ Pagination test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPagination(); 