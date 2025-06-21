import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DuplicateDetectionService } from '@/lib/services/duplicate-detection';
import { prisma } from '@/lib/database/prisma';


export async function POST(req: NextRequest) {
  try {
    // Check authentication (admin or system)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    const apiKey = req.headers.get('x-api-key');
    
    // Allow admin users or valid API key
    const isAuthorized = (session?.user && (session.user as any).role === 'admin') || 
                        (apiKey && apiKey === process.env.AI_ASSISTANT_API_KEY);
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Admin access or valid API key required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { jobId, jobData, checkType } = body;

    if (!jobId && !jobData) {
      return NextResponse.json(
        { error: 'Either jobId or jobData is required' },
        { status: 400 }
      );
    }

    let duplicates;
    let jobInfo;

    if (jobId) {
      // Check existing job for duplicates
      duplicates = await DuplicateDetectionService.checkJobForDuplicates(jobId);
      
      // Get job info
      jobInfo = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          employerId: true,
          flaggedAsDuplicate: true,
          duplicateScore: true,
          createdAt: true
        }
      });
    } else if (jobData) {
      // Check potential job data against existing jobs
      const { title, company, location, employerId, description } = jobData;
      
      if (!title || !company || !employerId) {
        return NextResponse.json(
          { error: 'title, company, and employerId are required in jobData' },
          { status: 400 }
        );
      }

      // Find similar jobs using database functions
      duplicates = await prisma.$queryRaw`
        SELECT 
          j.id as duplicate_job_id,
          j.title,
          j.company,
          j.location,
          j."createdAt",
          j."flaggedAsDuplicate",
          CASE 
            WHEN calculate_text_hash(j.title) = calculate_text_hash(${title}) THEN 1.0
            WHEN j.company = ${company} AND j.location = ${location} AND similarity(j.title, ${title}) > 0.7 THEN 0.8
            WHEN j.company = ${company} AND similarity(j.title, ${title}) > 0.6 THEN 0.6
            ELSE 0.0
          END as similarity_score,
          CASE 
            WHEN calculate_text_hash(j.title) = calculate_text_hash(${title}) THEN 'title_hash'
            WHEN j.company = ${company} AND j.location = ${location} THEN 'company_location_title'
            ELSE 'company_title'
          END as detection_method
        FROM "Job" j
        WHERE j."employerId" = ${employerId}
          AND j."deletedAt" IS NULL
          AND j.status = 'active'
          AND (
            calculate_text_hash(j.title) = calculate_text_hash(${title})
            OR (j.company = ${company} AND similarity(j.title, ${title}) > 0.6)
          )
        ORDER BY similarity_score DESC
        LIMIT 10
      `;

      jobInfo = {
        title,
        company,
        location,
        employerId,
        description: description?.substring(0, 200) + '...' || 'No description provided'
      };
    }

    // Get posting patterns for this employer
    const postingPatterns = await prisma.$queryRaw`
      SELECT 
        "titlePattern",
        "postingFrequency",
        "suspiciousScore",
        "flaggedForReview",
        "lastSeenAt"
      FROM "JobPostingPattern" 
      WHERE "employerId" = ${jobInfo?.employerId || jobData?.employerId}
        AND "companyName" = ${jobInfo?.company || jobData?.company}
      ORDER BY "postingFrequency" DESC
      LIMIT 5
    `;

    // Calculate risk assessment
    const riskAssessment = calculateRiskAssessment(duplicates, postingPatterns);

    return NextResponse.json({
      success: true,
      jobInfo,
      duplicates: Array.isArray(duplicates) ? duplicates : [],
      postingPatterns: Array.isArray(postingPatterns) ? postingPatterns : [],
      riskAssessment,
      recommendations: generateRecommendations(riskAssessment, duplicates),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}

// Helper function to calculate risk assessment
function calculateRiskAssessment(duplicates: any, postingPatterns: any) {
  const duplicateArray = Array.isArray(duplicates) ? duplicates : [];
  const patternArray = Array.isArray(postingPatterns) ? postingPatterns : [];
  
  let riskScore = 0;
  const factors = [];

  // High similarity duplicates
  const highSimilarityDuplicates = duplicateArray.filter((d: any) => 
    (d.similarity_score || d.similarityScore) >= 0.8
  );
  if (highSimilarityDuplicates.length > 0) {
    riskScore += 0.4;
    factors.push(`${highSimilarityDuplicates.length} high-similarity duplicate(s) found`);
  }

  // Medium similarity duplicates
  const mediumSimilarityDuplicates = duplicateArray.filter((d: any) => {
    const score = d.similarity_score || d.similarityScore;
    return score >= 0.6 && score < 0.8;
  });
  if (mediumSimilarityDuplicates.length > 0) {
    riskScore += 0.2;
    factors.push(`${mediumSimilarityDuplicates.length} medium-similarity duplicate(s) found`);
  }

  // Suspicious posting patterns
  const suspiciousPatterns = patternArray.filter((p: any) => 
    p.suspiciousScore > 0.7 || p.flaggedForReview
  );
  if (suspiciousPatterns.length > 0) {
    riskScore += 0.3;
    factors.push('Suspicious posting patterns detected');
  }

  // High frequency posting
  const highFrequencyPatterns = patternArray.filter((p: any) => p.postingFrequency > 10);
  if (highFrequencyPatterns.length > 0) {
    riskScore += 0.2;
    factors.push('High-frequency posting detected');
  }

  return {
    score: Math.min(1.0, riskScore),
    level: riskScore >= 0.7 ? 'HIGH' : riskScore >= 0.4 ? 'MEDIUM' : 'LOW',
    factors
  };
}

// Helper function to generate recommendations
function generateRecommendations(riskAssessment: any, duplicates: any) {
  const recommendations = [];
  const duplicateArray = Array.isArray(duplicates) ? duplicates : [];

  if (riskAssessment.level === 'HIGH') {
    recommendations.push('🚨 HIGH RISK: Manual review required before approval');
    recommendations.push('Consider flagging for admin review');
    
    if (duplicateArray.some((d: any) => (d.similarity_score || d.similarityScore) >= 0.9)) {
      recommendations.push('Potential exact duplicate detected - consider rejection');
    }
  } else if (riskAssessment.level === 'MEDIUM') {
    recommendations.push('⚠️ MEDIUM RISK: Additional verification recommended');
    recommendations.push('Monitor for patterns');
  } else {
    recommendations.push('✅ LOW RISK: Appears to be unique posting');
  }

  if (duplicateArray.length > 0) {
    recommendations.push(`Found ${duplicateArray.length} similar job(s) from same employer`);
  }

  return recommendations;
}

// GET /api/ai/duplicate-check - Get duplicate monitoring statistics
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    const apiKey = req.headers.get('x-api-key');
    
    const isAuthorized = (session?.user && (session.user as any).role === 'admin') || 
                        (apiKey && apiKey === process.env.AI_ASSISTANT_API_KEY);
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Admin access or valid API key required' },
        { status: 403 }
      );
    }

    const statistics = await DuplicateDetectionService.getDuplicateStatistics();
    
    return NextResponse.json({
      success: true,
      statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching duplicate statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicate statistics' },
      { status: 500 }
    );
  }
}
