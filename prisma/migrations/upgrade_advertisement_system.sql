-- Migration: Upgrade Advertisement System to Full-Featured Platform
-- Task 10: Local Advertisement Platform
-- Date: 2025-01-27

-- ============================================================================
-- PART 1: DROP EXISTING SIMPLE ADVERTISEMENT TABLE
-- ============================================================================

-- First, backup any existing data (if needed)
-- CREATE TABLE "Advertisement_backup" AS SELECT * FROM "Advertisement";

-- Drop the existing simple Advertisement table
DROP TABLE IF EXISTS "Advertisement";

-- ============================================================================
-- PART 2: CREATE COMPREHENSIVE ADVERTISEMENT SYSTEM
-- ============================================================================

-- Main Advertisement table with full feature set
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- banner, sidebar, featured_job, sponsored_search, native, video, popup
    "status" TEXT NOT NULL DEFAULT 'draft', -- draft, pending, active, paused, expired, rejected, cancelled
    
    -- Content fields (JSON for flexibility)
    "content" JSONB NOT NULL,
    
    -- Targeting criteria (JSON for complex targeting)
    "targeting" JSONB,
    
    -- Bidding and budget
    "bidding" JSONB NOT NULL,
    
    -- Schedule
    "schedule" JSONB NOT NULL,
    
    -- Performance tracking
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "currentSpend" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Ad priority and settings
    "priority" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    
    -- Relationships
    "advertiserId" TEXT NOT NULL,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- PART 3: CREATE AD TRACKING TABLES
-- ============================================================================

-- Ad Impressions tracking
CREATE TABLE "AdImpression" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "page" TEXT,
    "position" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AdImpression_pkey" PRIMARY KEY ("id")
);

-- Ad Clicks tracking
CREATE TABLE "AdClick" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "impressionId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "targetUrl" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AdClick_pkey" PRIMARY KEY ("id")
);

-- Ad Conversions tracking
CREATE TABLE "AdConversion" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "clickId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL, -- job_view, job_apply, signup, purchase, custom
    "value" DECIMAL(10,2),
    "customEvent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AdConversion_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- PART 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Advertisement indexes
CREATE INDEX "Advertisement_advertiserId_idx" ON "Advertisement"("advertiserId");
CREATE INDEX "Advertisement_status_idx" ON "Advertisement"("status");
CREATE INDEX "Advertisement_type_idx" ON "Advertisement"("type");
CREATE INDEX "Advertisement_createdAt_idx" ON "Advertisement"("createdAt");
CREATE INDEX "Advertisement_priority_idx" ON "Advertisement"("priority");

-- Composite indexes for common queries
CREATE INDEX "Advertisement_status_type_idx" ON "Advertisement"("status", "type");
CREATE INDEX "Advertisement_advertiser_status_idx" ON "Advertisement"("advertiserId", "status");

-- JSON indexes for targeting and content
CREATE INDEX "Advertisement_targeting_gin_idx" ON "Advertisement" USING GIN ("targeting");
CREATE INDEX "Advertisement_content_gin_idx" ON "Advertisement" USING GIN ("content");

-- Ad tracking indexes
CREATE INDEX "AdImpression_adId_idx" ON "AdImpression"("adId");
CREATE INDEX "AdImpression_userId_idx" ON "AdImpression"("userId");
CREATE INDEX "AdImpression_timestamp_idx" ON "AdImpression"("timestamp");
CREATE INDEX "AdImpression_sessionId_idx" ON "AdImpression"("sessionId");

CREATE INDEX "AdClick_adId_idx" ON "AdClick"("adId");
CREATE INDEX "AdClick_impressionId_idx" ON "AdClick"("impressionId");
CREATE INDEX "AdClick_userId_idx" ON "AdClick"("userId");
CREATE INDEX "AdClick_timestamp_idx" ON "AdClick"("timestamp");
CREATE INDEX "AdClick_sessionId_idx" ON "AdClick"("sessionId");

CREATE INDEX "AdConversion_adId_idx" ON "AdConversion"("adId");
CREATE INDEX "AdConversion_clickId_idx" ON "AdConversion"("clickId");
CREATE INDEX "AdConversion_userId_idx" ON "AdConversion"("userId");
CREATE INDEX "AdConversion_type_idx" ON "AdConversion"("type");
CREATE INDEX "AdConversion_timestamp_idx" ON "AdConversion"("timestamp");

