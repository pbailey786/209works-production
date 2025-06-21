import { NextRequest, NextResponse } from 'next/server';
import { ResponseHelper } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const funnelType = searchParams.get('type') || 'job_seeker';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const includeRecommendations = searchParams.get('recommendations') === 'true';

  try {
    // In a real implementation, this would query your analytics database
    // For now, we'll generate realistic mock data

    const funnelData = generateFunnelAnalytics(funnelType, {
      dateFrom: dateFrom
        ? new Date(dateFrom)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateTo: dateTo ? new Date(dateTo) : new Date(),
      includeRecommendations,
    });

    return ResponseHelper.success(funnelData);
  } catch (error) {
    console.error('Error retrieving funnel analytics:', error);
    return ResponseHelper.serverError('Failed to retrieve funnel analytics');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Track funnel event
    const {
      funnelId,
      stepId,
      userId,
      sessionId,
      eventType, // 'step_completed' | 'drop_off'
      metadata,
    } = body;

    // In a real implementation, this would store the event in your database
    // For now, we'll just log it
    console.log('Funnel event tracked:', {
      funnelId,
      stepId,
      userId,
      sessionId,
      eventType,
      metadata,
      timestamp: new Date().toISOString(),
    });

    return ResponseHelper.success({
      message: 'Funnel event tracked successfully',
      eventId: `event_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking funnel event:', error);
    return ResponseHelper.serverError('Failed to track funnel event');
  }
}

// Helper function to generate realistic funnel analytics data
function generateFunnelAnalytics(
  funnelType: string,
  options: {
    dateFrom: Date;
    dateTo: Date;
    includeRecommendations?: boolean;
  }
) {
  const isJobSeeker = funnelType === 'job_seeker';

  // Define funnel steps based on type
  const steps = isJobSeeker
    ? [
        { id: 'landing', name: 'Landing Page Visit', category: 'awareness' },
        { id: 'search', name: 'Job Search', category: 'interest' },
        { id: 'job_view', name: 'Job View', category: 'consideration' },
        {
          id: 'registration',
          name: 'User Registration',
          category: 'consideration',
        },
        {
          id: 'application_start',
          name: 'Application Started',
          category: 'conversion',
        },
        {
          id: 'application_complete',
          name: 'Application Completed',
          category: 'conversion',
        },
        {
          id: 'profile_complete',
          name: 'Profile Completion',
          category: 'retention',
        },
      ]
    : [
        {
          id: 'employer_landing',
          name: 'Employer Landing',
          category: 'awareness',
        },
        { id: 'pricing_view', name: 'Pricing View', category: 'interest' },
        {
          id: 'employer_registration',
          name: 'Employer Registration',
          category: 'consideration',
        },
        {
          id: 'job_post_start',
          name: 'Job Posting Started',
          category: 'conversion',
        },
        { id: 'payment', name: 'Payment Completed', category: 'conversion' },
        { id: 'job_published', name: 'Job Published', category: 'conversion' },
        {
          id: 'repeat_posting',
          name: 'Repeat Job Posting',
          category: 'retention',
        },
      ];

  // Generate realistic user counts with drop-offs
  const totalUsers = Math.floor(Math.random() * 15000) + 10000;
  let currentUsers = totalUsers;

  const stepData = steps.map((step, index) => {
    // Simulate realistic drop-off rates
    let dropOffRate = 0;

    switch (step.category) {
      case 'awareness':
        dropOffRate = 0.15; // 15% drop-off
        break;
      case 'interest':
        dropOffRate = 0.3; // 30% drop-off
        break;
      case 'consideration':
        dropOffRate = 0.4; // 40% drop-off
        break;
      case 'conversion':
        dropOffRate = 0.5; // 50% drop-off
        break;
      case 'retention':
        dropOffRate = 0.25; // 25% drop-off
        break;
    }

    // Add randomness
    dropOffRate += (Math.random() - 0.5) * 0.1;
    dropOffRate = Math.max(0.05, Math.min(0.7, dropOffRate));

    if (index > 0) {
      currentUsers = Math.floor(currentUsers * (1 - dropOffRate));
    }

    const completionRate = (currentUsers / totalUsers) * 100;

    return {
      step: {
        id: step.id,
        name: step.name,
        category: step.category,
        order: index + 1,
        isRequired: step.category !== 'retention',
      },
      users: currentUsers,
      sessions: Math.floor(currentUsers * 1.2),
      completionRate,
      dropOffRate: dropOffRate * 100,
      averageTimeSpent: Math.floor(Math.random() * 300) + 60,
      conversionValue:
        step.category === 'conversion'
          ? Math.floor(Math.random() * 200) + 50
          : undefined,
      timestamp: new Date().toISOString(),
    };
  });

  // Generate drop-off points
  const dropOffPoints = [];
  for (let i = 0; i < stepData.length - 1; i++) {
    const currentStep = stepData[i];
    const nextStep = stepData[i + 1];

    const dropOffRate =
      ((currentStep.users - nextStep.users) / currentStep.users) * 100;
    const usersLost = currentStep.users - nextStep.users;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (dropOffRate > 60) severity = 'critical';
    else if (dropOffRate > 45) severity = 'high';
    else if (dropOffRate > 30) severity = 'medium';

    const primaryReasons = generateDropOffReasons(
      currentStep.step,
      nextStep.step
    );

    dropOffPoints.push({
      fromStep: currentStep.step.id,
      toStep: nextStep.step.id,
      dropOffRate,
      usersLost,
      potentialRevenueLost: usersLost * (isJobSeeker ? 25 : 150),
      primaryReasons,
      severity,
    });
  }

  // Generate optimization recommendations
  const recommendations = options.includeRecommendations
    ? generateOptimizationRecommendations(stepData, dropOffPoints, isJobSeeker)
    : [];

  // Calculate overall metrics
  const finalStep = stepData[stepData.length - 1];
  const overallConversionRate = (finalStep.users / totalUsers) * 100;

  return {
    funnelId: funnelType,
    funnelName: isJobSeeker ? 'Job Seeker Journey' : 'Employer Journey',
    totalUsers,
    totalSessions: Math.floor(totalUsers * 1.3),
    overallConversionRate,
    steps: stepData,
    dropOffPoints,
    optimizationRecommendations: recommendations,
    dateRange: {
      from: options.dateFrom.toISOString(),
      to: options.dateTo.toISOString(),
    },
    lastUpdated: new Date().toISOString(),
    metadata: {
      generatedAt: new Date().toISOString(),
      dataSource: 'mock_analytics',
      confidence: 0.85,
    },
  };
}

function generateDropOffReasons(fromStep: any, toStep: any): string[] {
  const reasons: string[] = [];

  // Job seeker specific reasons
  if (fromStep.id === 'landing' && toStep.id === 'search') {
    reasons.push('Landing page not compelling enough');
    reasons.push('Unclear value proposition');
    reasons.push('Poor page load performance');
  } else if (fromStep.id === 'search' && toStep.id === 'job_view') {
    reasons.push('Search results not relevant');
    reasons.push('Limited job opportunities');
    reasons.push('Complex search interface');
  } else if (fromStep.id === 'job_view' && toStep.id === 'registration') {
    reasons.push('Registration process too complex');
    reasons.push('Lack of trust signals');
    reasons.push('No clear benefit to registering');
  } else if (
    fromStep.id === 'application_start' &&
    toStep.id === 'application_complete'
  ) {
    reasons.push('Application form too long');
    reasons.push('Technical issues during submission');
    reasons.push('Required fields unclear');
  }

  // Employer specific reasons
  else if (fromStep.id === 'employer_landing' && toStep.id === 'pricing_view') {
    reasons.push('Value proposition unclear');
    reasons.push('Pricing information hard to find');
    reasons.push('Competitor comparison needed');
  } else if (
    fromStep.id === 'pricing_view' &&
    toStep.id === 'employer_registration'
  ) {
    reasons.push('Pricing too high');
    reasons.push('No free trial available');
    reasons.push('Complex pricing structure');
  } else if (fromStep.id === 'job_post_start' && toStep.id === 'payment') {
    reasons.push('Payment process complicated');
    reasons.push('Limited payment options');
    reasons.push('Security concerns');
  }

  // Generic reasons
  if (reasons.length === 0) {
    reasons.push('User experience friction');
    reasons.push('Technical performance issues');
    reasons.push('Unclear next steps');
  }

  return reasons.slice(0, 3);
}

function generateOptimizationRecommendations(
  stepData: any[],
  dropOffPoints: any[],
  isJobSeeker: boolean
): any[] {
  const recommendations: any[] = [];

  // Generate recommendations based on critical drop-offs
  dropOffPoints.forEach((dropOff, index) => {
    if (dropOff.severity === 'critical' || dropOff.severity === 'high') {
      const fromStep = stepData.find(s => s.step.id === dropOff.fromStep);

      if (fromStep) {
        recommendations.push({
          id: `rec_${dropOff.fromStep}_${index}`,
          type: 'ui_improvement',
          priority: dropOff.severity === 'critical' ? 'critical' : 'high',
          title: `Optimize ${fromStep.step.name} Experience`,
          description: `Address ${dropOff.dropOffRate.toFixed(1)}% drop-off rate by improving user experience and reducing friction`,
          expectedImpact: `Reduce drop-off by 20-30%, potentially recovering ${Math.floor(dropOff.usersLost * 0.25)} users`,
          implementationEffort: 'medium',
          affectedSteps: [dropOff.fromStep, dropOff.toStep],
          estimatedLift: Math.floor(dropOff.dropOffRate * 0.25),
        });
      }
    }
  });

  // Add specific recommendations based on funnel type
  if (isJobSeeker) {
    recommendations.push({
      id: 'rec_search_optimization',
      type: 'content_optimization',
      priority: 'medium',
      title: 'Improve Job Search Relevance',
      description:
        'Enhance search algorithm and filters to show more relevant job results',
      expectedImpact: 'Increase search-to-view conversion by 15-20%',
      implementationEffort: 'high',
      affectedSteps: ['search', 'job_view'],
      estimatedLift: 18,
    });
  } else {
    recommendations.push({
      id: 'rec_pricing_clarity',
      type: 'content_optimization',
      priority: 'medium',
      title: 'Simplify Pricing Communication',
      description:
        'Make pricing more transparent and add value-based messaging',
      expectedImpact: 'Increase pricing-to-registration conversion by 25%',
      implementationEffort: 'low',
      affectedSteps: ['pricing_view', 'employer_registration'],
      estimatedLift: 25,
    });
  }

  return recommendations;
}
