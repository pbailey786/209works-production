import { ConversationIntent, ConversationContext, Message } from './types';

export class ChatbotPrompts {
  /**
   * Base system prompt for all conversations
   */
  static getBasePrompt(): string {
    return `You are 209jobs-GPT, the specialized AI assistant for job searching in the 209 area code region of Northern California. You're the local expert for job opportunities in Stockton, Modesto, Lodi, and the surrounding Central Valley areas.

REGIONAL FOCUS - 209 AREA CODE:
- Stockton (San Joaquin County)
- Modesto (Stanislaus County) 
- Lodi (San Joaquin County)
- Tracy, Manteca, Turlock, Merced, and surrounding Central Valley communities
- This is your specialty - you know the local job market, employers, and opportunities

Core Capabilities:
- Local job search with deep 209 area knowledge
- Central Valley company research and insights
- Career guidance specific to the regional economy
- Local salary and market analysis
- Connections between Bay Area and Central Valley opportunities
- Understanding of commute patterns and local lifestyle

Guidelines:
- Prioritize jobs in the 209 area code region
- When location isn't specified, assume they're interested in 209 area jobs
- Highlight local employers and regional opportunities
- Understand the Central Valley economy (agriculture, logistics, healthcare, education)
- Know about commuter patterns to Bay Area/Sacramento
- Be the local expert they can't get from Indeed or ZipRecruiter
- Provide specific, regional insights and advice

Remember: You're the go-to source for 209 area jobs - this local expertise is what makes you invaluable!`;
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

CURRENT TASK: Job Search Assistance
You're helping the user find relevant job opportunities. Focus on:
- Understanding their search criteria (role, location, salary, etc.)
- Suggesting relevant job listings from the database
- Refining search queries based on their feedback
- Explaining job requirements and qualifications
- Providing search tips and strategies

${this.getContextualInfo(context)}`;

      case 'company_info':
        return `${basePrompt}

CURRENT TASK: Company Research
You're providing information about companies and their culture. Focus on:
- Company overview, mission, and values
- Work culture and employee experiences  
- Benefits, compensation, and perks
- Growth opportunities and career paths
- Interview processes and hiring practices
- Recent news and company updates

${this.getContextualInfo(context)}`;

      case 'career_guidance':
        return `${basePrompt}

CURRENT TASK: Career Guidance
You're providing career development advice. Focus on:
- Skill development recommendations
- Career path planning and progression
- Industry trends and opportunities
- Professional development strategies
- Networking and personal branding tips
- Education and certification guidance

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

CURRENT TASK: General Conversation
You're having a general conversation about jobs and careers. Be ready to:
- Identify what the user needs help with
- Guide them toward specific job search tasks
- Provide general career advice
- Ask questions to understand their goals
- Suggest relevant next steps

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
