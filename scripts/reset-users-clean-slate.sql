-- 209 Works: Clean Slate User Reset
-- This script deletes all existing users and prepares for fresh admin accounts

-- WARNING: This will delete ALL user data. Use only for clean production start.

BEGIN;

-- Delete all user-related data in correct order (respecting foreign keys)

-- 1. Delete applications first (references users and jobs)
DELETE FROM applications;

-- 2. Delete saved jobs (references users and jobs)
DELETE FROM saved_jobs;

-- 3. Delete user profiles and related data
DELETE FROM job_seeker_profiles;
DELETE FROM employer_profiles;

-- 4. Delete chat history and conversations
DELETE FROM chat_conversations;
DELETE FROM chat_messages;

-- 5. Delete notifications
DELETE FROM notifications;

-- 6. Delete user sessions and auth data
DELETE FROM user_sessions;

-- 7. Delete credit transactions
DELETE FROM credit_transactions;

-- 8. Delete any analytics data tied to users
DELETE FROM user_analytics;
DELETE FROM behavioral_analytics;
DELETE FROM career_analytics;

-- 9. Finally delete users table
DELETE FROM users;

-- 10. Reset any auto-increment sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE applications_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE credit_transactions_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'Users deleted' as action, COUNT(*) as remaining_count FROM users
UNION ALL
SELECT 'Applications deleted' as action, COUNT(*) as remaining_count FROM applications
UNION ALL
SELECT 'Saved jobs deleted' as action, COUNT(*) as remaining_count FROM saved_jobs
UNION ALL
SELECT 'Job seeker profiles deleted' as action, COUNT(*) as remaining_count FROM job_seeker_profiles
UNION ALL
SELECT 'Employer profiles deleted' as action, COUNT(*) as remaining_count FROM employer_profiles
UNION ALL
SELECT 'Chat conversations deleted' as action, COUNT(*) as remaining_count FROM chat_conversations
UNION ALL
SELECT 'Notifications deleted' as action, COUNT(*) as remaining_count FROM notifications;

COMMIT;

-- Success message
SELECT 'Clean slate complete! All user accounts deleted. Ready for fresh admin accounts.' as status;
