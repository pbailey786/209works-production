// Test JobsGPT functionality
const fetch = require('node-fetch');

async function testJobsGPT() {
  const baseUrl = 'http://localhost:3000';

  console.log('🤖 Testing JobsGPT functionality...\n');

  // Test cases
  const testCases = [
    {
      name: 'General job search in 209 area',
      message: 'Find me jobs in the 209 area',
      expectedJobs: true,
    },
    {
      name: 'Warehouse jobs search',
      message: 'Show me warehouse jobs',
      expectedJobs: true,
    },
    {
      name: 'Stockton specific search',
      message: 'What jobs are available in Stockton?',
      expectedJobs: true,
    },
    {
      name: 'Healthcare jobs search',
      message: 'Find healthcare jobs in Modesto',
      expectedJobs: true,
    },
    {
      name: 'Software developer search',
      message: 'Are there any software developer positions?',
      expectedJobs: true,
    },
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`💬 Message: "${testCase.message}"`);

    try {
      const response = await fetch(`${baseUrl}/api/chat-job-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: testCase.message,
          conversationHistory: [],
          sessionId: `test_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();

      console.log(`✅ Response received`);
      console.log(`📊 Jobs found: ${data.jobs?.length || 0}`);
      console.log(`🤖 AI Response: ${data.response?.substring(0, 100)}...`);

      if (data.jobs && data.jobs.length > 0) {
        console.log(`📋 Sample jobs:`);
        data.jobs.slice(0, 2).forEach((job, index) => {
          console.log(
            `   ${index + 1}. ${job.title} at ${job.company} (${job.location})`
          );
        });
      }

      if (testCase.expectedJobs && (!data.jobs || data.jobs.length === 0)) {
        console.log(`⚠️  Expected jobs but found none`);
      } else if (!testCase.expectedJobs && data.jobs && data.jobs.length > 0) {
        console.log(`⚠️  Found jobs but didn't expect any`);
      } else {
        console.log(`✅ Test passed!`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log(''); // Empty line for readability
  }

  console.log('🎉 JobsGPT testing completed!');
}

// Run the test
testJobsGPT().catch(console.error);
