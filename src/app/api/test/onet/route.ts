import { NextRequest, NextResponse } from 'next/server';
import { getONetClient } from '@/lib/onet/client';
import { jobEnhancer } from '@/lib/onet/job-enhancer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobTitle = searchParams.get('title') || 'warehouse worker';
    const location = searchParams.get('location') || 'Stockton, CA';
    
    console.log('Testing O*NET API with:', { jobTitle, location });
    
    const onetClient = getONetClient();
    
    // Test 1: Search for occupations
    console.log('\n1. Searching for occupations...');
    const searchResults = await onetClient.searchOccupations(jobTitle);
    console.log('Search results:', searchResults);
    
    if (searchResults.length === 0) {
      return NextResponse.json({
        error: 'No occupations found',
        jobTitle
      });
    }
    
    const bestMatch = searchResults[0];
    console.log('\n2. Best match:', bestMatch);
    
    // Test 2: Get occupation details
    const details = await onetClient.getOccupationDetails(bestMatch.code);
    console.log('\n3. Occupation details:', details);
    
    // Test 3: Get tasks
    const tasks = await onetClient.getOccupationTasks(bestMatch.code, 5);
    console.log('\n4. Tasks:', tasks);
    
    // Test 4: Get skills
    const skills = await onetClient.getOccupationSkills(bestMatch.code, 5);
    console.log('\n5. Skills:', skills);
    
    // Test 5: Get wage data
    const wages = await onetClient.getWageData(bestMatch.code, '06');
    console.log('\n6. Wage data:', wages);
    
    // Test 6: Use job enhancer
    console.log('\n7. Testing job enhancer...');
    const enhancedJob = await jobEnhancer.enhanceJobPosting({
      title: jobTitle,
      location,
      description: `We're hiring a ${jobTitle} for our ${location} facility.`
    });
    console.log('Enhanced job:', enhancedJob);
    
    return NextResponse.json({
      success: true,
      searchResults,
      bestMatch,
      details,
      tasks,
      skills,
      wages,
      enhancedJob
    });
    
  } catch (error: any) {
    console.error('O*NET test error:', error);
    return NextResponse.json({
      error: error.message || 'O*NET integration error',
      details: error.stack
    }, { status: 500 });
  }
}