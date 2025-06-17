/**
 * Conversion Funnel Analysis System
 * Comprehensive funnel tracking and optimization for job board platform
 */

'use client';

import { usePostHog } from '@/lib/analytics/posthog-provider';

// Funnel Step Types
export interface FunnelStep {
  id: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  category:
    | 'awareness'
    | 'interest'
    | 'consideration'
    | 'conversion'
    | 'retention';
}

// Funnel Data Types
export interface FunnelStepData {
  step: FunnelStep;
  users: number;
  sessions: number;
  completionRate: number;
  dropOffRate: number;
  averageTimeSpent: number;
  conversionValue?: number;
  timestamp: string;
}

export interface FunnelAnalysis {
  funnelId: string;
  funnelName: string;
  totalUsers: number;
  totalSessions: number;
  overallConversionRate: number;
  steps: FunnelStepData[];
  dropOffPoints: DropOffPoint[];
  optimizationRecommendations: OptimizationRecommendation[];
  cohortAnalysis?: CohortData[];
  lastUpdated: string;
}

export interface DropOffPoint {
  fromStep: string;
  toStep: string;
  dropOffRate: number;
  usersLost: number;
  potentialRevenueLost?: number;
  primaryReasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface OptimizationRecommendation {
  id: string;
  type:
    | 'ui_improvement'
    | 'content_optimization'
    | 'technical_fix'
    | 'process_simplification';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  affectedSteps: string[];
  estimatedLift?: number; // Percentage improvement
}

export interface CohortData {
  cohortId: string;
  cohortName: string;
  userCount: number;
  conversionRate: number;
  averageTimeToConvert: number;
  retentionRate: number;
}

// Predefined Funnel Configurations
export const JOB_SEEKER_FUNNEL: FunnelStep[] = [
  {
    id: 'landing',
    name: 'Landing Page Visit',
    description: 'User visits the job board homepage or landing page',
    order: 1,
    isRequired: true,
    category: 'awareness',
  },
  {
    id: 'search',
    name: 'Job Search',
    description: 'User performs their first job search',
    order: 2,
    isRequired: true,
    category: 'interest',
  },
  {
    id: 'job_view',
    name: 'Job View',
    description: 'User clicks on and views a job listing',
    order: 3,
    isRequired: true,
    category: 'consideration',
  },
  {
    id: 'registration',
    name: 'User Registration',
    description: 'User creates an account',
    order: 4,
    isRequired: false,
    category: 'consideration',
  },
  {
    id: 'application_start',
    name: 'Application Started',
    description: 'User begins job application process',
    order: 5,
    isRequired: true,
    category: 'conversion',
  },
  {
    id: 'application_complete',
    name: 'Application Completed',
    description: 'User successfully submits job application',
    order: 6,
    isRequired: true,
    category: 'conversion',
  },
  {
    id: 'profile_complete',
    name: 'Profile Completion',
    description: 'User completes their profile with resume and details',
    order: 7,
    isRequired: false,
    category: 'retention',
  },
];

export const EMPLOYER_FUNNEL: FunnelStep[] = [
  {
    id: 'employer_landing',
    name: 'Employer Landing',
    description: 'Employer visits employer-focused pages',
    order: 1,
    isRequired: true,
    category: 'awareness',
  },
  {
    id: 'pricing_view',
    name: 'Pricing View',
    description: 'Employer views pricing information',
    order: 2,
    isRequired: true,
    category: 'interest',
  },
  {
    id: 'employer_registration',
    name: 'Employer Registration',
    description: 'Employer creates an account',
    order: 3,
    isRequired: true,
    category: 'consideration',
  },
  {
    id: 'job_post_start',
    name: 'Job Posting Started',
    description: 'Employer begins creating a job posting',
    order: 4,
    isRequired: true,
    category: 'conversion',
  },
  {
    id: 'payment',
    name: 'Payment Completed',
    description: 'Employer completes payment for job posting',
    order: 5,
    isRequired: true,
    category: 'conversion',
  },
  {
    id: 'job_published',
    name: 'Job Published',
    description: 'Job posting goes live on the platform',
    order: 6,
    isRequired: true,
    category: 'conversion',
  },
  {
    id: 'repeat_posting',
    name: 'Repeat Job Posting',
    description: 'Employer posts additional jobs',
    order: 7,
    isRequired: false,
    category: 'retention',
  },
];

/**
 * Funnel Analysis Hook
 * Provides comprehensive funnel tracking and analysis capabilities
 */
export function useFunnelAnalysis() {
  const { trackEvent, isInitialized } = usePostHog();

  // Track funnel step completion
  const trackFunnelStep = (
    funnelId: string,
    stepId: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!isInitialized) return;

    trackEvent('funnel_step_completed', {
      funnel_id: funnelId,
      step_id: stepId,
      user_id: userId,
      session_id: sessionId,
      step_timestamp: new Date().toISOString(),
      ...metadata,
    });
  };

