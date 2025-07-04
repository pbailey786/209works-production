/**
 * AI Account Creation Prompts
 * 
 * Strategic prompts to encourage user registration for better job matching
 */

export interface AccountPromptContext {
  isLoggedIn: boolean;
  messageCount: number;
  hasFoundJobs: boolean;
  searchType: 'general' | 'specific' | 'repeat';
  lastPromptShown?: string;
}

export interface AccountPrompt {
  id: string;
  trigger: 'after_jobs' | 'after_search' | 'repeat_user' | 'detailed_search';
  message: string;
  ctaText: string;
  benefits: string[];
  urgency: 'low' | 'medium' | 'high';
}

export const ACCOUNT_PROMPTS: AccountPrompt[] = [
  {
    id: 'save_jobs',
    trigger: 'after_jobs',
    message: "I found some great matches for you! Want me to save these jobs so you can come back to them later?",
    ctaText: "Create Account to Save Jobs",
    benefits: [
      "Save job matches for later",
      "Get notified of new similar jobs",
      "Track your applications"
    ],
    urgency: 'medium'
  },
  {
    id: 'personalize',
    trigger: 'after_search',
    message: "I can give you much better job matches if I know more about your background and experience. Mind sharing your resume or work history?",
    ctaText: "Create Profile for Better Matches",
    benefits: [
      "AI analyzes your resume for perfect matches",
      "Skip jobs you're overqualified for",
      "Get salary insights based on your experience"
    ],
    urgency: 'high'
  },
  {
    id: 'job_alerts',
    trigger: 'repeat_user',
    message: "I notice you're looking for jobs regularly. I can watch for new openings that match what you're looking for and send you alerts.",
    ctaText: "Set Up Job Alerts",
    benefits: [
      "Automatic notifications for new jobs",
      "Daily/weekly digest of matches",
      "Be first to apply to new postings"
    ],
    urgency: 'medium'
  },
  {
    id: 'detailed_profile',
    trigger: 'detailed_search',
    message: "You're asking detailed questions about career fit and growth. I can give much more personalized advice if I understand your career goals and background better.",
    ctaText: "Build Your Career Profile",
    benefits: [
      "Career path recommendations",
      "Skill gap analysis",
      "Salary negotiation insights"
    ],
    urgency: 'high'
  }
];

/**
 * Determine which account prompt to show based on context
 */
export function getAccountPrompt(context: AccountPromptContext): AccountPrompt | null {
  if (context.isLoggedIn) return null;

  // Don't show prompts too frequently
  if (context.messageCount < 2) return null;

  // After finding jobs (high conversion opportunity)
  if (context.hasFoundJobs && context.messageCount >= 3) {
    return ACCOUNT_PROMPTS.find(p => p.id === 'save_jobs') || null;
  }

  // Detailed/specific searches indicate serious job seekers
  if (context.searchType === 'specific' && context.messageCount >= 4) {
    return ACCOUNT_PROMPTS.find(p => p.id === 'personalize') || null;
  }

  // Repeat visitors (multiple sessions/searches)
  if (context.searchType === 'repeat' && context.messageCount >= 3) {
    return ACCOUNT_PROMPTS.find(p => p.id === 'job_alerts') || null;
  }

  // Career-focused conversations
  if (context.messageCount >= 5) {
    return ACCOUNT_PROMPTS.find(p => p.id === 'detailed_profile') || null;
  }

  return null;
}

/**
 * Generate natural AI message that includes account prompt
 */
export function generateAccountPromptMessage(
  baseResponse: string, 
  prompt: AccountPrompt
): string {
  return `${baseResponse}

---

💡 **${prompt.message}**

**${prompt.ctaText}** and get:
${prompt.benefits.map(benefit => `• ${benefit}`).join('\n')}

[Sign up takes 30 seconds and it's free!]`;
}

/**
 * Check if user behavior indicates they should see account prompt
 */
export function shouldShowAccountPrompt(
  context: AccountPromptContext,
  lastShownTimestamp?: number
): boolean {
  // Don't show if already logged in
  if (context.isLoggedIn) return false;

  // Don't show too frequently (wait at least 5 minutes)
  if (lastShownTimestamp && Date.now() - lastShownTimestamp < 5 * 60 * 1000) {
    return false;
  }

  // Show based on engagement level and context
  const prompt = getAccountPrompt(context);
  return prompt !== null;
}