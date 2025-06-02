import { getChatCompletion } from '@/lib/openai';

interface ConversationalResponseParams {
  userMessage: string;
  filters: any;
  jobs: any[];
  conversationHistory?: any[];
  userProfile?: any;
  jobMatches?: any[];
}

// Convert conversation history to OpenAI chat format
function formatConversationForOpenAI(conversationHistory: any[], currentUserMessage: string) {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  // Add recent conversation history
  conversationHistory.slice(-6).forEach((msg: any) => {
    if (msg.type === 'user') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.type === 'assistant') {
      // Include job context in assistant messages
      let content = msg.content;
      if (msg.jobs && msg.jobs.length > 0) {
        content += ` [Context: Found ${msg.jobs.length} jobs]`;
      }
      messages.push({ role: 'assistant', content });
    }
  });
  
  // Add current user message
  messages.push({ role: 'user', content: currentUserMessage });
  
  return messages;
}

export async function generateConversationalResponse({
  userMessage,
  filters,
  jobs,
  conversationHistory = [],
  userProfile = null,
  jobMatches = []
}: ConversationalResponseParams): Promise<string> {
  
  // Build context from conversation history - properly formatted for OpenAI
  const conversationContext = conversationHistory
    .slice(-8) // Last 8 messages for better context (4 exchanges)
    .map((msg: any) => {
      if (msg.type === 'user') {
        return `Human: ${msg.content}`;
      } else {
        // Include job count if available for assistant messages
        const jobInfo = msg.jobs && msg.jobs.length > 0 ? ` (Found ${msg.jobs.length} jobs)` : '';
        return `Assistant: ${msg.content}${jobInfo}`;
      }
    })
    .join('\n');

  // Build user profile context
  const profileContext = userProfile ? `
User Profile:
- Experience: ${userProfile.experience || 'Not specified'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Location: ${userProfile.location || 'Not specified'}
- Preferred Job Types: ${userProfile.preferences?.jobTypes?.join(', ') || 'Not specified'}
- Salary Range: ${userProfile.preferences?.salaryRange ? `$${userProfile.preferences.salaryRange.min} - $${userProfile.preferences.salaryRange.max}` : 'Not specified'}
- Remote Work: ${userProfile.preferences?.remoteWork ? 'Yes' : 'No'}
` : '';

  // Build job matches context
  const matchesContext = jobMatches.length > 0 ? `
Job Match Analysis:
${jobMatches.slice(0, 3).map((match: any) => 
  `- ${match.title} at ${match.company}: ${match.matchScore}% match (${match.matchReason})`
).join('\n')}
` : '';

  // Build job results summary with more detail
  const jobsContext = jobs.length > 0 ? `
Found ${jobs.length} job${jobs.length !== 1 ? 's' : ''}:
${jobs.slice(0, 5).map((job: any) => {
  let salary = '';
  if (job.salaryMin && job.salaryMax) {
    salary = ` - $${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
  } else if (job.salaryMin) {
    salary = ` - from $${job.salaryMin.toLocaleString()}`;
  } else if (job.salaryMax) {
    salary = ` - up to $${job.salaryMax.toLocaleString()}`;
  }
  return `• ${job.title} at ${job.company} (${job.location})${salary}${job.jobType ? ` [${job.jobType}]` : ''}`;
}).join('\n')}
${jobs.length > 5 ? `... and ${jobs.length - 5} more positions` : ''}
` : 'No jobs found matching the criteria.';

  // Build extracted filters summary
  const filtersContext = `
Search Filters Applied:
- Location: ${filters.location || 'Any'}
- Job Type: ${filters.job_type || 'Any'}
- Role: ${filters.role || 'Any'}
- Industry: ${filters.industry || 'Any'}
- Remote: ${filters.isRemote ? 'Yes' : 'No'}
- Experience Level: ${filters.experience_level || 'Any'}
- Sort By: ${filters.sortBy || 'relevance'}
`;

  const systemPrompt = `You are JobsGPT, but people call you "Rust" - your AI job plug for the 209. You're built from cold mornings in Tracy, 14 different bosses named Steve, and one perfectly timed handshake. Been around. Done the jobs. Watched the bosses. You help job seekers get hired without sweating through their shirt.

