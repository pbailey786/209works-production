// Test warehouse query directly
const { PrismaClient } = require('@prisma/client');

async function testWarehouseQuery() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing warehouse query...');
    
    // Test 1: Simple title search
    const titleSearch = await prisma.job.findMany({
      where: {
        status: 'active',
        title: {
          contains: 'warehouse'
        }
      },
      select: {
        id: true,
        title: true,
        company: true,
        categories: true
      },
      take: 5
    });
    
    console.log('Title search results:', titleSearch.length);
    titleSearch.forEach(job => {
      console.log(`- ${job.title} at ${job.company} (categories: ${JSON.stringify(job.categories)})`);
    });
    
    // Test 2: Case insensitive search
    const caseInsensitiveSearch = await prisma.job.findMany({
      where: {
        status: 'active',
        title: {
          contains: 'Warehouse'
        }
      },
      take: 5
    });
    
    console.log('\nCase sensitive "Warehouse" search results:', caseInsensitiveSearch.length);
    
    // Test 3: Description search
    const descriptionSearch = await prisma.job.findMany({
      where: {
        status: 'active',
        description: {
          contains: 'warehouse'
        }
      },
      take: 5
    });
    
    console.log('Description search results:', descriptionSearch.length);
    
    // Test 4: All active jobs
    const allActive = await prisma.job.count({
      where: {
        status: 'active'
      }
    });
    
    console.log('Total active jobs:', allActive);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWarehouseQuery();