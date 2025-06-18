import { ConversationIntent, ConversationContext, Message } from './types';

export class ChatbotPrompts {
  /**
   * Base system prompt for all conversations
   */
  static getBasePrompt(): string {
    return `You're Rust - a local job guy who knows the 209 area inside and out. You've lived in Tracy, worked in Stockton, and know which Modesto companies are actually worth your time. You help people find work without all the corporate BS.

PERSONALITY & TONE:
- Talk like you're texting a friend who asked for job advice
- Skip the formal stuff - be direct but helpful
- Use "you" and "I" naturally
- Keep responses 2-3 sentences max unless they ask for details
- Show you actually know the local scene (not just generic advice)
- Be real about what jobs are like - don't oversell garbage positions

YOUR 209 EXPERTISE:
- Stockton: Port jobs, Amazon warehouses, Delta College area
- Modesto: Gallo, Foster Farms, healthcare at Memorial
- Lodi: Wine country, ag tech, decent commute to Sac
- Tracy: Tesla parts, Amazon, Bay Area commuter town
- Manteca: Distribution hub central

LOCAL REAL TALK:
- Cost of living here is way better than Bay Area
- Commuting to SF/Oakland sucks but pays more
- Local jobs are getting better but still limited
- Agriculture and logistics dominate
- Healthcare always hiring

CONVERSATION STYLE:
- Answer what they actually asked
- Skip the corporate cheerleader routine
- Give them real options, not just what sounds good
- If a job/company sucks, be honest about it
- Focus on what they can actually do next

Remember: You're the local connection they can't get from big job sites. Be useful, not chatty.`;
  }

  /**
   * Get context-aware system prompt based on conversation intent
   */
  static getContextualPrompt(
    intent: ConversationIntent,
    context?: ConversationContext
  ): string {
    const basePrompt = this.getBasePrompt();

    switch (intent) {
      case 'job_search':
        return `${basePrompt}

RIGHT NOW: They want jobs. Help them find actual opportunities.
- Ask what kind of work they want (if unclear)
- Show them real jobs that match
- Be honest about what skills they need
- Give them next steps to apply

${this.getContextualInfo(context)}`;

      case 'company_info':
        return `${basePrompt}

RIGHT NOW: They want the real deal on a company.
- Give them the straight scoop - culture, pay, what it's really like
- Skip the marketing fluff
- Tell them if it's worth applying to

${this.getContextualInfo(context)}`;

      case 'career_guidance':
        return `${basePrompt}

RIGHT NOW: They need career direction.
- Be real about what paths actually work in the 209
- Tell them what skills will get them hired
- Don't waste their time on pipe dreams

${this.getContextualInfo(context)}`;

      case 'application_help':
        return `${basePrompt}

CURRENT TASK: Application Assistance
You're helping with job applications and interview prep. Focus on:
- Resume review and optimization tips
- Cover letter writing guidance
- Interview preparation strategies
- Application tracking and follow-up
- Salary negotiation advice
- Portfolio and work sample guidance

${this.getContextualInfo(context)}`;

      case 'market_insights':
        return `${basePrompt}

CURRENT TASK: Market Analysis
You're providing job market insights and trends. Focus on:
- Salary ranges and compensation analysis
- Industry growth and demand trends
- Geographic job market conditions
- Skills in demand and emerging technologies
- Employment statistics and projections
- Market comparison across locations/industries

${this.getContextualInfo(context)}`;

      case 'job_comparison':
        return `${basePrompt}

CURRENT TASK: Job Comparison
You're helping compare different job opportunities. Focus on:
- Side-by-side comparison of job details
- Pros and cons analysis
- Compensation and benefits comparison
- Company culture and growth comparison
- Career progression opportunities
- Decision-making framework

${this.getContextualInfo(context)}`;

      default:
        return `${basePrompt}

RIGHT NOW: Just talking - figure out how to help them.
- What do they actually need?
- Point them toward jobs if that's what they want
- Keep it simple and useful

${this.getContextualInfo(context)}`;
    }
  }

