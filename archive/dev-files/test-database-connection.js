// Simple database connection test
// Run with: node test-database-connection.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic Prisma connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database successfully');

    // Test 2: Simple count query
    console.log('\n2. Testing simple job count...');
    const totalJobs = await prisma.job.count();
    console.log(`   ✅ Found ${totalJobs} total jobs in database`);

    // Test 3: Simple findMany query
    console.log('\n3. Testing basic job query...');
    const jobs = await prisma.job.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true
      }
    });
    console.log(`   ✅ Retrieved ${jobs.length} jobs successfully`);
    
    if (jobs.length > 0) {
      console.log('   📋 Sample job:');
      console.log(`       Title: ${jobs[0].title}`);
      console.log(`       Company: ${jobs[0].company}`);
      console.log(`       Location: ${jobs[0].location}`);
      console.log(`       Type: ${jobs[0].jobType}`);
    }

    // Test 4: Complex query similar to what's failing
    console.log('\n4. Testing complex query (similar to chat API)...');
    const complexQuery = {
      status: 'active',
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ]
        }
      ]
    };

    const complexJobs = await prisma.job.findMany({
      where: complexQuery,
      orderBy: { postedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        status: true,
        expiresAt: true
      }
    });
    
    console.log(`   ✅ Complex query returned ${complexJobs.length} jobs`);

    // Test 5: Test the specific query that might be failing
    console.log('\n5. Testing location-based search...');
    const locationJobs = await prisma.job.findMany({
      where: {
        status: 'active',
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ]
          },
          {
            location: {
              contains: 'stockton',
              mode: 'insensitive'
            }
          }
        ]
      },
      take: 3,
      select: {
        id: true,
        title: true,
        company: true,
        location: true
      }
    });
    
    console.log(`   ✅ Location search returned ${locationJobs.length} jobs for Stockton`);

    console.log('\n🎉 All database tests passed!');
    console.log('\nIf your chat is still failing, the issue might be in:');
    console.log('   - API route configuration');
    console.log('   - Request/response handling');
    console.log('   - OpenAI API key setup');

  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error('Error:', error.message);
    console.error('\nPossible causes:');
    console.error('   1. DATABASE_URL not set correctly');
    console.error('   2. Database not running');
    console.error('   3. Database schema not migrated');
    console.error('   4. Network connection issues');
    console.error('\nTroubleshooting:');
    console.error('   - Check your .env.local file for DATABASE_URL');
    console.error('   - Run: npx prisma migrate deploy');
    console.error('   - Run: npx prisma generate');
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 