# 209 Works Analytics Implementation Backup

## Overview
This document captures all analytics-related implementations, configurations, and database schemas that were developed for 209 Works before the rebuild. These should be preserved and potentially re-implemented in the clean rebuild.

## Database Schema - Comprehensive Analytics

### Core Analytics Tables (from add_comprehensive_analytics.sql)

1. **UserBehaviorEvent** - Tracks all user interactions
   - Fields: userId, eventType, eventData (JSONB), timestamp, sessionId, deviceInfo, ipAddress, userAgent, referrer
   - Purpose: Behavioral analysis and user journey tracking

2. **CareerIntentSignal** - AI-detected career change signals  
   - Fields: userId, signalType, strength, context (JSONB), detectedAt, isProcessed
   - Purpose: Identify users ready for career transitions

3. **UserBehaviorProfile** - Aggregated behavior patterns
   - Fields: userId, lastActivity, totalEvents, eventTypeCounts (JSONB), behaviorPatterns (JSONB), careerChangeReadiness
   - Purpose: User profiling and readiness scoring

4. **UserTimePattern** - Time-based behavior analysis
   - Fields: userId, eventType, hour, dayOfWeek, isWeekend, count, lastOccurrence
   - Purpose: Temporal behavior pattern analysis

5. **UserGeographicPattern** - Geographic behavior tracking
   - Fields: userId, region, activityCount, lastActivity, coordinates (JSONB)
   - Purpose: Regional activity analysis

6. **UserSkillInterest** - Skill interest tracking
   - Fields: userId, skill, interestCount, lastInteraction, contexts, proficiencyLevel, learningIntent
   - Purpose: Skill development and interest analysis

7. **MarketIntelligence** - Market data and trends
   - Fields: region, industry, metric, value, trend, confidence, calculatedAt, metadata (JSONB)
   - Purpose: Market analysis and intelligence

8. **CareerTransition** - Career transition tracking
   - Fields: userId, fromIndustry, toIndustry, fromJobTitle, toJobTitle, startDate, completionDate, isSuccessful, salaryChange, timeToTransition, skillsAcquired, trainingPrograms (JSONB), challenges, successFactors
   - Purpose: Track career transition outcomes

9. **EconomicImpact** - Economic impact measurement
   - Fields: userId, impactType, value, region, industry, calculatedAt, metadata (JSONB)
   - Purpose: Measure platform's economic impact

10. **UserLifeEvent** - Life event tracking
    - Fields: userId, eventType, eventDate, impact, detectedFrom, confidence
    - Purpose: Correlate life events with career decisions

11. **CompetitiveIntelligence** - Competitor analysis
    - Fields: competitor, metric, value, region, industry, source, collectedAt, metadata (JSONB)
    - Purpose: Market competitive analysis

12. **TrainingProgramOutcome** - Training effectiveness
    - Fields: userId, programName, provider, startDate, completionDate, isCompleted, jobPlacementRate, salaryIncrease, timeToEmployment, skillsGained, userSatisfaction, wouldRecommend
    - Purpose: Track training program effectiveness

13. **EmployerTalentPipeline** - Talent pipeline analysis
    - Fields: employerId, targetIndustry, sourceIndustry, candidateCount, averageReadiness, estimatedTimeToHire, recommendedSalaryRange (JSONB), keyAttractors, lastUpdated
    - Purpose: Help employers understand talent availability

14. **PredictiveModel** - ML model storage
    - Fields: modelType, version, accuracy, trainingData (JSONB), parameters (JSONB), isActive
    - Purpose: Store predictive models

15. **ModelPrediction** - Model predictions and outcomes
    - Fields: modelId, userId, predictionType, prediction (JSONB), confidence, actualOutcome (JSONB), isCorrect
    - Purpose: Track prediction accuracy

### Existing Prisma Schema Analytics Models

1. **SearchAnalytics** - Search behavior tracking
2. **InstagramAnalytics** - Social media analytics
3. **ChatAnalytics** - JobsGPT conversation analytics
4. **FeaturedJobAnalytics** - Featured job performance
5. **AnalyticsReport** - Generated analytics reports

## Monitoring & Analytics Infrastructure

### Google Analytics 4 Setup
- Environment Variable: `NEXT_PUBLIC_GA_TRACKING_ID`
- Custom events: job_search, jobsgpt_usage, job_application, payment_tracking
- User properties: user_type, user_region, user_tier
- Conversion tracking: registration, applications, payments, JobsGPT usage, resume uploads

### Sentry Error Tracking
- Environment Variable: `SENTRY_DSN`
- Features: Real-time error tracking, performance monitoring, user context, API error categorization, security events, payment errors, JobsGPT errors

### Health Monitoring
- Endpoint: `/api/health`
- Checks: Database connectivity, Redis status, external API health, memory usage, system uptime

### Analytics API Endpoints (Placeholder Structure)
- `/api/analytics/track` - Event tracking
- `/api/analytics/comprehensive` - Comprehensive analytics
- `/api/analytics/dashboard` - Dashboard analytics
- `/api/analytics/reports` - Analytics reports
- `/api/jobs/[id]/analytics` - Job-specific analytics
- `/api/ads/[id]/analytics` - Ad analytics

## Analytics Components & Hooks (Placeholder Structure)

### Components
- `Analytics.tsx` - Main analytics page
- `RegionalAnalyticsDashboard.tsx` - Regional analytics dashboard

### Hooks
- `useAnalytics.tsx` - Analytics hook
- `useRegionalAnalytics.ts` - Regional analytics hook

### Libraries (Placeholder Structure)
- `google-analytics.ts` - Google Analytics integration
- `posthog-provider.tsx` - PostHog analytics provider
- `analytics-middleware.ts` - Analytics middleware
- `comprehensive-analytics.ts` - Comprehensive analytics
- `advanced-analytics.ts` - Advanced analytics
- `job-board-analytics.ts` - Job board analytics
- `funnel-analysis.ts` - Funnel analysis
- `session-tracker.ts` - Session tracking

## Global Analytics Interface

```typescript
declare global {
  interface Window {
    trackJobSearch: (query: string, location?: string) => void;
    trackJobView: (jobId: string, jobTitle: string) => void;
    trackEmailSubscription: () => void;
    trackEmployerClick: (action: string) => void;
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
```

## Regional Analytics Implementation Plan

From technical documentation, there was a planned RegionalAnalytics class with methods:
- `trackJobView(jobId, userId?)` 
- `trackJobApplication(jobId, userId)`
- `trackRegionalSearch(query, filters)`

## Key Features to Preserve

1. **Career Transition Intelligence System** - Comprehensive tracking of career changes with success rates and salary data
2. **Behavioral Analytics** - User behavior patterns and readiness scoring
3. **Market Intelligence** - Regional market data and trends
4. **Predictive Analytics** - ML models for career predictions
5. **Economic Impact Tracking** - Platform's economic impact measurement
6. **Training Program Effectiveness** - Track training outcomes and ROI
7. **Employer Talent Pipeline** - Help employers understand talent availability

## Implementation Priority for Rebuild

1. **High Priority**: Basic Google Analytics 4, Sentry error tracking, health monitoring
2. **Medium Priority**: User behavior tracking, search analytics, JobsGPT analytics
3. **Low Priority**: Advanced predictive models, comprehensive career transition analytics

## Notes

- Most analytics implementations were in placeholder/TODO state
- Database schema was fully designed but may not have been implemented
- Monitoring infrastructure was production-ready
- Focus should be on implementing basic analytics first, then building up to advanced features
- All analytics should respect user privacy and comply with data protection regulations
