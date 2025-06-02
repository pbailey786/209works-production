#!/usr/bin/env node

/**
 * Test script to verify OpenAI setup for 209Jobs
 * Run with: node test-openai-setup.js
 */

const https = require('https');

// Test the LLM job search endpoint
async function testJobSearch() {
  console.log('🧪 Testing 209Jobs AI Search Functionality...\n');

  const testQueries = [
    'Find nursing jobs in Stockton',
    'Show me warehouse jobs near Tracy',
    'What customer service jobs are available?',
    'Remote tech jobs in the 209 area'
  ];

  for (const query of testQueries) {
    console.log(`🔍 Testing: "${query}"`);
    
    try {
      const result = await makeRequest(query);
      
      if (result.success) {
        console.log(`✅ Success! Found ${result.data?.jobs?.length || 0} jobs`);
        if (result.data?.summary) {
          console.log(`📝 AI Response: ${result.data.summary.substring(0, 100)}...`);
        }
        if (result.data?.followUpQuestions?.length > 0) {
          console.log(`💡 Follow-up: ${result.data.followUpQuestions[0]}`);
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

// Make HTTP request to the API
function makeRequest(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      userMessage: query,
      conversationHistory: [],
      userProfile: null,
      sessionId: 'test-session'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/llm-job-search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, data: result });
          } else {
            resolve({ success: false, error: result.error || 'Unknown error' });
          }
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Check OpenAI API key status
function checkApiKeyStatus() {
  console.log('🔑 Checking OpenAI API Key Status...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No OPENAI_API_KEY found in environment');
    console.log('📝 Add your API key to .env.local file');
    return false;
  }
  
  if (apiKey === 'your-openai-key' || apiKey === 'sk-proj-placeholder-key-replace-with-your-actual-openai-api-key') {
    console.log('⚠️  Placeholder API key detected');
    console.log('📝 Replace with your actual OpenAI API key');
    return false;
  }
  
  if (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) {
    console.log('✅ Valid API key format detected');
    console.log('🤖 AI-powered search should be available');
    return true;
  }
  
  console.log('❌ Invalid API key format');
  console.log('📝 API key should start with "sk-" or "sk-proj-"');
  return false;
}

// Main execution
async function main() {
  console.log('🚀 209Jobs OpenAI Setup Test\n');
  console.log('=' * 50);
  
  const hasValidKey = checkApiKeyStatus();
  console.log('');
  
  if (!hasValidKey) {
    console.log('🔄 Running in fallback mode (basic keyword search)');
    console.log('📖 See OPENAI_SETUP.md for instructions to enable AI features');
  } else {
    console.log('🤖 Running with AI-powered search');
  }
  
  console.log('');
  
  // Test the job search functionality
  await testJobSearch();
  
  console.log('🎉 Test completed!');
  console.log('');
  console.log('Next steps:');
  if (!hasValidKey) {
    console.log('1. Get your OpenAI API key from https://platform.openai.com');
    console.log('2. Add it to your .env.local file');
    console.log('3. Restart your development server');
    console.log('4. Run this test again');
  } else {
    console.log('1. Your AI search is ready!');
    console.log('2. Visit http://localhost:3001/jobs to test');
    console.log('3. Try natural language searches');
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testJobSearch, checkApiKeyStatus };
