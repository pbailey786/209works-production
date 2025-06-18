import { openai } from '@/lib/openai';
import { prisma } from '@/app/api/auth/prisma';
import { ConversationManager } from './manager';
import { ChatbotPrompts } from './prompts';
import {
  CompanyKnowledgeService,
  CompanyInfo,
} from '@/lib/knowledge/company-knowledge';
import { LocalKnowledgeService } from './local-knowledge';
import {
  ConversationIntent,
  ChatbotResponse,
  ConversationContext,
  JobContext,
  Message,
} from './types';

interface ChatContextualData {
  jobRecommendations?: JobContext[];
  companyInfo?:
    | CompanyInfo
    | {
        name: string;
        description?: string;
        hasKnowledgeBase?: boolean;
        knowledgeEntries?: any[];
      };
  followUpActions?: any[];
}

export class ChatbotService {
  /**
   * Process a user message and generate a response
   */
  static async processMessage(
    sessionId: string,
    userMessage: string,
    userId?: string
  ): Promise<ChatbotResponse> {
    const startTime = Date.now();

    // Get or create conversation session
    let session = ConversationManager.getSession(sessionId);
    if (!session) {
      session = ConversationManager.createSession(userId);
    }

    // Add user message to conversation - timestamp handled by ConversationManager
    ConversationManager.addMessage(session.sessionId, {
      role: 'user',
      content: userMessage,
      metadata: { userId, searchQuery: userMessage },
    });

    // Classify intent
    const intent = await this.classifyIntent(userMessage, session.context);
    ConversationManager.updateIntent(session.sessionId, intent);

    // Generate response based on intent
    const response = await this.generateResponse(
      session.sessionId,
      userMessage,
      intent
    );

    // Add assistant response to conversation - timestamp handled by ConversationManager
    ConversationManager.addMessage(session.sessionId, {
      role: 'assistant',
      content: response.reply,
      // metadata: {} // No specific metadata needed here for assistant now
    });

    // Calculate response metadata
    const responseTime = Date.now() - startTime;
    response.metadata = {
      ...response.metadata,
      responseTime,
    };

    return response;
  }

  /**
   * Classify user intent using GPT, now with conversation history.
   */
  private static async classifyIntent(
    userMessage: string,
    context: ConversationContext // Full ConversationContext which includes messages
  ): Promise<ConversationIntent> {
    try {
      // Pass the user message and the last few messages from context for history
      const relevantHistory = context.messages.slice(-4); // Get last 3 messages + current (if it was already added)
      const prompt = ChatbotPrompts.getIntentClassificationPrompt(
        userMessage,
        relevantHistory
      );

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo', // Consider a faster/cheaper model if latency/cost is an issue for intent
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20, // Increased slightly to ensure intent name isn't truncated
        temperature: 0.1, // Keep low for deterministic classification
      });

      let intent = completion.choices[0]?.message?.content
        ?.trim()
        .toLowerCase() as ConversationIntent;

      // Minor cleanup: sometimes model might add quotes or periods.
      intent = intent.replace(/[".]/g, '') as ConversationIntent;

      const validIntents: ConversationIntent[] = [
        'job_search',
        'company_info',
        'career_guidance',
        'application_help',
        'market_insights',
        'job_comparison',
        'general_chat',
      ];

      return validIntents.includes(intent) ? intent : 'general_chat';
    } catch (error) {
      console.error('Intent classification error:', error);
      return 'general_chat'; // Fallback to general_chat on error
    }
  }