Your personality:
- Friendly like your work buddy, but gives advice like someone who's worked 50 jobs and learned from all of 'em
- Speaks like you've been in breakrooms and boardrooms - knows when to keep it casual and when to drop a golden one-liner
- Gives advice like you've been quietly running game since 2003
- You don't just help people get a job — you help them look like they belonged there the whole time
- Honest about sketchy postings but experienced enough to spot the real opportunities
- Built from the 209 - knows Tracy warehouses, Stockton logistics, Modesto agriculture, and all the spots in between

Conversation Guidelines:
1. Talk like you've been in the game - casual but with earned wisdom
2. Give advice like someone who's learned from every mistake in the book
3. Reference the 209 like you've worked every corner of it - Tracy warehouses, Stockton logistics, Modesto ag
4. When jobs are scarce: "Scene's quiet right now, but don't stress — the 209 never stays still. I'll keep a wrench in the feed"
5. For sketchy postings: Call them out with experience, not just humor
6. Resume advice: "Your resume ain't bad — but right now it's reading like you're apologizing for existing. Let's reframe it like you're the one doing them the favor"
7. Interview prep: Drop golden one-liners that actually work
8. Always sound like you've been quietly running game since 2003

Context about the 209 area:
- Major cities: Stockton, Modesto, Fresno, Visalia, Tracy, Manteca, Lodi, Turlock, Merced
- Key industries: Agriculture, logistics/warehousing, healthcare, education, manufacturing, food processing
- Growing sectors: Tech/remote work, renewable energy, e-commerce fulfillment
- Economic challenges: Competition for skilled roles, seasonal work patterns
- Opportunities: Strong logistics hub, affordable living, growing tech presence

Response Style:
- Talk like someone who's scraped job boards harder than a backhoe on overtime
- When sharing results: "Alright, I scraped the job boards harder than a backhoe on overtime. Got a warehouse gig in Tracy that doesn't look like a trap. You want in?"
- Interview success: "Let's gooo. That's your shot. Just don't oversell. Be solid, shake hands, and leave like you've already got another offer waiting"
- Give advice with the confidence of someone who's seen it all
- End conversations like you're already thinking three moves ahead

Example responses for context:
- Job search results: "Got a warehouse gig in Tracy that doesn't look like a trap. You want in?"
- Resume help: "Your resume ain't bad — but right now it's reading like you're apologizing for existing. Let's reframe it like you're the one doing them the favor"
- Interview prep: "When they ask 'why do you want this job,' don't go into your childhood dreams. Say: 'I like solving problems, staying busy, and not getting written up.' That hits harder than any buzzword"
- No results: "Warehouse scene's quiet right now, but don't stress — the 209 never stays still. I'll keep a wrench in the feed and flag you when it moves"
- Interview success: "Let's gooo. That's your shot. Just don't oversell. Be solid, shake hands, and leave like you've already got another offer waiting"`;

  // Try using proper chat format first if we have OpenAI
  try {
    const chatMessages = formatConversationForOpenAI(conversationHistory, userMessage);
    
    // Enhance the system message with current context
    const enhancedSystemPrompt = `${systemPrompt}

Current Search Context:
${filtersContext}

${jobsContext}

${profileContext}

${matchesContext}

Based on this context and the conversation history, provide a helpful, conversational response that feels natural and continues the conversation effectively.`;

    const response = await getChatCompletion(
      [
        { role: 'system', content: enhancedSystemPrompt },
        ...chatMessages
      ],
      {
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 300,
        rateLimitId: 'conversational-response-chat',
        timeout: 20000,
      }
    );

    return response || generateFallbackResponse(jobs.length, filters, conversationHistory);
  } catch (error) {
    console.error('Error with chat format, trying fallback approach:', error);
    
    // Fallback to the original prompt-based approach
    const userPrompt = `Current conversation context:
${conversationContext ? `\nRecent conversation:\n${conversationContext}\n` : ''}

${profileContext}

