-- Enhanced Security System Database Schema Updates
-- This file contains the SQL migrations needed for the enhanced security middleware

-- 1. User Sessions Table for Enhanced Session Management
CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX IF NOT EXISTS "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");
CREATE INDEX IF NOT EXISTS "UserSession_ipAddress_idx" ON "UserSession"("ipAddress");
CREATE INDEX IF NOT EXISTS "UserSession_lastActivity_idx" ON "UserSession"("lastActivity");

-- 2. Audit Log Table for Security Event Tracking
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "event" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT 'general',
    
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "AuditLog_event_idx" ON "AuditLog"("event");
CREATE INDEX IF NOT EXISTS "AuditLog_ipAddress_idx" ON "AuditLog"("ipAddress");
CREATE INDEX IF NOT EXISTS "AuditLog_severity_idx" ON "AuditLog"("severity");
CREATE INDEX IF NOT EXISTS "AuditLog_category_idx" ON "AuditLog"("category");

-- 3. Security Events Table for Real-time Monitoring
CREATE TABLE IF NOT EXISTS "SecurityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "resource" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    
    CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SecurityEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SecurityEvent_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for security event monitoring
CREATE INDEX IF NOT EXISTS "SecurityEvent_type_idx" ON "SecurityEvent"("type");
CREATE INDEX IF NOT EXISTS "SecurityEvent_severity_idx" ON "SecurityEvent"("severity");
CREATE INDEX IF NOT EXISTS "SecurityEvent_timestamp_idx" ON "SecurityEvent"("timestamp");
CREATE INDEX IF NOT EXISTS "SecurityEvent_resolved_idx" ON "SecurityEvent"("resolved");
CREATE INDEX IF NOT EXISTS "SecurityEvent_ipAddress_idx" ON "SecurityEvent"("ipAddress");
CREATE INDEX IF NOT EXISTS "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- 4. Rate Limit Tracking Table
CREATE TABLE IF NOT EXISTS "RateLimitEntry" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "identifier" TEXT NOT NULL, -- IP address or user ID
    "endpoint" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "lastRequest" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE("identifier", "endpoint", "windowStart")
);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS "RateLimitEntry_identifier_idx" ON "RateLimitEntry"("identifier");
CREATE INDEX IF NOT EXISTS "RateLimitEntry_endpoint_idx" ON "RateLimitEntry"("endpoint");
CREATE INDEX IF NOT EXISTS "RateLimitEntry_windowEnd_idx" ON "RateLimitEntry"("windowEnd");
CREATE INDEX IF NOT EXISTS "RateLimitEntry_blocked_idx" ON "RateLimitEntry"("blocked");

-- 5. User Security Profile Enhancements
-- Add security-related fields to existing User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "securityQuestions" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trustedDevices" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "securityAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginNotifications" BOOLEAN NOT NULL DEFAULT true;

-- 6. API Keys Table for Enhanced API Authentication
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL UNIQUE,
    "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "rateLimitWindow" INTEGER NOT NULL DEFAULT 3600, -- seconds
    "lastUsed" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipWhitelist" JSONB DEFAULT '[]'::jsonb,
    "environment" TEXT NOT NULL DEFAULT 'production',
    
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for API key management
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");
CREATE INDEX IF NOT EXISTS "ApiKey_isActive_idx" ON "ApiKey"("isActive");
CREATE INDEX IF NOT EXISTS "ApiKey_expiresAt_idx" ON "ApiKey"("expiresAt");
CREATE INDEX IF NOT EXISTS "ApiKey_environment_idx" ON "ApiKey"("environment");

-- 7. Permission System Tables
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isSystemPermission" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "UserPermission" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    
    PRIMARY KEY ("userId", "permissionId"),
    CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPermission_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 8. Security Configuration Table
CREATE TABLE IF NOT EXISTS "SecurityConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT "SecurityConfig_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Insert default security configuration
INSERT INTO "SecurityConfig" ("id", "config") VALUES (
    'global',
    '{
        "sessionTimeout": 1800,
        "maxLoginAttempts": 5,
        "lockoutDuration": 900,
        "requireMfaForAdmin": true,
        "passwordMinLength": 8,
        "passwordRequireSpecialChars": true,
        "passwordRequireNumbers": true,
        "passwordRequireUppercase": true,
        "passwordRequireLowercase": true,
        "passwordExpiryDays": 90,
        "auditLogRetentionDays": 365,
        "securityEventRetentionDays": 90,
        "rateLimitEnabled": true,
        "csrfProtectionEnabled": true,
        "securityHeadersEnabled": true
    }'::jsonb
) ON CONFLICT ("id") DO NOTHING;

-- 9. Insert Default Permissions
INSERT INTO "Permission" ("id", "name", "description", "category", "isSystemPermission") VALUES
    ('user:read', 'Read User Data', 'View user profiles and basic information', 'user', true),
    ('user:write', 'Write User Data', 'Create and update user profiles', 'user', true),
    ('user:delete', 'Delete User Data', 'Delete user accounts and data', 'user', true),
    ('job:read', 'Read Job Data', 'View job postings and details', 'job', true),
    ('job:write', 'Write Job Data', 'Create and update job postings', 'job', true),
    ('job:delete', 'Delete Job Data', 'Delete job postings', 'job', true),
    ('job:moderate', 'Moderate Jobs', 'Review and moderate job postings', 'job', true),
    ('application:read', 'Read Applications', 'View job applications', 'application', true),
    ('application:write', 'Write Applications', 'Submit and update job applications', 'application', true),
    ('application:delete', 'Delete Applications', 'Delete job applications', 'application', true),
    ('admin:read', 'Admin Read Access', 'View administrative data and settings', 'admin', true),
    ('admin:write', 'Admin Write Access', 'Modify administrative settings', 'admin', true),
    ('system:config', 'System Configuration', 'Modify system-wide configuration', 'system', true),
    ('analytics:read', 'Read Analytics', 'View analytics and reports', 'analytics', true),
    ('analytics:write', 'Write Analytics', 'Create and modify analytics reports', 'analytics', true)
