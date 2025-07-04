// Test the API by calling the exact function
const fetch = require('node-fetch');

async function testAPIDirect() {
  try {
    console.log('Testing chat API with simple warehouse query...');
    
    const response = await fetch('http://localhost:3000/api/chat-job-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: 'warehouse',
        conversationHistory: [],
        sessionId: 'test-direct'
      })
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const data = await response.json();
    
    console.log('API Response:');
    console.log('- Status: Success');
    console.log('- Total Results:', data.metadata.totalResults);
    console.log('- Jobs Returned:', data.jobs.length);
    console.log('- Filters Applied:', JSON.stringify(data.filters, null, 2));
    
    if (data.jobs.length > 0) {
      console.log('- First Job:', data.jobs[0].title, 'at', data.jobs[0].company);
    }
    
    // Check if the response indicates any specific issues
    if (data.metadata.totalResults === 0) {
      console.log('\n🔍 Debugging zero results:');
      console.log('- AI Response:', data.response);
      console.log('- Has Valid API Key:', data.metadata.hasValidApiKey);
      console.log('- Sort By:', data.metadata.sortBy);
    }
    
  } catch (error) {
    console.error('Test Error:', error);
  }
}

testAPIDirect();