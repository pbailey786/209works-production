const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testJobSearch() {
  try {
    console.log('Testing job search functionality...\n');

    // Test 1: Get all jobs
    console.log('1. Testing: Get all jobs');
    const allJobs = await prisma.job.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
      },
    });
    console.log(`Found ${allJobs.length} total jobs:`);
    allJobs.forEach(job => {
      console.log(`  - ${job.title} at ${job.company} (${job.location})`);
    });
    console.log('');

    // Test 2: Search for Stockton jobs
    console.log('2. Testing: Search for Stockton jobs');
    const stocktonJobs = await prisma.job.findMany({
      where: {
        status: 'active',
        location: {
          contains: 'stockton',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
      },
    });
    console.log(`Found ${stocktonJobs.length} Stockton jobs:`);
    stocktonJobs.forEach(job => {
      console.log(`  - ${job.title} at ${job.company} (${job.location})`);
    });
    console.log('');

    // Test 3: Search for warehouse jobs
    console.log('3. Testing: Search for warehouse jobs');
    const warehouseJobs = await prisma.job.findMany({
      where: {
        status: 'active',
        OR: [
          { title: { contains: 'warehouse', mode: 'insensitive' } },
          { categories: { has: 'warehouse' } },
        ],
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        categories: true,
      },
    });
    console.log(`Found ${warehouseJobs.length} warehouse jobs:`);
    warehouseJobs.forEach(job => {
      console.log(
        `  - ${job.title} at ${job.company} (${job.location}) [${job.categories.join(', ')}]`
      );
    });
    console.log('');

    // Test 4: Search for 209 area cities
    console.log('4. Testing: Search for 209 area cities');
    const cities209 = [
      'stockton',
      'modesto',
      'tracy',
      'manteca',
      'lodi',
      'turlock',
      'merced',
    ];
    const area209Jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        OR: cities209.map(city => ({
          location: {
            contains: city,
            mode: 'insensitive',
          },
        })),
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
      },
    });
    console.log(`Found ${area209Jobs.length} jobs in 209 area:`);
    area209Jobs.forEach(job => {
      console.log(`  - ${job.title} at ${job.company} (${job.location})`);
    });
    console.log('');

    // Test 5: Search by job type
    console.log('5. Testing: Search for full-time jobs');
    const fullTimeJobs = await prisma.job.findMany({
      where: {
        status: 'active',
        jobType: 'full_time',
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
      },
    });
    console.log(`Found ${fullTimeJobs.length} full-time jobs:`);
    fullTimeJobs.forEach(job => {
      console.log(
        `  - ${job.title} at ${job.company} (${job.location}) [${job.jobType}]`
      );
    });
    console.log('');

    console.log('Job search tests completed successfully! ✅');
  } catch (error) {
    console.error('Error testing job search:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJobSearch();
