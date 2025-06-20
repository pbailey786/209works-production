import { NextRequest, NextResponse } from '@/components/ui/card';
import { getDomainConfig } from '@/lib/domain/config';

export async function GET(request: NextRequest) {
  try {
    const hostname = request.nextUrl.hostname;
    const config = getDomainConfig(hostname);

    // Return only safe, public configuration data
    const publicConfig = {
      domain: config.domain,
      areaCode: config.areaCode,
      region: config.region,
      displayName: config.displayName,
      description: config.description,
      cities: config.cities,
      seo: config.seo,
      branding: config.branding,
      social: config.social,
    };

    return NextResponse.json(publicConfig);
  } catch (error) {
    console.error('Error getting domain config:', error);
    return NextResponse.json(
      { error: 'Failed to get domain configuration' },
      { status: 500 }
    );
  }
}
