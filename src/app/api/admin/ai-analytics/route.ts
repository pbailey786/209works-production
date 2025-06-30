import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../auth/authOptions';
import { prisma } from '../../auth/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch AI-related analytics
    const [
      aiAssistedApplications,
      chatIntentTypes,
      failedMatches,
      pricingTierEngagement,
      conversionFunnelData,
    ] = await Promise.all([
      // AI-assisted application rate
      prisma.$queryRaw`
        SELECT 
          COUNT(CASE WHEN ja.source = 'ai_chat' THEN 1 END) as ai_assisted,
          COUNT(*) as total_applications,
          ROUND(
            (COUNT(CASE WHEN ja.source = 'ai_chat' THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as ai_assistance_rate
        FROM JobApplication ja
        WHERE ja.appliedAt >= ${startDate}
      `,


      // Chat intent types analysis
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN question LIKE '%salary%' OR question LIKE '%pay%' THEN 'salary_inquiry'
            WHEN question LIKE '%remote%' OR question LIKE '%work from home%' THEN 'remote_work'
            WHEN question LIKE '%benefits%' THEN 'benefits_inquiry'
            WHEN question LIKE '%requirements%' OR question LIKE '%qualifications%' THEN 'requirements'
            WHEN question LIKE '%location%' OR question LIKE '%where%' THEN 'location_inquiry'
            WHEN question LIKE '%company%' THEN 'company_info'
            ELSE 'general_search'
          END as intent_type,
          COUNT(*) as count,
          AVG(jobsFound) as avg_jobs_found
        FROM ChatAnalytics
        WHERE createdAt >= ${startDate}
        GROUP BY intent_type
        ORDER BY count DESC
      `,

      // Failed matches (queries with 0 jobs found)
      prisma.$queryRaw`
        SELECT 
          question,
          COUNT(*) as frequency,
          sessionId
        FROM ChatAnalytics
        WHERE createdAt >= ${startDate}
        AND (jobsFound = 0 OR jobsFound IS NULL)
        GROUP BY question, sessionId
        HAVING COUNT(*) > 1
        ORDER BY frequency DESC
        LIMIT 20
      `,

      // Pricing tier engagement (placeholder - adjust based on your pricing model)
      prisma.$queryRaw`
        SELECT 
          u.role,
          COUNT(DISTINCT ca.userId) as active_users,
          AVG(ca.jobsFound) as avg_jobs_per_query,
          COUNT(ca.id) as total_queries
        FROM ChatAnalytics ca
        JOIN User u ON ca.userId = u.id
        WHERE ca.createdAt >= ${startDate}
        GROUP BY u.role
      `,

      // Conversion funnel data
      prisma.$queryRaw`
        SELECT 
          DATE(ca.createdAt) as date,
          COUNT(DISTINCT ca.userId) as chat_users,
          COUNT(DISTINCT ja.userId) as applicants,
          ROUND(
            (COUNT(DISTINCT ja.userId) * 100.0 / COUNT(DISTINCT ca.userId)), 2
          ) as chat_to_application_rate
        FROM ChatAnalytics ca
        LEFT JOIN JobApplication ja ON ca.userId = ja.userId 
          AND DATE(ja.appliedAt) = DATE(ca.createdAt)
        WHERE ca.createdAt >= ${startDate}
        GROUP BY DATE(ca.createdAt)
        ORDER BY date DESC
        LIMIT 30
      `,
    ]);

    // Process and format the data
    const analytics = {
      aiAssistedApplications: Array.isArray(aiAssistedApplications) ? aiAssistedApplications[0] : {
        ai_assisted: 0,
        total_applications: 0,
        ai_assistance_rate: 0,
      },
      

      intentTypes: Array.isArray(chatIntentTypes) ? chatIntentTypes : [],
      
      failedMatches: Array.isArray(failedMatches) ? failedMatches : [],
      
      pricingTierEngagement: Array.isArray(pricingTierEngagement) ? pricingTierEngagement : [],
      
      conversionFunnel: Array.isArray(conversionFunnelData) ? conversionFunnelData : [],

      // Summary metrics
      summary: {
        totalChatUsers: Array.isArray(pricingTierEngagement) 
          ? pricingTierEngagement.reduce((sum, tier) => sum + Number(tier.active_users), 0)
          : 0,
        
        avgJobsPerQuery: Array.isArray(pricingTierEngagement) && pricingTierEngagement.length > 0
          ? pricingTierEngagement.reduce((sum, tier) => sum + Number(tier.avg_jobs_per_query), 0) / pricingTierEngagement.length
          : 0,
        
        topFailedQuery: Array.isArray(failedMatches) && failedMatches.length > 0
          ? failedMatches[0].question
          : 'No failed queries',
        
        mostCommonIntent: Array.isArray(chatIntentTypes) && chatIntentTypes.length > 0
          ? chatIntentTypes[0].intent_type
          : 'general_search',
      },

      period: {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        filter: dateFilter,
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI analytics' },
      { status: 500 }
    );
  }
}

// POST endpoint to log AI events for tracking
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, data } = body;

    // Log different types of AI events
    switch (eventType) {
      case 'ai_application_assist':
        // Track when AI helps with job application
        await prisma.chatAnalytics.create({
          data: {
            userId: session.user.id,
            question: data.query || 'AI Application Assistance',
            response: data.recommendation || '',
            jobsFound: data.jobsFound || 0,
            responseTime: data.responseTime || 0,
            sessionId: data.sessionId || '',
            metadata: JSON.stringify({
              eventType: 'ai_application_assist',
              jobId: data.jobId,
              recommendation: data.recommendation,
            }),
          },
        });
        break;


      case 'failed_match':
        // Track queries that didn't return good results
        await prisma.chatAnalytics.create({
          data: {
            userId: session.user.id,
            question: data.query || '',
            response: 'No suitable matches found',
            jobsFound: 0,
            responseTime: data.responseTime || 0,
            sessionId: data.sessionId || '',
            metadata: JSON.stringify({
              eventType: 'failed_match',
              reason: data.reason || 'no_matches',
              searchCriteria: data.searchCriteria,
            }),
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging AI event:', error);
    return NextResponse.json(
      { error: 'Failed to log AI event' },
      { status: 500 }
    );
  }
}