  /**
   * Generate response based on intent and context
   */
  private static async generateResponse(
    sessionId: string,
    userMessage: string,
    intent: ConversationIntent
  ): Promise<ChatbotResponse> {
    const session = ConversationManager.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get contextual system prompt
    const systemPrompt = ChatbotPrompts.getContextualPrompt(
      intent,
      session.context
    );

    // Prepare conversation history
    const conversationHistory = this.prepareConversationHistory(
      session.context.messages
    );

    // Handle intent-specific logic
    let contextualData: ChatContextualData = {};
    switch (intent) {
      case 'job_search':
        contextualData = await this.handleJobSearch(
          userMessage,
          session.context
        );
        break;
      case 'company_info':
        contextualData = await this.handleCompanyInfo(
          userMessage,
          session.context
        );
        break;
      case 'job_comparison':
        contextualData = await this.handleJobComparison(
          userMessage,
          session.context
        );
        break;
      default:
        // General conversation handling
        break;
    }

    // Generate AI response
    const aiResponse = await this.generateAIResponse(
      systemPrompt,
      conversationHistory,
      userMessage,
      contextualData
    );

    // Generate follow-up suggestions
    const suggestions = await this.generateSuggestions(intent, session.context);

    return {
      reply: aiResponse,
      intent,
      suggestions,
      jobRecommendations: contextualData.jobRecommendations,
      companyInfo: contextualData.companyInfo as any,
      followUpActions: contextualData.followUpActions,
    };
  }

  /**
   * Handle job search intent - search for relevant jobs
   */
  private static async handleJobSearch(
    userMessage: string,
    context: ConversationContext
  ): Promise<ChatContextualData> {
    try {
      // Extract search parameters from natural language
      const searchParams = await this.extractJobSearchParams(
        userMessage,
        context
      );

      // Search for jobs using existing search functionality
      const jobs = await this.searchJobs(searchParams);

      // Convert to JobContext format
      const jobRecommendations: JobContext[] = jobs.slice(0, 5).map(job => ({
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        requirements: job.requirements,
        benefits: job.benefits,
      }));

      // Update conversation context
      ConversationManager.updateSearchContext(
        context.sessionId,
        searchParams.query || userMessage,
        searchParams,
        jobs.length
      );

      return {
        jobRecommendations,
        followUpActions: [
          {
            type: 'search_jobs',
            data: { query: searchParams.query, totalResults: jobs.length },
          },
        ],
      };
    } catch (error) {
      console.error('Job search error:', error);
      return { jobRecommendations: [] };
    }
  }

  /**
   * Handle company information requests - Enhanced with Company Knowledge Base
   */
  private static async handleCompanyInfo(
    userMessage: string,
    context: ConversationContext
  ): Promise<ChatContextualData> {
    const companyName =
      CompanyKnowledgeService.extractCompanyName(userMessage) ||
      this.extractCompanyName(userMessage);

    if (!companyName) {
      return {}; // No company name found
    }

    const companyInfoData =
      await CompanyKnowledgeService.getCompanyInfo(companyName);
    const companyJobs = await this.getCompanyJobs(companyName); // companyName is confirmed not null here
    const jobRecommendations = companyJobs.slice(0, 3).map(job => ({
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
    }));

    if (companyInfoData) {
      let relevantKnowledge = companyInfoData.knowledgeEntries;
      const query = userMessage.toLowerCase();
      if (query.includes('culture') || query.includes('work environment')) {
        relevantKnowledge = relevantKnowledge.filter(
          entry =>
            entry.category === 'culture' ||
            entry.category === 'work_environment'
        );
      } else if (query.includes('benefit') || query.includes('perk')) {
        relevantKnowledge = relevantKnowledge.filter(
          entry => entry.category === 'benefits' || entry.category === 'perks'
        );
      } else if (
        query.includes('interview') ||
        query.includes('hiring') ||
        query.includes('process')
      ) {
        relevantKnowledge = relevantKnowledge.filter(
          entry =>
            entry.category === 'hiring_process' ||
            entry.category === 'interview_process'
        );
      } else if (
        query.includes('salary') ||
        query.includes('compensation') ||
        query.includes('pay')
      ) {
        relevantKnowledge = relevantKnowledge.filter(
          entry => entry.category === 'compensation'
        );
      }

      // Construct a more specific type for companyInfo when companyInfoData exists
      const fullCompanyInfo: CompanyInfo & {
        knowledgeEntries: any[];
        hasKnowledgeBase: boolean;
      } = {
        ...companyInfoData,
        knowledgeEntries: relevantKnowledge.slice(0, 5),
        hasKnowledgeBase: companyInfoData.knowledgeEntries.length > 0,
      };

      return {
        companyInfo: fullCompanyInfo,
        jobRecommendations,
      };
    } else {
      // Fallback when companyInfoData is null, but companyName is valid
      return {
        companyInfo: {
          name: companyName, // companyName is not null here
          description: `${companyName} posts job opportunities on 209jobs. We can help you learn more about their current openings.`,
          hasKnowledgeBase: false,
        },
        jobRecommendations,
      };
    }
  }

