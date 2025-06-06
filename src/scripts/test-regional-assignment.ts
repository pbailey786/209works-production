/**
 * Test Regional Assignment Script
 * Tests the regional job assignment functionality
 */

import { RegionalJobService } from '@/lib/services/regional-job-service';

async function testRegionalAssignment() {
  console.log('🧪 Testing Regional Job Assignment Functionality\n');

  // Test 1: Test location-to-region assignment logic
  console.log('📍 Test 1: Location-to-Region Assignment Logic');
  const testLocations = [
    'Stockton, CA',
    'Sacramento, CA',
    'Oakland, CA',
    'Berkeley, CA',
    'Modesto, CA',
    'Elk Grove, CA',
    'Fremont, CA',
    'San Francisco, CA',
    'Los Angeles, CA', // Should not match any region
    'Remote - Northern California',
    'Central Valley Area',
    'East Bay Region',
  ];

  testLocations.forEach(location => {
    const region = RegionalJobService.assignRegionToJob(location);
    console.log(`  ${location} → ${region || 'No region assigned'}`);
  });

  console.log('\n📊 Test 2: Get Region Summary');
  try {
    const summary = await RegionalJobService.getRegionSummary();
    console.log('  Region Summary:', summary);
  } catch (error) {
    console.log('  Error getting region summary:', error);
  }

  console.log('\n🔍 Test 3: Search Regional Jobs');
  try {
    const searchResult = await RegionalJobService.getRegionalJobs({
      region: '209',
      limit: 5,
    });
    console.log(
      `  Found ${searchResult.totalCount} jobs in Central Valley (209)`
    );
    console.log(
      `  Sample jobs:`,
      searchResult.jobs.slice(0, 2).map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        region: job.region,
      }))
    );
  } catch (error) {
    console.log('  Error searching regional jobs:', error);
  }

  console.log('\n📈 Test 4: Get Regional Statistics');
  try {
    const stats = await RegionalJobService.getRegionalStats('209');
    console.log('  Central Valley Stats:', {
      totalJobs: stats.totalJobs,
      newJobsThisWeek: stats.newJobsThisWeek,
      topCategories: stats.topCategories.slice(0, 3),
      averageSalary: stats.averageSalary,
    });
  } catch (error) {
    console.log('  Error getting regional stats:', error);
  }

  console.log('\n🌐 Test 5: Cross-Region Search');
  try {
    const crossRegionResult = await RegionalJobService.searchAcrossRegions(
      'software engineer',
      ['209', '916', '510'],
      10
    );
    console.log('  Cross-region search results:');
    console.log(`  Total jobs found: ${crossRegionResult.totalAcrossRegions}`);
    console.log('  Regional breakdown:', crossRegionResult.regionBreakdown);
  } catch (error) {
    console.log('  Error in cross-region search:', error);
  }

  console.log('\n✅ Regional Assignment Tests Complete!');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRegionalAssignment().catch(console.error);
}

export { testRegionalAssignment };
