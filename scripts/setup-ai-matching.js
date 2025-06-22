#!/usr/bin/env node

/**
 * Setup script for AI Job Matching System
 * Run with: node scripts/setup-ai-matching.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAIMatching() {
  console.log('🤖 Setting up AI Job Matching System...');

  try {
    // 1. Check if default matching config exists
    const existingConfig = await prisma.matchingConfig.findUnique({
      where: { name: 'default_featured_matching' },
    });

    if (!existingConfig) {
      console.log('📝 Creating default matching configuration...');
      await prisma.matchingConfig.create({
        data: {
          name: 'default_featured_matching',
          minMatchScore: 80.0,
          maxEmailsPerDay: 100,
          maxEmailsPerHour: 20,
          batchSize: 50,
          emailTemplate: 'featured_job_match',
          isActive: true,
        },
      });
      console.log('✅ Default matching configuration created');
    } else {
      console.log('ℹ️ Default matching configuration already exists');
    }

    // 2. Check system statistics
    const stats = {
      users: await prisma.user.count(),
      jobSeekers: await prisma.user.count({ where: { role: 'jobseeker' } }),
      optedInJobSeekers: await prisma.jobSeekerProfile.count({
        where: { optInEmailAlerts: true },
      }),
      featuredJobs: await prisma.job.count({ where: { featured: true } }),
      resumeEmbeddings: await prisma.resumeEmbedding.count(),
      jobMatches: await prisma.jobMatch.count(),
      queueJobs: await prisma.jobProcessingQueue.count(),
    };

    console.log('\n📊 Current System Statistics:');
    console.log(`  Total Users: ${stats.users}`);
    console.log(`  Job Seekers: ${stats.jobSeekers}`);
    console.log(`  Opted-in Job Seekers: ${stats.optedInJobSeekers}`);
    console.log(`  Featured Jobs: ${stats.featuredJobs}`);
    console.log(`  Resume Embeddings: ${stats.resumeEmbeddings}`);
    console.log(`  Job Matches: ${stats.jobMatches}`);
    console.log(`  Queue Jobs: ${stats.queueJobs}`);

    // 3. Check environment variables
    console.log('\n🔧 Environment Check:');
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'RESEND_API_KEY',
      'FROM_EMAIL',
      'CRON_SECRET',
      'NEXT_PUBLIC_BASE_URL',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      console.log('❌ Missing environment variables:');
      missingEnvVars.forEach(envVar => {
        console.log(`  - ${envVar}`);
      });
      console.log('\n💡 Add these to your .env file for full functionality');
    } else {
      console.log('✅ All required environment variables are set');
    }

    // 4. Recommendations
    console.log('\n💡 Recommendations:');

    if (stats.optedInJobSeekers === 0) {
      console.log('  • No job seekers have opted in for email alerts yet');
      console.log(
        '  • Users need to enable email alerts in their profile to receive AI matches'
      );
    }

    if (stats.resumeEmbeddings === 0) {
      console.log('  • No resume embeddings processed yet');
      console.log(
        '  • Users need to upload resumes and process embeddings for AI matching'
      );
    }

    if (stats.featuredJobs === 0) {
      console.log('  • No featured jobs found');
      console.log('  • Employers need to feature jobs to trigger AI matching');
    }

    console.log('\n🚀 Next Steps:');
    console.log('  1. Test the system: npm run test:ai-matching');
    console.log('  2. Process resume embeddings for existing users');
    console.log('  3. Feature a job to trigger AI matching');
    console.log('  4. Monitor the queue processing logs');
    console.log('  5. Check employer analytics dashboard');

    console.log('\n✅ AI Job Matching System setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAIMatching();
}

module.exports = { setupAIMatching };
