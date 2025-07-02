import { NextRequest, NextResponse } from 'next/server';
import { getONetClient } from '@/lib/onet/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobTitle = searchParams.get('title') || 'cashier';
    
    console.log('=== O*NET DEBUG TEST ===');
    console.log('Testing job title:', jobTitle);
    
    const onetClient = getONetClient();
    
    // Step 1: Test search
    console.log('\n1. Testing search...');
    const searchResults = await onetClient.searchOccupations(jobTitle);
    console.log('Search results:', searchResults);
    
    if (searchResults.length === 0) {
      return NextResponse.json({ error: 'No search results' });
    }
    
    const bestMatch = searchResults[0];
    console.log('Best match:', bestMatch);
    
    // Step 2: Test individual API calls
    console.log('\n2. Testing individual API calls...');
    
    try {
      console.log('Testing getOccupationDetails...');
      const details = await onetClient.getOccupationDetails(bestMatch.code);
      console.log('Details result:', details);
    } catch (e: any) {
      console.log('Details error:', e.message);
    }
    
    try {
      console.log('Testing getOccupationTasks...');
      const tasks = await onetClient.getOccupationTasks(bestMatch.code, 3);
      console.log('Tasks result:', tasks);
    } catch (e: any) {
      console.log('Tasks error:', e.message);
    }
    
    try {
      console.log('Testing getOccupationSkills...');
      const skills = await onetClient.getOccupationSkills(bestMatch.code, 3);
      console.log('Skills result:', skills);
    } catch (e: any) {
      console.log('Skills error:', e.message);
    }
    
    try {
      console.log('Testing getWageData...');
      const wages = await onetClient.getWageData(bestMatch.code, '06');
      console.log('Wages result:', wages);
    } catch (e: any) {
      console.log('Wages error:', e.message);
    }
    
    // Step 3: Test the full enhancement
    console.log('\n3. Testing full job enhancement...');
    try {
      const fullData = await onetClient.getJobEnhancementData(jobTitle, 'Stockton, CA');
      console.log('Full enhancement result:', fullData);
      
      return NextResponse.json({
        success: true,
        searchResults,
        bestMatch,
        fullEnhancement: fullData,
        message: 'Check server logs for detailed debugging'
      });
    } catch (e: any) {
      console.log('Full enhancement error:', e.message);
      return NextResponse.json({
        error: 'Full enhancement failed',
        details: e.message,
        searchResults,
        bestMatch
      });
    }
    
  } catch (error: any) {
    console.error('Debug test error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}