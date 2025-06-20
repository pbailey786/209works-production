-- Comprehensive Analytics Database Schema
-- This migration adds all the tables needed for advanced analytics tracking

-- User Behavior Events - Track every user interaction
CREATE TABLE IF NOT EXISTS "UserBehaviorEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "deviceInfo" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserBehaviorEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Career Intent Signals - AI-detected career change signals
CREATE TABLE IF NOT EXISTS "CareerIntentSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "CareerIntentSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- User Behavior Profiles - Aggregated behavior patterns
CREATE TABLE IF NOT EXISTS "UserBehaviorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "eventTypeCounts" JSONB NOT NULL DEFAULT '{}',
    "behaviorPatterns" JSONB NOT NULL DEFAULT '{}',
    "careerChangeReadiness" DOUBLE PRECISION DEFAULT 0,
    "lastAnalyzed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserBehaviorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Time-based Behavior Patterns
CREATE TABLE IF NOT EXISTS "UserTimePattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isWeekend" BOOLEAN NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastOccurrence" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserTimePattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Geographic Behavior Patterns
CREATE TABLE IF NOT EXISTS "UserGeographicPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "activityCount" INTEGER NOT NULL DEFAULT 1,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "coordinates" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserGeographicPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Skill Interest Tracking
CREATE TABLE IF NOT EXISTS "UserSkillInterest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "interestCount" INTEGER NOT NULL DEFAULT 1,
    "lastInteraction" TIMESTAMP(3) NOT NULL,
    "contexts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proficiencyLevel" TEXT,
    "learningIntent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserSkillInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Market Intelligence Data
CREATE TABLE IF NOT EXISTS "MarketIntelligence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "trend" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Career Transition Tracking
CREATE TABLE IF NOT EXISTS "CareerTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromIndustry" TEXT NOT NULL,
    "toIndustry" TEXT NOT NULL,
    "fromJobTitle" TEXT,
    "toJobTitle" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),
    "isSuccessful" BOOLEAN,
    "salaryChange" DOUBLE PRECISION,
    "timeToTransition" INTEGER, -- in days
    "skillsAcquired" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trainingPrograms" JSONB DEFAULT '{}',
    "challenges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "successFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "CareerTransition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Economic Impact Tracking
CREATE TABLE IF NOT EXISTS "EconomicImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "impactType" TEXT NOT NULL, -- salary_increase, job_placement, skill_development
    "value" DOUBLE PRECISION NOT NULL,
    "region" TEXT NOT NULL,
    "industry" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "EconomicImpact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Life Event Tracking
CREATE TABLE IF NOT EXISTS "UserLifeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL, -- new_baby, divorce, health_issue, graduation, etc.
    "eventDate" TIMESTAMP(3) NOT NULL,
    "impact" TEXT, -- career_motivation, financial_pressure, schedule_change
    "detectedFrom" TEXT, -- chat, profile_update, behavior_change
    "confidence" DOUBLE PRECISION DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserLifeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Competitive Intelligence
CREATE TABLE IF NOT EXISTS "CompetitiveIntelligence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitor" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "region" TEXT,
    "industry" TEXT,
    "source" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Training Program Effectiveness
CREATE TABLE IF NOT EXISTS "TrainingProgramOutcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN DEFAULT false,
    "jobPlacementRate" DOUBLE PRECISION,
    "salaryIncrease" DOUBLE PRECISION,
    "timeToEmployment" INTEGER, -- days
    "skillsGained" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userSatisfaction" INTEGER, -- 1-5 rating
    "wouldRecommend" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "TrainingProgramOutcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Employer Talent Pipeline
CREATE TABLE IF NOT EXISTS "EmployerTalentPipeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employerId" TEXT NOT NULL,
    "targetIndustry" TEXT NOT NULL,
    "sourceIndustry" TEXT NOT NULL,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "averageReadiness" DOUBLE PRECISION DEFAULT 0,
    "estimatedTimeToHire" INTEGER, -- days
    "recommendedSalaryRange" JSONB,
    "keyAttractors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "EmployerTalentPipeline_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Predictive Models
CREATE TABLE IF NOT EXISTS "PredictiveModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelType" TEXT NOT NULL, -- career_success, salary_prediction, transition_time
    "version" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "trainingData" JSONB,
    "parameters" JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Model Predictions
