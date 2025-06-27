#!/usr/bin/env ts-node

// Job Learning Cron Script
// Analyzes job posts and updates learned templates
// Run this daily via cron: 0 2 * * * (2 AM daily)

import { runJobLearningPipeline } from '@/lib/ai/job-learning-system';
import { prisma } from '@/lib/database/prisma';

async function main() {
  console.log(`[${new Date().toISOString()}] Starting job learning cron job...`);
  
  try {
    // Log current status
    const beforeStats = await getSystemStats();
    console.log('Before learning pipeline:', beforeStats);
    
    // Run the learning pipeline
    await runJobLearningPipeline();
    
    // Log results
    const afterStats = await getSystemStats();
    console.log('After learning pipeline:', afterStats);
    
    // Calculate improvements
    const newAnalyses = afterStats.totalAnalyses - beforeStats.totalAnalyses;
    const newTemplates = afterStats.learnedTemplates - beforeStats.learnedTemplates;
    
    console.log(`✅ Learning pipeline completed successfully!`);
    console.log(`📊 New job analyses: ${newAnalyses}`);
    console.log(`📝 New/updated templates: ${newTemplates}`);
    
    // Clean up old analyses (keep last 180 days)
    const cleanupDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const deletedCount = await prisma.jobPostAnalysis.deleteMany({
      where: {
        createdAt: {
          lt: cleanupDate
        }
      }
    });
    
    if (deletedCount.count > 0) {
      console.log(`🧹 Cleaned up ${deletedCount.count} old analyses`);
    }
    
  } catch (error) {
    console.error('❌ Job learning cron job failed:', error);
    
    // Could send alert email/Slack notification here
    // await sendAlert('Job learning pipeline failed', error.message);
    
    process.exit(1);
  }
  
  console.log(`[${new Date().toISOString()}] Job learning cron job completed`);
  process.exit(0);
}

async function getSystemStats() {
  const [
    totalAnalyses,
    learnedTemplates,
    recentSuccessfulJobs
  ] = await Promise.all([
    prisma.jobPostAnalysis.count(),
    prisma.learnedJobTemplate.count(),
    prisma.job.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        status: 'active'
      }
    })
  ]);
  
  return {
    totalAnalyses,
    learnedTemplates,
    recentSuccessfulJobs
  };
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

export { main as runJobLearningCron };