  // Track funnel drop-off
  const trackFunnelDropOff = (
    funnelId: string,
    fromStepId: string,
    userId?: string,
    sessionId?: string,
    reason?: string,
    metadata?: Record<string, any>
  ) => {
    if (!isInitialized) return;

    trackEvent('funnel_drop_off', {
      funnel_id: funnelId,
      from_step_id: fromStepId,
      user_id: userId,
      session_id: sessionId,
      drop_off_reason: reason,
      drop_off_timestamp: new Date().toISOString(),
      ...metadata,
    });
  };

  // Analyze funnel performance
  const analyzeFunnel = async (
    funnelId: string,
    steps: FunnelStep[],
    dateRange?: { from: Date; to: Date }
  ): Promise<FunnelAnalysis> => {
    // In a real implementation, this would query your analytics database
    // For now, we'll generate mock data based on realistic patterns

    const mockData = generateMockFunnelData(funnelId, steps, dateRange);
    const dropOffPoints = identifyDropOffPoints(mockData.steps);
    const recommendations = generateOptimizationRecommendations(
      mockData.steps,
      dropOffPoints
    );

    return {
      ...mockData,
      dropOffPoints,
      optimizationRecommendations: recommendations,
      lastUpdated: new Date().toISOString(),
    };
  };

  // Generate A/B test recommendations
  const generateABTestRecommendations = (
    funnelAnalysis: FunnelAnalysis
  ): Array<{
    testId: string;
    hypothesis: string;
    targetStep: string;
    testType: 'ui_change' | 'copy_change' | 'flow_change' | 'feature_toggle';
    expectedLift: number;
    duration: number; // days
    sampleSize: number;
  }> => {
    const tests: any[] = [];

    funnelAnalysis.dropOffPoints.forEach(dropOff => {
      if (dropOff.severity === 'high' || dropOff.severity === 'critical') {
        tests.push({
          testId: `test_${dropOff.fromStep}_${Date.now()}`,
          hypothesis: `Improving the ${dropOff.fromStep} step will reduce drop-off by ${Math.round(dropOff.dropOffRate * 0.3 * 100)}%`,
          targetStep: dropOff.fromStep,
          testType: 'ui_change',
          expectedLift: dropOff.dropOffRate * 0.3,
          duration: 14,
          sampleSize: Math.max(1000, dropOff.usersLost * 2),
        });
      }
    });

    return tests;
  };

  // Track funnel optimization implementation
  const trackOptimizationImplemented = (
    recommendationId: string,
    implementationType: string,
    expectedImpact: number
  ) => {
    if (!isInitialized) return;

    trackEvent('funnel_optimization_implemented', {
      recommendation_id: recommendationId,
      implementation_type: implementationType,
      expected_impact: expectedImpact,
      implementation_timestamp: new Date().toISOString(),
    });
  };

  return {
    // Core tracking functions
    trackFunnelStep,
    trackFunnelDropOff,

    // Analysis functions
    analyzeFunnel,
    generateABTestRecommendations,

    // Optimization tracking
    trackOptimizationImplemented,

    // Predefined funnels
    jobSeekerFunnel: JOB_SEEKER_FUNNEL,
    employerFunnel: EMPLOYER_FUNNEL,

    // State
    isInitialized,
  };
}

// Helper Functions

