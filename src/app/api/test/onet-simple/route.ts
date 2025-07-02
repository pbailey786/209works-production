import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const username = process.env.ONET_USERNAME;
    const password = process.env.ONET_PASSWORD;
    
    if (!username || !password) {
      return NextResponse.json({ error: 'O*NET credentials not configured' });
    }
    
    // Test basic auth
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    
    // Test search endpoint
    const searchUrl = 'https://services.onetcenter.org/ws/online/search?keyword=warehouse%20worker&end=5';
    console.log('Testing O*NET search:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'User-Agent': '209jobs/1.0'
      }
    });
    
    console.log('Search response status:', searchResponse.status);
    const searchData = await searchResponse.json();
    console.log('Search data:', JSON.stringify(searchData, null, 2));
    
    // If we got results, test details endpoint
    if (searchData.occupation && searchData.occupation.length > 0) {
      const firstCode = searchData.occupation[0].code;
      const detailsUrl = `https://services.onetcenter.org/ws/online/occupations/${firstCode}`;
      console.log('\nTesting details for:', firstCode);
      
      const detailsResponse = await fetch(detailsUrl, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'User-Agent': '209jobs/1.0'
        }
      });
      
      console.log('Details response status:', detailsResponse.status);
      const detailsData = await detailsResponse.json();
      console.log('Details data:', JSON.stringify(detailsData, null, 2));
      
      return NextResponse.json({
        success: true,
        searchResults: searchData,
        firstOccupationDetails: detailsData
      });
    }
    
    return NextResponse.json({
      success: true,
      searchResults: searchData,
      message: 'No occupations found'
    });
    
  } catch (error: any) {
    console.error('O*NET test error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}