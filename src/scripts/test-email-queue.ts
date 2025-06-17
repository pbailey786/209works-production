#!/usr/bin/env ts-node

import { emailQueue } from '@/lib/services/email-queue';

async function testEmailQueue() {
  console.log('🧪 Testing Email Queue System...\n');

  try {
    // Initialize the email queue
    console.log('1. Initializing email queue...');
    await emailQueue.initialize();
    console.log('✅ Email queue initialized successfully\n');

    // Get initial queue stats
    console.log('2. Getting initial queue statistics...');
    const initialStats = await emailQueue.getQueueStats();
    console.log('📊 Initial Queue Stats:', initialStats);
    console.log('');

    // Test adding a simple email job
    console.log('3. Adding a test email job...');
    const testJob = await emailQueue.addEmailJob({
      type: 'generic',
      to: 'test@example.com',
      subject: 'Test Email Queue',
      template: 'job-alert', // Using existing template for testing
      data: {
        userName: 'Test User',
        jobTitle: 'Software Engineer',
        companyName: 'Test Company',
        location: 'Remote',
        salary: '$80,000 - $120,000',
        jobType: 'Full-time',
        description: 'This is a test job description for email queue testing.',
        jobUrl: 'https://example.com/jobs/test',
        unsubscribeUrl: 'https://example.com/unsubscribe',
        additionalJobsCount: 0,
        totalMatchingJobs: 1,
      },
      priority: 'normal',
      metadata: {
        testRun: true,
        timestamp: new Date().toISOString(),
      },
    });
    console.log('✅ Test job added with ID:', testJob.id);
    console.log('');

    // Test bulk job addition
    console.log('4. Adding bulk test jobs...');
    const bulkJobs = await emailQueue.addBulkEmailJobs([
      {
        data: {
          type: 'generic',
          to: 'bulk1@example.com',
          subject: 'Bulk Test Email 1',
          template: 'job-alert',
          data: {
            userName: 'Bulk User 1',
            jobTitle: 'Frontend Developer',
            companyName: 'Bulk Company 1',
            location: 'San Francisco, CA',
            salary: '$90,000 - $130,000',
            jobType: 'Full-time',
            description: 'Bulk test job 1',
            jobUrl: 'https://example.com/jobs/bulk1',
            unsubscribeUrl: 'https://example.com/unsubscribe',
            additionalJobsCount: 0,
            totalMatchingJobs: 1,
          },
          priority: 'low',
        },
      },
      {
        data: {
          type: 'generic',
          to: 'bulk2@example.com',
          subject: 'Bulk Test Email 2',
          template: 'job-alert',
          data: {
            userName: 'Bulk User 2',
            jobTitle: 'Backend Developer',
            companyName: 'Bulk Company 2',
            location: 'New York, NY',
            salary: '$95,000 - $135,000',
            jobType: 'Full-time',
            description: 'Bulk test job 2',
            jobUrl: 'https://example.com/jobs/bulk2',
            unsubscribeUrl: 'https://example.com/unsubscribe',
            additionalJobsCount: 0,
            totalMatchingJobs: 1,
          },
          priority: 'high',
        },
      },
    ]);
    console.log(`✅ Added ${bulkJobs.length} bulk jobs`);
    console.log('');

    // Get updated queue stats
    console.log('5. Getting updated queue statistics...');
    const updatedStats = await emailQueue.getQueueStats();
    console.log('📊 Updated Queue Stats:', updatedStats);
    console.log('');

    // Test helper methods
    console.log('6. Testing helper methods...');

    // Test job alert email helper
    const jobAlertJob = await emailQueue.addJobAlertEmail(
      'jobalert@example.com',
      'Job Alert User',
      [
        {
          id: 'test-job-1',
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'Remote',
          salaryMin: 100000,
          salaryMax: 150000,
          type: 'Full-time',
          snippet: 'Join our team as a Senior Software Engineer...',
        },
      ],
      'test-alert-id',
      'test-user-id',
      'high'
    );
    console.log('✅ Job alert email added with ID:', jobAlertJob.id);

    // Test weekly digest email helper
    const weeklyDigestJob = await emailQueue.addWeeklyDigestEmail(
      'digest@example.com',
      'Digest User',
      [
        {
          id: 'digest-job-1',
          title: 'Product Manager',
          company: 'Product Co',
          location: 'San Francisco, CA',
          salary: '$120,000 - $160,000',
          jobType: 'Full-time',
          postedDate: '2 days ago',
          url: 'https://example.com/jobs/digest-job-1',
        },
        {
          id: 'digest-job-2',
          title: 'UX Designer',
          company: 'Design Studio',
          location: 'Remote',
          salary: '$80,000 - $110,000',
          jobType: 'Contract',
          postedDate: '1 day ago',
          url: 'https://example.com/jobs/digest-job-2',
        },
      ],
      '209 Area',
      'test-user-id',
      'normal'
    );
    console.log('✅ Weekly digest email added with ID:', weeklyDigestJob.id);
    console.log('');

    // Final queue stats
    console.log('7. Getting final queue statistics...');
    const finalStats = await emailQueue.getQueueStats();
    console.log('📊 Final Queue Stats:', finalStats);
    console.log('');

    // Test queue management
    console.log('8. Testing queue management...');

    console.log('   - Pausing queue...');
    await emailQueue.pauseQueue();

    console.log('   - Resuming queue...');
    await emailQueue.resumeQueue();

    console.log('✅ Queue management operations completed');
    console.log('');

    console.log('🎉 Email Queue System Test Completed Successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log(
      `   - Initial jobs: ${initialStats.waiting + initialStats.active}`
    );
    console.log(`   - Final jobs: ${finalStats.waiting + finalStats.active}`);
    console.log(
      `   - Jobs added: ${finalStats.waiting + finalStats.active - (initialStats.waiting + initialStats.active)}`
    );
    console.log('');
    console.log('⚠️  Note: This test adds jobs to the actual queue.');
    console.log(
      '   In a production environment, these would be processed and emails would be sent.'
    );
    console.log(
      '   Make sure to clear the queue if needed using: npm run queue:clear'
    );
  } catch (error) {
    console.error('❌ Email Queue Test Failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    try {
      await emailQueue.close();
      console.log('🧹 Email queue closed gracefully');
    } catch (error) {
      console.error('⚠️  Error closing email queue:', error);
    }
  }
}

// Run the test
if (require.main === module) {
  testEmailQueue().catch(console.error);
}

export { testEmailQueue };
