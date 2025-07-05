import { NextResponse } from 'next/server';
import { getONetClient } from '@/lib/onet/client';

export async function GET() {
  try {
    console.log('🔧 Testing O*NET integration...');
    
    const client = getONetClient();
    
    // Test search for HVAC
    const results = await client.searchOccupations('HVAC technician');
    console.log('✅ O*NET Search Results:', results.length, 'occupations found');
    
    if (results.length > 0) {
      const bestMatch = results[0];
      console.log('Best match:', bestMatch);
      
      // Test getting detailed enhancement data
      const enhancementData = await client.getJobEnhancementData('HVAC technician');
      
      return NextResponse.json({
        success: true,
        credentials: {
          username: process.env.ONET_USERNAME ? 'SET' : 'MISSING',
          password: process.env.ONET_PASSWORD ? 'SET' : 'MISSING'
        },
        searchResults: results.slice(0, 3),
        enhancementData: enhancementData ? {
          title: enhancementData.occupation?.title,
          salary: enhancementData.salary,
          tasksCount: enhancementData.tasks?.length || 0,
          skillsCount: enhancementData.skills?.length || 0,
          firstTask: enhancementData.tasks?.[0],
          topSkills: enhancementData.skills?.slice(0, 3)
        } : null
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No HVAC occupations found',
        credentials: {
          username: process.env.ONET_USERNAME ? 'SET' : 'MISSING',
          password: process.env.ONET_PASSWORD ? 'SET' : 'MISSING'
        }
      });
    }
  } catch (error) {
    console.error('❌ O*NET Test Failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      credentials: {
        username: process.env.ONET_USERNAME ? 'SET' : 'MISSING',
        password: process.env.ONET_PASSWORD ? 'SET' : 'MISSING'
      }
    });
  }
}