ON CONFLICT ("id") DO NOTHING;

-- 10. Assign Default Role Permissions
-- Jobseeker permissions
INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES
    ('jobseeker', 'user:read'),
    ('jobseeker', 'user:write'),
    ('jobseeker', 'job:read'),
    ('jobseeker', 'application:read'),
    ('jobseeker', 'application:write')
ON CONFLICT DO NOTHING;

-- Employer permissions
INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES
    ('employer', 'user:read'),
    ('employer', 'user:write'),
    ('employer', 'job:read'),
    ('employer', 'job:write'),
    ('employer', 'job:delete'),
    ('employer', 'application:read'),
    ('employer', 'analytics:read')
ON CONFLICT DO NOTHING;

-- Admin permissions (all permissions)
INSERT INTO "RolePermission" ("roleId", "permissionId") 
SELECT 'admin', "id" FROM "Permission" WHERE "isSystemPermission" = true
ON CONFLICT DO NOTHING;

-- 11. Create Views for Security Monitoring
CREATE OR REPLACE VIEW "SecurityDashboard" AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE severity = 'high') as high_severity,
    COUNT(*) FILTER (WHERE severity = 'medium') as medium_severity,
    COUNT(*) FILTER (WHERE severity = 'low') as low_severity,
    COUNT(DISTINCT "ipAddress") as unique_ips,
    COUNT(DISTINCT "userId") as unique_users
FROM "SecurityEvent"
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

CREATE OR REPLACE VIEW "ActiveSessions" AS
SELECT 
    s."id",
    s."userId",
    u."email",
    u."role",
    s."ipAddress",
    s."lastActivity",
    s."createdAt",
    EXTRACT(EPOCH FROM (NOW() - s."lastActivity")) / 60 as minutes_inactive
FROM "UserSession" s
JOIN "User" u ON s."userId" = u."id"
WHERE s."expiresAt" > NOW() AND s."isActive" = true
ORDER BY s."lastActivity" DESC;

CREATE OR REPLACE VIEW "SuspiciousActivity" AS
SELECT 
    "ipAddress",
    COUNT(*) as event_count,
    COUNT(DISTINCT "userId") as affected_users,
    MAX("timestamp") as last_event,
    ARRAY_AGG(DISTINCT "type") as event_types
FROM "SecurityEvent"
WHERE timestamp >= NOW() - INTERVAL '1 hour'
    AND severity IN ('high', 'medium')
GROUP BY "ipAddress"
HAVING COUNT(*) >= 5
ORDER BY event_count DESC;

-- 12. Create Functions for Security Operations
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "UserSession" 
    WHERE "expiresAt" < NOW() OR "lastActivity" < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    retention_days INTEGER;
BEGIN
    SELECT (config->>'auditLogRetentionDays')::INTEGER 
    INTO retention_days 
    FROM "SecurityConfig" 
    WHERE id = 'global';
    
    IF retention_days IS NULL THEN
        retention_days := 365;
    END IF;
    
    DELETE FROM "AuditLog" 
    WHERE "timestamp" < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    retention_days INTEGER;
BEGIN
    SELECT (config->>'securityEventRetentionDays')::INTEGER 
    INTO retention_days 
    FROM "SecurityConfig" 
    WHERE id = 'global';
    
    IF retention_days IS NULL THEN
        retention_days := 90;
    END IF;
    
    DELETE FROM "SecurityEvent" 
    WHERE "timestamp" < NOW() - (retention_days || ' days')::INTERVAL
        AND "resolved" = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 13. Create Triggers for Automatic Security Monitoring
CREATE OR REPLACE FUNCTION log_failed_login()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."failedLoginAttempts" > OLD."failedLoginAttempts" THEN
        INSERT INTO "SecurityEvent" ("type", "severity", "userId", "ipAddress", "details")
        VALUES (
            'LOGIN_FAILURE',
            CASE 
                WHEN NEW."failedLoginAttempts" >= 3 THEN 'high'
                ELSE 'medium'
            END,
            NEW."id",
            COALESCE(NEW."lastLoginIp", 'unknown'),
            jsonb_build_object(
                'attempts', NEW."failedLoginAttempts",
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_failed_login_trigger
    AFTER UPDATE ON "User"
    FOR EACH ROW
    WHEN (NEW."failedLoginAttempts" > OLD."failedLoginAttempts")
    EXECUTE FUNCTION log_failed_login();

-- 14. Create Indexes for Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_timestamp_desc_idx" ON "AuditLog"("timestamp" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SecurityEvent_timestamp_desc_idx" ON "SecurityEvent"("timestamp" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "UserSession_lastActivity_desc_idx" ON "UserSession"("lastActivity" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_lastLoginAt_idx" ON "User"("lastLoginAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_failedLoginAttempts_idx" ON "User"("failedLoginAttempts");

-- 15. Grant Permissions
-- Grant necessary permissions to application user
-- Note: Replace 'app_user' with your actual application database user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user; 