  /**
   * Handle job comparison requests
   */
  private static async handleJobComparison(
    userMessage: string,
    context: ConversationContext
  ): Promise<ChatContextualData> {
    // Use jobs from current conversation context
    const currentJobs = context.context.currentJobs || [];

    return {
      jobRecommendations: currentJobs,
      followUpActions: [
        {
          type: 'learn_more',
          data: { action: 'compare', jobCount: currentJobs.length },
        },
      ],
    };
  }

  /**
   * Generate AI response using OpenAI
   */
  private static async generateAIResponse(
    systemPrompt: string,
    conversationHistory: Message[],
    userMessage: string,
    contextualData: ChatContextualData
  ): Promise<string> {
    try {
      // Extract local references from user message
      const localReferences =
        LocalKnowledgeService.extractLocalReferences(userMessage);

      // Get local context if relevant
      let localContext = '';
      if (localReferences.length > 0) {
        localContext = '\n\nLocal 209 Area Context:\n';
        localReferences.forEach(ref => {
          const areaInfo = LocalKnowledgeService.getAreaInfo(ref);
          if (areaInfo) {
            localContext += `- ${ref}: Major employers include ${areaInfo.majorEmployers.slice(0, 3).join(', ')}\n`;
          }
        });
      }

      // Add job recommendations context if available
      let jobContext = '';
      if (
        contextualData.jobRecommendations &&
        contextualData.jobRecommendations.length > 0
      ) {
        jobContext = '\n\nCurrent Job Recommendations:\n';
        contextualData.jobRecommendations.slice(0, 3).forEach((job, index) => {
          jobContext += `${index + 1}. ${job.title} at ${job.company} (${job.location})\n`;
        });
      }

      // Add company info context if available
      let companyContext = '';
      if (contextualData.companyInfo) {
        companyContext = `\n\nCompany Information:\n- ${contextualData.companyInfo.name}`;
        if (contextualData.companyInfo.description) {
          companyContext += `\n- ${contextualData.companyInfo.description}`;
        }
      }

      const messages = [
        {
          role: 'system',
          content: systemPrompt + localContext + jobContext + companyContext,
        },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: messages as any,
        max_tokens: 200, // Shorter responses for text-like conversation
        temperature: 0.8, // Slightly more natural/casual
      });

      return (
        completion.choices[0]?.message?.content ||
        'I apologize, but I cannot provide a response at this time.'
      );
    } catch (error) {
      console.error('AI response generation error:', error);
      return 'I apologize, but I encountered an error while processing your request. Please try again.';
    }
  }

  /**
   * Generate follow-up suggestions based on intent and context
   */
  private static async generateSuggestions(
    intent: ConversationIntent,
    context: ConversationContext
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Get local-aware suggestions based on intent
    switch (intent) {
      case 'job_search':
        suggestions.push(
          'Show me more in Modesto',
          'Any healthcare jobs?',
          'What about logistics work?',
          'Remote options?'
        );
        break;

      case 'company_info':
        suggestions.push(
          'What about their pay?',
          'How do they treat people?',
          'Any other jobs there?',
          'Worth applying?'
        );
        break;

      case 'career_guidance':
        suggestions.push(
          'What skills should I learn?',
          'Stay local or commute?',
          'What pays better around here?',
          'How do I get started?'
        );
        break;

      case 'market_insights':
        suggestions.push(
          'What does that pay here?',
          'Better than Bay Area?',
          "What's hot right now?",
          'Where should I look?'
        );
        break;

      default:
        suggestions.push(
          'Show me jobs nearby',
          "What's hiring?",
          'Help me figure out my next move'
        );
    }

    // Add context-specific suggestions based on search history
    if (context.context.lastJobSearch) {
      const lastSearch = context.context.lastJobSearch;
      if (lastSearch.filters?.location) {
        const areaInfo = LocalKnowledgeService.getAreaInfo(
          lastSearch.filters.location
        );
        if (areaInfo) {
          suggestions.push(`Show me more opportunities in ${areaInfo.name}`);
          if (areaInfo.majorEmployers.length > 0) {
            suggestions.push(`Tell me about ${areaInfo.majorEmployers[0]}`);
          }
        }
      }
    }

    // Limit to 4 suggestions and ensure uniqueness
    return [...new Set(suggestions)].slice(0, 4);
  }

  /**
   * Extract job search parameters from natural language
   */
  private static async extractJobSearchParams(
    userMessage: string,
    context: ConversationContext
  ): Promise<any> {
    // Extract local references and get industry context
    const localReferences =
      LocalKnowledgeService.extractLocalReferences(userMessage);

    // Simple keyword extraction (enhanced with local knowledge)
    const params: any = {
      query: userMessage,
      limit: 10,
    };

    // Extract location if mentioned
    const locationMatch = userMessage.match(/in\s+([A-Za-z\s,]+)(?:\s|$)/i);
    if (locationMatch) {
      params.location = locationMatch[1].trim();
    }

    // Check for local area references
    if (localReferences.length > 0) {
      params.localArea = localReferences[0]; // Use first local reference
      const areaInfo = LocalKnowledgeService.getAreaInfo(localReferences[0]);
      if (areaInfo) {
        params.location = areaInfo.name;
        params.majorEmployers = areaInfo.majorEmployers;
        params.localIndustries = areaInfo.industries;
      }
    }

    // Extract industry-specific context
    const industryKeywords = [
      'healthcare',
      'logistics',
      'agriculture',
      'education',
      'manufacturing',
    ];
    const detectedIndustry = industryKeywords.find(industry =>
      userMessage.toLowerCase().includes(industry)
    );
    if (detectedIndustry) {
      params.industry = detectedIndustry;
      params.localJobContext = LocalKnowledgeService.getLocalJobContext(
        detectedIndustry,
        params.location
      );
    }

    // Extract remote preference
    if (/remote|work\s+from\s+home|wfh/i.test(userMessage)) {
      params.remote = true;
    }

    // Extract commute preferences
    if (/commute|drive|bay area|sacramento/i.test(userMessage)) {
      params.commuteAdvice = LocalKnowledgeService.getCommuteAdvice(
        params.location
      );
    }

    // DEFAULT TO 209 AREA CODE REGION if no location specified
    if (!params.location && !params.remote && !localReferences.length) {
      // Check user profile first
      if (context.context.userProfile?.location) {
        params.location = context.context.userProfile.location;
      } else {
        // Default to 209 area search
        params.location209 = true; // Special flag for 209 area search
        params.locationHint =
          '209 area (Stockton, Modesto, Lodi, Central Valley)';
      }
    }

    // Use user profile context if available
    if (context.context.userProfile) {
      const profile = context.context.userProfile;
      if (!params.location && profile.location) {
        params.location = profile.location;
      }
      if (profile.preferences?.remoteWork) {
        params.remote = profile.preferences.remoteWork;
      }
    }

    return params;
  }

  /**
   * Search jobs using existing search functionality with 209 area focus
   */
  private static async searchJobs(params: any): Promise<any[]> {
    const whereClause: any = {};

    // Handle 209 area code default search
    if (params.location209) {
      // Search for jobs in 209 area code cities
      whereClause.OR = [
        { location: { contains: 'Stockton', mode: 'insensitive' } },
        { location: { contains: 'Modesto', mode: 'insensitive' } },
        { location: { contains: 'Lodi', mode: 'insensitive' } },
        { location: { contains: 'Tracy', mode: 'insensitive' } },
        { location: { contains: 'Manteca', mode: 'insensitive' } },
        { location: { contains: 'Turlock', mode: 'insensitive' } },
        { location: { contains: 'Merced', mode: 'insensitive' } },
        { location: { contains: 'Central Valley', mode: 'insensitive' } },
        { location: { contains: '209', mode: 'insensitive' } },
      ];
    } else if (params.location) {
      whereClause.location = {
        contains: params.location,
        mode: 'insensitive',
      };
    }

    if (params.remote) {
      const remoteConditions = [
        { location: { contains: 'remote', mode: 'insensitive' } },
        { title: { contains: 'remote', mode: 'insensitive' } },
        { description: { contains: 'remote', mode: 'insensitive' } },
      ];

      if (whereClause.OR) {
        // Combine with existing location conditions
        whereClause.OR = [...whereClause.OR, ...remoteConditions];
      } else {
        whereClause.OR = remoteConditions;
      }
    }

    // Full-text search if query provided
    if (
      params.query &&
      !params.query.includes('Find me') &&
      !params.query.includes('Looking for')
    ) {
      const searchTerms = params.query
        .toLowerCase()
        .split(' ')
        .filter(
          (term: string) =>
            ![
              'find',
              'me',
              'looking',
              'for',
              'a',
              'job',
              'jobs',
              'work',
            ].includes(term)
        );

      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.flatMap((term: string) => [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { company: { contains: term, mode: 'insensitive' } },
        ]);

        if (whereClause.OR) {
          whereClause.AND = [{ OR: whereClause.OR }, { OR: searchConditions }];
          delete whereClause.OR;
        } else {
          whereClause.OR = searchConditions;
        }
      }
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      take: params.limit || 10,
      orderBy: { postedAt: 'desc' },
    });

    return jobs;
  }

  /**
   * Extract company name from user message
   */
  private static extractCompanyName(message: string): string | null {
    // Simple pattern matching - can be enhanced
    const patterns = [
      /about\s+([A-Za-z\s&.]+?)(?:\s|$|\?)/i,
      /company\s+([A-Za-z\s&.]+?)(?:\s|$|\?)/i,
      /work\s+at\s+([A-Za-z\s&.]+?)(?:\s|$|\?)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Get jobs from a specific company
   */
  private static async getCompanyJobs(companyName: string): Promise<any[]> {
    return await prisma.job.findMany({
      where: {
        company: {
          contains: companyName,
          mode: 'insensitive',
        },
      },
      take: 5,
      orderBy: { postedAt: 'desc' },
    });
  }

  /**
   * Prepare conversation history for AI context
   */
  private static prepareConversationHistory(messages: Message[]): Message[] {
    return messages.map(msg => ({
      ...msg,
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Get default suggestions based on intent
   */
  private static getDefaultSuggestions(intent: ConversationIntent): string[] {
    const suggestions = {
      job_search: [
        'Show me similar jobs in other locations',
        'What skills are most in demand for these roles?',
        'Help me refine my search criteria',
      ],
      company_info: [
        'Tell me about the interview process',
        'What are the benefits and perks?',
        'How is the work-life balance?',
      ],
      career_guidance: [
        'What skills should I develop next?',
        'How can I advance in my career?',
        'What are the growth opportunities?',
      ],
      application_help: [
        'Help me write a cover letter',
        'Review my resume for this role',
        'Prepare me for the interview',
      ],
      market_insights: [
        "What's the salary range for this role?",
        'How competitive is this market?',
        'What are the industry trends?',
      ],
      job_comparison: [
        'Compare these opportunities',
        'Which offer should I choose?',
        'What are the pros and cons?',
      ],
      general_chat: [
        'Help me search for jobs',
        'Tell me about companies',
        'Give me career advice',
      ],
    };

    return suggestions[intent] || suggestions.general_chat;
  }
}
