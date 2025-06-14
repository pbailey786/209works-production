#!/usr/bin/env node

/**
 * Test which version of the JobPostingCreditsService is being used
 */

const { JobPostingCreditsService } = require('../src/lib/services/job-posting-credits');

async function testServiceVersion() {
  console.log('🔍 Testing JobPostingCreditsService version...');
  
  try {
    // Test with a fake user ID to see what the service returns
    const testUserId = 'test-user-id';
    
    console.log('📋 Service methods available:');
    console.log('- getUserCredits:', typeof JobPostingCreditsService.getUserCredits);
    console.log('- hasCredits:', typeof JobPostingCreditsService.hasCredits);
    console.log('- useCredits:', typeof JobPostingCreditsService.useCredits);
    
    // Check if the service has the old debug logging by looking at the source
    const serviceSource = JobPostingCreditsService.getUserCredits.toString();
    
    console.log('\n🔍 Checking service source for debug logging...');
    const hasOldDebugLogging = serviceSource.includes('Found credits:') || 
                               serviceSource.includes('Credit breakdown:') ||
                               serviceSource.includes('console.log');
    
    console.log('Has old debug logging:', hasOldDebugLogging);
    
    if (hasOldDebugLogging) {
      console.log('❌ Service still has old debug logging');
      console.log('Service source preview:', serviceSource.substring(0, 500) + '...');
    } else {
      console.log('✅ Service appears to be updated (no debug logging found)');
    }
    
    console.log('\n📊 Service getUserCredits method source:');
    console.log(serviceSource);
    
  } catch (error) {
    console.error('❌ Error testing service:', error);
  }
}

testServiceVersion();
