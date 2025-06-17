const { PrismaClient } = require('@prisma/client');

async function testJobPostingFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing complete job posting flow...\n');
    
    // Get the employer
    const employer = await prisma.user.findFirst({
      where: { role: 'employer' },
      select: { id: true, email: true, name: true }
    });
    
    // Check available credits
    const availableCredits = await prisma.jobPostingCredit.count({
      where: {
        userId: employer.id,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    console.log(`👔 Employer: ${employer.name || 'Unnamed'} (${employer.email})`);
    console.log(`💳 Available Credits: ${availableCredits}`);
    
    if (availableCredits === 0) {
      console.log('❌ No credits available - cannot test job posting');
      return;
    }
    
    console.log('\n🔄 Step 1: Creating job post optimizer entry...');
    
    // Create a job post optimizer entry (simulating the optimization step)
    const optimizer = await prisma.jobPostOptimizer.create({
      data: {
        employerId: employer.id,
        jobTitle: 'Software Engineer - Test Position',
        companyName: employer.name || 'Test Company',
        location: 'Stockton, CA',
        pay: '$80,000 - $100,000',
        schedule: 'Full-time',
        companyDescription: 'A test company for verifying the job posting system.',
        idealFit: 'Experienced developer with TypeScript and React skills.',
        culture: 'Remote-friendly, collaborative team environment.',
        growthPath: 'Clear advancement opportunities and professional development.',
        perks: 'Health insurance, retirement plan, flexible PTO.',
        applicationCTA: 'Apply now to join our innovative team!',
        status: 'optimized',
        isPublished: false
      }
    });
    
    console.log(`✅ Created optimizer: ${optimizer.id}`);
    
    console.log('\n🔄 Step 2: Simulating publish API call...');
    
    // Get one available credit
    const credit = await prisma.jobPostingCredit.findFirst({
      where: {
        userId: employer.id,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    if (!credit) {
      console.log('❌ No credits found');
      return;
    }
    
    // Use the credit
    await prisma.jobPostingCredit.update({
      where: { id: credit.id },
      data: {
        isUsed: true,
        usedAt: new Date()
      }
    });
    
    console.log(`✅ Used credit: ${credit.id}`);
    
    console.log('\n🔄 Step 3: Creating job posting...');
    
    // Create the actual job
    const job = await prisma.job.create({
      data: {
        title: optimizer.jobTitle,
        description: [
          `**About the Position**`,
          optimizer.idealFit || '',
          '',
          `**Company Culture**`,
          optimizer.culture || '',
          '',
          `**Growth Opportunities**`,
          optimizer.growthPath || '',
          '',
          `**Benefits & Perks**`,
          optimizer.perks || '',
          '',
          optimizer.applicationCTA || 'Apply now!'
        ].join('\n'),
        company: optimizer.companyName,
        location: optimizer.location,
        url: 'https://209.works/apply', // Required field
        jobType: 'full_time',
        status: 'active',
        source: 'job_post_optimizer',
        employerId: employer.id,
        postedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        // Parse salary from the pay field
        salaryMin: 80000,
        salaryMax: 100000
      }
    });
    
    console.log(`✅ Created job: ${job.id}`);
    
    console.log('\n🔄 Step 4: Updating optimizer with published job...');
    
    // Update optimizer
    await prisma.jobPostOptimizer.update({
      where: { id: optimizer.id },
      data: {
        status: 'published',
        isPublished: true,
        publishedJobId: job.id
      }
    });
    
    // Update credit with job reference
    await prisma.jobPostingCredit.update({
      where: { id: credit.id },
      data: {
        usedForJobId: job.id
      }
    });
    
    console.log(`✅ Updated optimizer and credit`);
    
    console.log('\n🎉 Job posting flow completed successfully!');
    console.log(`📝 Job ID: ${job.id}`);
    console.log(`🔗 Job URL: http://localhost:3000/jobs/${job.id}`);
    console.log(`🎯 Employer view: http://localhost:3000/employers/my-jobs?published=${job.id}`);
    console.log(`🤖 Optimizer view: http://localhost:3000/employers/job-post-optimizer`);
    
    // Check remaining credits
    const remainingCredits = await prisma.jobPostingCredit.count({
      where: {
        userId: employer.id,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    console.log(`\n💳 Remaining Credits: ${remainingCredits}`);
    
  } catch (error) {
    console.error('❌ Error during job posting flow test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testJobPostingFlow();