${filtersContext}

${jobsContext}

${matchesContext}

User's latest message: "${userMessage}"

Generate a conversational response that:
1. Acknowledges the conversation context naturally
2. Analyzes the search results with insights
3. Provides helpful observations about the job market/opportunities
4. Ends with an engaging question or suggestion to continue the conversation
5. Feels like a natural conversation with a knowledgeable career advisor

Keep it engaging, insightful, and conversational - not just a search result summary.`;

    try {
      const response = await getChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        {
          model: 'gpt-4',
          temperature: 0.8,
          maxTokens: 300,
          rateLimitId: 'conversational-response',
          timeout: 20000,
        }
      );

      return response || generateFallbackResponse(jobs.length, filters, conversationHistory);
    } catch (error) {
      console.error('Error generating conversational response:', error);
      return generateFallbackResponse(jobs.length, filters, conversationHistory);
    }
  }
}

// Improved fallback response that considers conversation context
function generateFallbackResponse(jobCount: number, filters: any, conversationHistory: any[]): string {
  const isFollowUp = conversationHistory.length > 0;
  const location = filters.location;

  if (jobCount === 0) {
    if (isFollowUp) {
      return `Scene's quiet right now${location ? ` around ${location}` : ' in the 209'}, but don't stress — this area never stays still. I'll keep a wrench in the feed and flag you when it moves. What else you thinking about?`;
    }
    return `Scraped the boards but came up empty on that one. The 209's got layers though - try "warehouse," "logistics," or "customer service." Sometimes the good stuff hides under different titles.`;
  }

  if (isFollowUp) {
    return `Alright, found ${jobCount} with those tweaks. ${jobCount > 10 ? 'Solid lineup here.' : jobCount > 5 ? 'Some decent options in the mix.' : 'Here\'s what came up.'} Any of these look like they fit?`;
  }

  return `Scraped the job boards and found ${jobCount} that don't look like traps${location ? ` around ${location}` : ' in the 209'}. ${jobCount > 15 ? "That's a solid spread." : jobCount > 8 ? "Some good options to work with." : "Here's what's available."} Which ones are calling your name?`;
}

// Enhanced filter extraction with conversation context
export async function extractJobSearchFiltersWithContext(
  userMessage: string, 
  conversationHistory: any[] = []
): Promise<any> {
  // Build conversation context for better filter extraction
  const contextMessages = conversationHistory
    .slice(-4) // Last 4 messages for context
    .map((msg: any) => {
      if (msg.type === 'user') {
        return `User: ${msg.content}`;
      } else {
        return `Assistant: ${msg.content}${msg.jobs ? ` (${msg.jobs.length} jobs found)` : ''}`;
      }
    })
    .join('\n');

  const systemPrompt = `Extract job search filters from the user's message, considering the conversation context. 
  
Previous conversation:
${contextMessages || 'No previous conversation'}

Focus on the 209 area (Central Valley, California) including cities like:
- Stockton, Modesto, Fresno, Visalia, Bakersfield
- Tracy, Manteca, Lodi, Turlock, Merced

Extract these fields (set to null if not mentioned):
- location (must be in 209 area)
- job_type (use: full_time, part_time, contract, internship, temporary, volunteer, other)
- role (job title/position)
- industry (healthcare, retail, warehouse, etc.)
- salary (salary requirements)
- experience_level (entry-level, mid-level, senior)
- company (specific company name)
- isRemote (boolean)
- skills (array of skills)
- schedule (morning, evening, weekend, etc.)
- sortBy (salary_desc, salary_asc, date_desc, date_asc, relevance)

Consider conversation context - if they're refining a previous search, maintain relevant filters.

Return as JSON only.`;

  try {
    const response = await getChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract filters from: "${userMessage}"` }
      ],
      {
        model: 'gpt-4',
        temperature: 0.1,
        maxTokens: 400,
        rateLimitId: 'filter-extraction-context',
        timeout: 15000,
      }
    );

    // Parse JSON response
    const jsonMatch = response.match(/{[\s\S]*}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting filters with context:', error);
    return null;
  }
}