-- ============================================================================
-- PART 5: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Advertisement foreign keys
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_advertiserId_fkey" 
FOREIGN KEY ("advertiserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ad tracking foreign keys
ALTER TABLE "AdImpression" ADD CONSTRAINT "AdImpression_adId_fkey" 
FOREIGN KEY ("adId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdImpression" ADD CONSTRAINT "AdImpression_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_adId_fkey" 
FOREIGN KEY ("adId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_impressionId_fkey" 
FOREIGN KEY ("impressionId") REFERENCES "AdImpression"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdConversion" ADD CONSTRAINT "AdConversion_adId_fkey" 
FOREIGN KEY ("adId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdConversion" ADD CONSTRAINT "AdConversion_clickId_fkey" 
FOREIGN KEY ("clickId") REFERENCES "AdClick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdConversion" ADD CONSTRAINT "AdConversion_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- PART 6: CREATE MATERIALIZED VIEW FOR AD PERFORMANCE
-- ============================================================================

-- Materialized view for ad performance metrics
CREATE MATERIALIZED VIEW "AdPerformanceStats" AS
SELECT 
    a.id as ad_id,
    a.name,
    a.type,
    a.status,
    a.advertiserId,
    a.currentSpend,
    
    -- Impression metrics
    COUNT(DISTINCT ai.id) as total_impressions,
    COUNT(DISTINCT ai.id) FILTER (WHERE ai.timestamp > NOW() - INTERVAL '24 hours') as impressions_24h,
    COUNT(DISTINCT ai.id) FILTER (WHERE ai.timestamp > NOW() - INTERVAL '7 days') as impressions_7d,
    COUNT(DISTINCT ai.id) FILTER (WHERE ai.timestamp > NOW() - INTERVAL '30 days') as impressions_30d,
    
    -- Click metrics
    COUNT(DISTINCT ac.id) as total_clicks,
    COUNT(DISTINCT ac.id) FILTER (WHERE ac.timestamp > NOW() - INTERVAL '24 hours') as clicks_24h,
    COUNT(DISTINCT ac.id) FILTER (WHERE ac.timestamp > NOW() - INTERVAL '7 days') as clicks_7d,
    COUNT(DISTINCT ac.id) FILTER (WHERE ac.timestamp > NOW() - INTERVAL '30 days') as clicks_30d,
    
    -- Conversion metrics
    COUNT(DISTINCT acv.id) as total_conversions,
    COUNT(DISTINCT acv.id) FILTER (WHERE acv.timestamp > NOW() - INTERVAL '24 hours') as conversions_24h,
    COUNT(DISTINCT acv.id) FILTER (WHERE acv.timestamp > NOW() - INTERVAL '7 days') as conversions_7d,
    COUNT(DISTINCT acv.id) FILTER (WHERE acv.timestamp > NOW() - INTERVAL '30 days') as conversions_30d,
    
    -- Calculated metrics
    CASE 
        WHEN COUNT(DISTINCT ai.id) > 0 
        THEN (COUNT(DISTINCT ac.id)::DECIMAL / COUNT(DISTINCT ai.id)) * 100 
        ELSE 0 
    END as ctr_percentage,
    
    CASE 
        WHEN COUNT(DISTINCT ac.id) > 0 
        THEN (COUNT(DISTINCT acv.id)::DECIMAL / COUNT(DISTINCT ac.id)) * 100 
        ELSE 0 
    END as conversion_rate_percentage,
    
    CASE 
        WHEN COUNT(DISTINCT ac.id) > 0 
        THEN a.currentSpend / COUNT(DISTINCT ac.id) 
        ELSE 0 
    END as cost_per_click,
    
    a.createdAt,
    a.updatedAt

FROM "Advertisement" a
LEFT JOIN "AdImpression" ai ON a.id = ai."adId"
LEFT JOIN "AdClick" ac ON a.id = ac."adId"
LEFT JOIN "AdConversion" acv ON a.id = acv."adId"
GROUP BY a.id, a.name, a.type, a.status, a.advertiserId, a.currentSpend, a.createdAt, a.updatedAt;

-- Index on the materialized view
CREATE UNIQUE INDEX "AdPerformanceStats_ad_id_idx" ON "AdPerformanceStats" ("ad_id");
CREATE INDEX "AdPerformanceStats_advertiserId_idx" ON "AdPerformanceStats" ("advertiserId");
CREATE INDEX "AdPerformanceStats_ctr_idx" ON "AdPerformanceStats" ("ctr_percentage" DESC);
CREATE INDEX "AdPerformanceStats_conversions_idx" ON "AdPerformanceStats" ("total_conversions" DESC);

-- ============================================================================
-- PART 7: CREATE FUNCTIONS FOR AD MANAGEMENT
-- ============================================================================

-- Function to refresh ad performance stats
CREATE OR REPLACE FUNCTION refresh_ad_performance_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY "AdPerformanceStats";
END;
$$ LANGUAGE plpgsql;

-- Function to get active ads for placement
CREATE OR REPLACE FUNCTION get_active_ads_for_placement(
    placement_type TEXT,
    user_location TEXT DEFAULT NULL,
    user_skills TEXT[] DEFAULT NULL
)
RETURNS TABLE(
    ad_id TEXT,
    ad_name TEXT,
    content JSONB,
    priority INTEGER,
    bid_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.content,
        a.priority,
        (a.bidding->>'bidAmount')::DECIMAL
    FROM "Advertisement" a
    WHERE a.status = 'active'
        AND a.type = placement_type
        AND (a.schedule->>'startDate')::TIMESTAMP <= NOW()
        AND (
            a.schedule->>'endDate' IS NULL 
            OR (a.schedule->>'endDate')::TIMESTAMP >= NOW()
        )
        -- Add targeting logic here based on user_location and user_skills
    ORDER BY a.priority DESC, (a.bidding->>'bidAmount')::DECIMAL DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to record ad impression
CREATE OR REPLACE FUNCTION record_ad_impression(
    p_ad_id TEXT,
    p_user_id TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_page TEXT DEFAULT NULL,
    p_position TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    impression_id TEXT;
BEGIN
    -- Generate UUID for impression
    impression_id := gen_random_uuid()::TEXT;
    
    -- Insert impression record
    INSERT INTO "AdImpression" (
        id, "adId", "userId", "sessionId", "userAgent", 
        "ipAddress", referrer, page, position
    ) VALUES (
        impression_id, p_ad_id, p_user_id, p_session_id, 
        p_user_agent, p_ip_address, p_referrer, p_page, p_position
    );
    
    -- Update ad impression count
    UPDATE "Advertisement" 
    SET impressions = impressions + 1,
        "updatedAt" = NOW()
    WHERE id = p_ad_id;
    
    RETURN impression_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record ad click
CREATE OR REPLACE FUNCTION record_ad_click(
    p_ad_id TEXT,
    p_impression_id TEXT DEFAULT NULL,
    p_user_id TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_target_url TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    click_id TEXT;
    bid_amount DECIMAL;
BEGIN
    -- Generate UUID for click
    click_id := gen_random_uuid()::TEXT;
    
    -- Get bid amount for cost calculation
    SELECT (bidding->>'bidAmount')::DECIMAL INTO bid_amount
    FROM "Advertisement" 
    WHERE id = p_ad_id;
    
    -- Insert click record
    INSERT INTO "AdClick" (
        id, "adId", "impressionId", "userId", "sessionId", "targetUrl"
    ) VALUES (
        click_id, p_ad_id, p_impression_id, p_user_id, p_session_id, p_target_url
    );
    
    -- Update ad click count and spend (for CPC ads)
    UPDATE "Advertisement" 
    SET clicks = clicks + 1,
        "currentSpend" = CASE 
            WHEN (bidding->>'type') = 'cpc' 
            THEN "currentSpend" + COALESCE(bid_amount, 0)
            ELSE "currentSpend"
        END,
        "updatedAt" = NOW()
    WHERE id = p_ad_id;
    
    RETURN click_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 8: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update advertisement updatedAt timestamp
CREATE OR REPLACE FUNCTION update_advertisement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER advertisement_update_timestamp
    BEFORE UPDATE ON "Advertisement"
    FOR EACH ROW
    EXECUTE FUNCTION update_advertisement_timestamp();

-- ============================================================================
-- PART 9: INSERT SAMPLE DATA FOR TESTING
-- ============================================================================

-- Note: This would be populated with real data in production
-- Sample advertisement for testing (commented out for production)
/*
INSERT INTO "Advertisement" (
    id, name, type, status, content, targeting, bidding, schedule, "advertiserId"
) VALUES (
    gen_random_uuid()::TEXT,
    'Sample Tech Job Ad',
    'featured_job',
    'active',
    '{"title": "Software Engineer", "description": "Join our amazing team!", "ctaText": "Apply Now", "ctaUrl": "https://example.com/apply"}',
    '{"cities": ["San Francisco", "New York"], "skills": ["JavaScript", "React"]}',
    '{"type": "cpc", "bidAmount": 2.50, "dailyBudget": 100}',
    '{"startDate": "2025-01-27T00:00:00Z", "endDate": "2025-02-27T00:00:00Z"}',
    (SELECT id FROM "User" WHERE role = 'employer' LIMIT 1)
);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Refresh the performance stats view
SELECT refresh_ad_performance_stats();

COMMENT ON TABLE "Advertisement" IS 'Comprehensive advertisement system with targeting, bidding, and performance tracking';
COMMENT ON TABLE "AdImpression" IS 'Tracks when ads are displayed to users';
COMMENT ON TABLE "AdClick" IS 'Tracks when users click on ads';
COMMENT ON TABLE "AdConversion" IS 'Tracks when ad clicks result in desired actions';
COMMENT ON MATERIALIZED VIEW "AdPerformanceStats" IS 'Pre-calculated performance metrics for advertisements'; 