function generateMockFunnelData(
  funnelId: string,
  steps: FunnelStep[],
  dateRange?: { from: Date; to: Date }
): Omit<FunnelAnalysis, 'dropOffPoints' | 'optimizationRecommendations'> {
  const totalUsers = Math.floor(Math.random() * 10000) + 5000;
  const totalSessions = Math.floor(totalUsers * 1.3); // Some users have multiple sessions

  let currentUsers = totalUsers;
  const stepData: FunnelStepData[] = [];

  steps.forEach((step, index) => {
    // Simulate realistic drop-off rates
    let dropOffRate = 0;

    switch (step.category) {
      case 'awareness':
        dropOffRate = 0.1; // 10% drop-off
        break;
      case 'interest':
        dropOffRate = 0.25; // 25% drop-off
        break;
      case 'consideration':
        dropOffRate = 0.35; // 35% drop-off
        break;
      case 'conversion':
        dropOffRate = 0.45; // 45% drop-off
        break;
      case 'retention':
        dropOffRate = 0.2; // 20% drop-off
        break;
    }

    // Add some randomness
    dropOffRate += (Math.random() - 0.5) * 0.1;
    dropOffRate = Math.max(0.05, Math.min(0.8, dropOffRate));

    if (index > 0) {
      currentUsers = Math.floor(currentUsers * (1 - dropOffRate));
    }

    const completionRate =
      index === 0 ? 100 : (currentUsers / totalUsers) * 100;

    stepData.push({
      step,
      users: currentUsers,
      sessions: Math.floor(currentUsers * 1.1),
      completionRate,
      dropOffRate: dropOffRate * 100,
      averageTimeSpent: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
      conversionValue:
        step.category === 'conversion'
          ? Math.floor(Math.random() * 500) + 100
          : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  const finalConversionRate =
    stepData.length > 0
      ? (stepData[stepData.length - 1].users / totalUsers) * 100
      : 0;

  return {
    funnelId,
    funnelName:
      funnelId === 'job_seeker' ? 'Job Seeker Journey' : 'Employer Journey',
    totalUsers,
    totalSessions,
    overallConversionRate: finalConversionRate,
    steps: stepData,
    lastUpdated: new Date().toISOString(),
  };
}

function identifyDropOffPoints(steps: FunnelStepData[]): DropOffPoint[] {
  const dropOffPoints: DropOffPoint[] = [];

  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i];
    const nextStep = steps[i + 1];

    const dropOffRate =
      ((currentStep.users - nextStep.users) / currentStep.users) * 100;
    const usersLost = currentStep.users - nextStep.users;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (dropOffRate > 70) severity = 'critical';
    else if (dropOffRate > 50) severity = 'high';
    else if (dropOffRate > 30) severity = 'medium';

    const primaryReasons = generateDropOffReasons(
      currentStep.step,
      nextStep.step,
      dropOffRate
    );

    dropOffPoints.push({
      fromStep: currentStep.step.id,
      toStep: nextStep.step.id,
      dropOffRate,
      usersLost,
      potentialRevenueLost: usersLost * 50, // Estimate $50 per lost user
      primaryReasons,
      severity,
    });
  }

  return dropOffPoints;
}

function generateDropOffReasons(
  fromStep: FunnelStep,
  toStep: FunnelStep,
  dropOffRate: number
): string[] {
  const reasons: string[] = [];

  // Common reasons based on step transitions
  if (fromStep.category === 'awareness' && toStep.category === 'interest') {
    reasons.push('Landing page not compelling enough');
    reasons.push('Unclear value proposition');
    reasons.push('Poor page load performance');
  }

  if (fromStep.category === 'interest' && toStep.category === 'consideration') {
    reasons.push('Search results not relevant');
    reasons.push('Limited job opportunities');
    reasons.push('Complex search interface');
  }

  if (
    fromStep.category === 'consideration' &&
    toStep.category === 'conversion'
  ) {
    reasons.push('Registration process too complex');
    reasons.push('Lack of trust signals');
    reasons.push('Application process unclear');
  }

  if (dropOffRate > 50) {
    reasons.push('Technical issues or errors');
    reasons.push('Mobile experience problems');
  }

  return reasons.slice(0, 3); // Return top 3 reasons
}

function generateOptimizationRecommendations(
  steps: FunnelStepData[],
  dropOffPoints: DropOffPoint[]
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  // Generate recommendations based on drop-off points
  dropOffPoints.forEach((dropOff, index) => {
    if (dropOff.severity === 'high' || dropOff.severity === 'critical') {
      const fromStep = steps.find(s => s.step.id === dropOff.fromStep);

      if (fromStep) {
        recommendations.push({
          id: `rec_${dropOff.fromStep}_${index}`,
          type: 'ui_improvement',
          priority: dropOff.severity === 'critical' ? 'critical' : 'high',
          title: `Optimize ${fromStep.step.name} Experience`,
          description: `Address ${dropOff.dropOffRate.toFixed(1)}% drop-off rate by improving user experience`,
          expectedImpact: `Reduce drop-off by 20-30%, potentially recovering ${Math.floor(dropOff.usersLost * 0.25)} users`,
          implementationEffort: 'medium',
          affectedSteps: [dropOff.fromStep, dropOff.toStep],
          estimatedLift: 25,
        });
      }
    }
  });

  // Add general recommendations
  const overallConversionRate =
    steps.length > 0
      ? (steps[steps.length - 1].users / steps[0].users) * 100
      : 0;

  if (overallConversionRate < 10) {
    recommendations.push({
      id: 'rec_overall_conversion',
      type: 'process_simplification',
      priority: 'high',
      title: 'Simplify Overall User Journey',
      description:
        'Low overall conversion rate suggests the funnel is too complex',
      expectedImpact: 'Increase overall conversion rate by 2-5%',
      implementationEffort: 'high',
      affectedSteps: steps.map(s => s.step.id),
      estimatedLift: 35,
    });
  }

  return recommendations;
}