  /**
   * Generate contextual information to include in prompts
   */
  private static getContextualInfo(context?: ConversationContext): string {
    if (!context) return '';

    let contextInfo = '\nCONTEXT INFORMATION:\n';

    // User profile information
    if (context.context.userProfile) {
      const profile = context.context.userProfile;
      contextInfo += `User Profile:
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Experience Level: ${profile.experience || 'Not specified'}
- Location: ${profile.location || 'Not specified'}
- Preferred Job Types: ${profile.preferences?.jobTypes?.join(', ') || 'Not specified'}
- Remote Work: ${profile.preferences?.remoteWork ? 'Yes' : 'Not specified'}
- Salary Range: ${profile.preferences?.salaryRange ? `$${profile.preferences.salaryRange.min}-$${profile.preferences.salaryRange.max}` : 'Not specified'}
`;
    }

    // Recent job search context
    if (context.context.lastJobSearch) {
      const search = context.context.lastJobSearch;
      contextInfo += `\nRecent Job Search:
- Query: "${search.query}"
- Results Found: ${search.results}
- Search Date: ${search.timestamp.toLocaleDateString()}
`;
    }

    // Current jobs in conversation
    if (context.context.currentJobs && context.context.currentJobs.length > 0) {
      contextInfo += `\nJobs Being Discussed:
${context.context.currentJobs
  .map(job => `- ${job.title} at ${job.company} (${job.location})`)
  .join('\n')}
`;
    }

    // Target companies
    if (
      context.context.targetCompanies &&
      context.context.targetCompanies.length > 0
    ) {
      contextInfo += `\nCompanies of Interest: ${context.context.targetCompanies.join(', ')}
`;
    }

    // Conversation history summary
    if (context.messages.length > 0) {
      const userMessages = context.messages.filter(
        m => m.role === 'user'
      ).length;
      contextInfo += `\nConversation: ${userMessages} user messages, started ${context.metadata.startedAt.toLocaleDateString()}
`;
    }

    return contextInfo;
  }

  /**
   * Get intent classification prompt for analyzing user messages, now with conversation history.
   */
  static getIntentClassificationPrompt(
    userMessage: string,
    conversationHistory?: Message[]
  ): string {
    let historyStr = '';
    if (conversationHistory && conversationHistory.length > 0) {
      historyStr = '\n\nRECENT CONVERSATION HISTORY (for context):\n';
      // Take last 3 messages, excluding the current user message if it's already in history
      const relevantHistory = conversationHistory.slice(-4); // Get a bit more in case current is last
      relevantHistory.forEach(msg => {
        if (msg.content !== userMessage) {
          // Avoid duplicating the current message
          historyStr += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        }
      });
    }

    return `Analyze the LATEST USER MESSAGE below and classify its primary intent, considering the RECENT CONVERSATION HISTORY if provided. Choose from these options:

INTENTS:
- job_search: Looking for job opportunities, searching for roles, asking about specific job details.
- company_info: Asking about specific companies, their culture, benefits, hiring process, news, etc.
- career_guidance: Seeking career advice, skill development, career planning, education.
- application_help: Help with resumes, cover letters, interview preparation, application process itself.
- market_insights: Questions about salaries, industry trends, job market conditions, demand for skills.
- job_comparison: Explicitly asking to compare two or more job offers or opportunities.
- general_chat: Greetings, chit-chat, thanks, or unclear/meta-conversation intent (e.g., "what can you do?").
${historyStr}
LATEST USER MESSAGE: "${userMessage}"

Respond with only the intent name (e.g., "job_search"). No explanation needed. If the user is asking to compare jobs, use "job_comparison". If asking about a company, use "company_info". If asking about a specific job's details, use "job_search".`;
  }

  /**
   * Get prompt for generating follow-up suggestions
   */
  static getFollowUpPrompt(
    intent: ConversationIntent,
    context?: ConversationContext
  ): string {
    const basePrompt = this.getBasePrompt();
    let historyContext = '';
    if (context && context.messages.length > 0) {
      historyContext = '\n\nPrevious turn:\n';
      const lastMessage = context.messages[context.messages.length - 1];
      historyContext += `${lastMessage.role === 'user' ? 'User' : 'Assistant'}: ${lastMessage.content}\n`;
      if (context.messages.length > 1) {
        const secondLastMessage = context.messages[context.messages.length - 2];
        historyContext += `${secondLastMessage.role === 'user' ? 'User' : 'Assistant'}: ${secondLastMessage.content}\n`;
      }
    }

    return `${basePrompt}

CURRENT INTENT: ${intent}
${this.getContextualInfo(context)}${historyContext}
Based on the current intent and conversation context, suggest 2-3 concise and relevant follow-up questions or actions the user might want to take next. The suggestions should be natural continuations of the dialogue. For example, if the user just received job search results, a good suggestion might be "Tell me more about the first job" or "How do I apply for these roles?". If they asked about company culture, suggest "What are their benefits like?" or "Show me jobs at this company".

Format your response as a JSON array of strings. For example: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
Ensure the suggestions are directly related to the current topic and help the user explore further or take action.`;
  }
}
