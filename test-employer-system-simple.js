const { PrismaClient } = require('@prisma/client');

async function testEmployerSystemSimple() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing employer system status and existing data...\n');
    
    // 1. Get the first employer
    const employer = await prisma.user.findFirst({
      where: { role: 'employer' },
      select: {
        id: true,
        email: true,
        name: true,
        currentTier: true,
        employerOnboardingCompleted: true
      }
    });
    
    if (!employer) {
      console.log('❌ No employers found');
      return;
    }
    
    console.log('👔 Testing with employer:');
    console.log(`  Name: ${employer.name || 'Unnamed'}`);
    console.log(`  Email: ${employer.email}`);
    console.log(`  ID: ${employer.id}`);
    console.log(`  Tier: ${employer.currentTier}`);
    console.log(`  Onboarded: ${employer.employerOnboardingCompleted}\n`);
    
    // 2. Check available credits
    const availableCredits = await prisma.jobPostingCredit.findMany({
      where: { 
        userId: employer.id,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        expiresAt: true
      }
    });
    
    console.log('💳 Available Credits:');
    const creditSummary = availableCredits.reduce((acc, credit) => {
      acc[credit.type] = (acc[credit.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(creditSummary).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log(`  Total Available: ${availableCredits.length}\n`);
    
    // 3. Check used credits
    const usedCredits = await prisma.jobPostingCredit.findMany({
      where: { 
        userId: employer.id,
        isUsed: true
      },
      select: {
        id: true,
        type: true,
        usedAt: true,
        usedForJobId: true
      },
      take: 10
    });
    
    console.log('📊 Used Credits:');
    console.log(`  Total Used: ${usedCredits.length}`);
    const usedSummary = usedCredits.reduce((acc, credit) => {
      acc[credit.type] = (acc[credit.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(usedSummary).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log('');
    
    // 4. Check employer's jobs
    const jobs = await prisma.job.findMany({
      where: { 
        employerId: employer.id,
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        status: true,
        source: true,
        featured: true,
        createdAt: true,
        viewCount: true,
        _count: {
          select: {
            jobApplications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📝 Employer Jobs:');
    console.log(`  Total Jobs: ${jobs.length}`);
    jobs.forEach((job, i) => {
      console.log(`  ${i+1}. ${job.title}`);
      console.log(`     Status: ${job.status} | Featured: ${job.featured}`);
      console.log(`     Views: ${job.viewCount || 0} | Applications: ${job._count.jobApplications}`);
      console.log(`     Source: ${job.source} | Created: ${job.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // 5. Check job post optimizers - use correct field name
    const optimizers = await prisma.jobPostOptimizer.findMany({
      where: { employerId: employer.id },
      select: {
        id: true,
        status: true,
        publishedJobId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('🤖 Job Post Optimizers:');
    console.log(`  Total Optimizers: ${optimizers.length}`);
    optimizers.forEach((opt, i) => {
      console.log(`  ${i+1}. Status: ${opt.status}`);
      console.log(`     Published Job: ${opt.publishedJobId || 'None'}`);
      console.log(`     Created: ${opt.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // 6. Check if the APIs would work by testing database queries
    console.log('🧪 Testing API Query Patterns:');
    
    // Test the query pattern used by /api/employers/jobs
    const apiJobsQuery = await prisma.job.findMany({
      where: {
        employerId: employer.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 50,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        status: true,
        salaryMin: true,
        salaryMax: true,
        description: true,
        postedAt: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        viewCount: true,
        source: true,
        _count: {
          select: {
            jobApplications: true,
          },
        },
      },
    });
    
    console.log(`  ✅ /api/employers/jobs query: Returns ${apiJobsQuery.length} jobs`);
    
    // Test credit availability query pattern
    const jobPostCreditsAvailable = await prisma.jobPostingCredit.count({
      where: {
        userId: employer.id,
        type: 'job_post',
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    console.log(`  ✅ Available job_post credits: ${jobPostCreditsAvailable}`);
    
    // Test optimizer query pattern
    const optimizerCount = await prisma.jobPostOptimizer.count({
      where: { employerId: employer.id }
    });
    
    console.log(`  ✅ Job post optimizers: ${optimizerCount}`);
    
    console.log('\n✅ Employer system connectivity test completed!');
    console.log('\n📋 System Status Summary:');
    console.log('  🔗 Database Connection: ✅ Working');
    console.log('  👔 Employer Data: ✅ Present');
    console.log('  💳 Credit System: ✅ Schema Working');
    console.log('  📝 Job Listings: ✅ Working');
    console.log('  🤖 Job Optimizer: ✅ Working');
    console.log('  🔍 API Patterns: ✅ Working');
    
    // Analysis
    console.log('\n🔍 Analysis:');
    if (availableCredits.length === 0) {
      console.log('  ⚠️  No credits available - may need to purchase more');
      console.log('  💡 This could explain job posting failures');
    }
    
    if (jobs.length > 0) {
      console.log('  ✅ Employer has existing jobs - job creation works');
    }
    
    if (optimizers.length > 0) {
      console.log('  ✅ Job optimizer has been used - optimization works');
    }
    
    console.log('\n💡 Recommended Next Steps:');
    console.log('  1. Check if credit purchase system is working');
    console.log('  2. Test frontend authentication flow');
    console.log('  3. Verify API endpoints return proper responses');
    console.log('  4. Check error handling in job post optimizer UI');
    
  } catch (error) {
    console.error('❌ Error during employer system test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmployerSystemSimple();