/**
 * Test script to verify O*NET integration is working properly
 * Run with: node test-onet-integration.js
 */

import { onetService, enhanceJobSearchWithONetData } from './src/lib/services/onet.js';

async function testONetIntegration() {
  console.log('🧪 Testing O*NET Integration...\n');

  try {
    // Test 1: Search for warehouse jobs (very common in Central Valley)
    console.log('1️⃣ Testing warehouse job search...');
    const warehouseJobs = await onetService.searchOccupations('warehouse worker');
    console.log(`Found ${warehouseJobs.length} warehouse occupations`);
    if (warehouseJobs.length > 0) {
      console.log(`   Example: ${warehouseJobs[0].title} (${warehouseJobs[0].code})`);
    }

    // Test 2: Get occupation details for warehouse worker
    console.log('\n2️⃣ Testing occupation details...');
    const warehouseDetails = await onetService.getOccupationDetails('53-7051.00');
    if (warehouseDetails) {
      console.log(`   Title: ${warehouseDetails.title}`);
      console.log(`   Description: ${warehouseDetails.description?.substring(0, 100)}...`);
    }

    // Test 3: Test walnut harvester (the problematic search)
    console.log('\n3️⃣ Testing walnut harvester guidance...');
    const guidance = await onetService.getCareerGuidanceForJobTitle('walnut harvester');
    console.log(`   Suggestions: ${guidance.suggestions.join(', ')}`);
    console.log(`   Related fields: ${guidance.relatedFields.slice(0, 3).join(', ')}`);

    // Test 4: Test the enhancement function used in chat
    console.log('\n4️⃣ Testing job search enhancement...');
    const enhancement = await enhanceJobSearchWithONetData('agricultural worker', []);
    console.log(`   Market insight: ${enhancement.marketInsight || 'None'}`);
    console.log(`   Career guidance: ${enhancement.careerGuidance || 'None'}`);

    // Test 5: Get wage data for California
    console.log('\n5️⃣ Testing wage data...');
    const wageData = await onetService.getWageData('53-7051.00', 'CA');
    if (wageData) {
      console.log('   Wage data retrieved successfully');
    }

    console.log('\n✅ O*NET integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Add your O*NET credentials to .env.local');
    console.log('   2. Test the chat interface with "walnut harvester jobs"');
    console.log('   3. Verify it gives honest "no results" + career guidance');

  } catch (error) {
    console.error('\n❌ O*NET integration test failed:');
    console.error(error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 This might be because:');
      console.log('   - O*NET credentials not set in environment variables');
      console.log('   - Network connectivity issues');
      console.log('   - O*NET API service is down');
    }
  }
}

// Run the test
testONetIntegration();