CREATE TABLE IF NOT EXISTS "ModelPrediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "prediction" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "actualOutcome" JSONB,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ModelPrediction_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "PredictiveModel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModelPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "UserBehaviorEvent_userId_timestamp_idx" ON "UserBehaviorEvent"("userId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "UserBehaviorEvent_eventType_timestamp_idx" ON "UserBehaviorEvent"("eventType", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "UserBehaviorEvent_sessionId_idx" ON "UserBehaviorEvent"("sessionId");

CREATE INDEX IF NOT EXISTS "CareerIntentSignal_userId_detectedAt_idx" ON "CareerIntentSignal"("userId", "detectedAt" DESC);
CREATE INDEX IF NOT EXISTS "CareerIntentSignal_signalType_strength_idx" ON "CareerIntentSignal"("signalType", "strength" DESC);

CREATE INDEX IF NOT EXISTS "UserTimePattern_userId_eventType_idx" ON "UserTimePattern"("userId", "eventType");
CREATE INDEX IF NOT EXISTS "UserTimePattern_hour_dayOfWeek_idx" ON "UserTimePattern"("hour", "dayOfWeek");

CREATE INDEX IF NOT EXISTS "UserGeographicPattern_userId_region_idx" ON "UserGeographicPattern"("userId", "region");
CREATE INDEX IF NOT EXISTS "UserGeographicPattern_region_activityCount_idx" ON "UserGeographicPattern"("region", "activityCount" DESC);

CREATE INDEX IF NOT EXISTS "UserSkillInterest_userId_skill_idx" ON "UserSkillInterest"("userId", "skill");
CREATE INDEX IF NOT EXISTS "UserSkillInterest_skill_interestCount_idx" ON "UserSkillInterest"("skill", "interestCount" DESC);

CREATE INDEX IF NOT EXISTS "MarketIntelligence_region_industry_idx" ON "MarketIntelligence"("region", "industry");
CREATE INDEX IF NOT EXISTS "MarketIntelligence_metric_calculatedAt_idx" ON "MarketIntelligence"("metric", "calculatedAt" DESC);

CREATE INDEX IF NOT EXISTS "CareerTransition_fromIndustry_toIndustry_idx" ON "CareerTransition"("fromIndustry", "toIndustry");
CREATE INDEX IF NOT EXISTS "CareerTransition_isSuccessful_completionDate_idx" ON "CareerTransition"("isSuccessful", "completionDate" DESC);

CREATE INDEX IF NOT EXISTS "EconomicImpact_region_impactType_idx" ON "EconomicImpact"("region", "impactType");
CREATE INDEX IF NOT EXISTS "EconomicImpact_calculatedAt_value_idx" ON "EconomicImpact"("calculatedAt" DESC, "value" DESC);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "UserBehaviorProfile_userId_unique" ON "UserBehaviorProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserTimePattern_userId_eventType_hour_dayOfWeek_unique" ON "UserTimePattern"("userId", "eventType", "hour", "dayOfWeek");
CREATE UNIQUE INDEX IF NOT EXISTS "UserGeographicPattern_userId_region_unique" ON "UserGeographicPattern"("userId", "region");
CREATE UNIQUE INDEX IF NOT EXISTS "UserSkillInterest_userId_skill_unique" ON "UserSkillInterest"("userId", "skill");

-- Add comments for documentation
COMMENT ON TABLE "UserBehaviorEvent" IS 'Tracks all user interactions for behavioral analysis';
COMMENT ON TABLE "CareerIntentSignal" IS 'AI-detected signals indicating career change intent';
COMMENT ON TABLE "UserBehaviorProfile" IS 'Aggregated user behavior patterns and readiness scores';
COMMENT ON TABLE "MarketIntelligence" IS 'Market demand, supply, and trend data by region/industry';
COMMENT ON TABLE "CareerTransition" IS 'Tracks actual career transitions and their outcomes';
COMMENT ON TABLE "EconomicImpact" IS 'Measures economic impact of platform usage';
COMMENT ON TABLE "TrainingProgramOutcome" IS 'Tracks effectiveness of training programs';
COMMENT ON TABLE "EmployerTalentPipeline" IS 'Helps employers understand available talent pools';
COMMENT ON TABLE "PredictiveModel" IS 'Stores ML models for career predictions';
COMMENT ON TABLE "ModelPrediction" IS 'Individual predictions and their accuracy';
