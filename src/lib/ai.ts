import { OpenAI } from 'openai';


async function sendFailoverNotification(
  failedProvider: 'openai' | 'anthropic',
  error: string,
  context: string
) {
  try {
    // Only send in production to avoid spam during development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Would send failover email: ${failedProvider} failed in ${context}`);
      return;
    }

    const response = await fetch('/api/email/send-admin-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'paul@voodoo.rodeo',
        subject: `🚨 AI Failover Alert - ${failedProvider.toUpperCase()} Failed`,
        message: `
AI Provider Failover Alert

Failed Provider: ${failedProvider.toUpperCase()}
Context: ${context}
Error: ${error}
Time: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV}

The system automatically switched to the backup AI provider.
Please check the ${failedProvider} API status and configuration.
        `.trim()
      })
    });

    if (!response.ok) {
      console.error('Failed to send failover notification email');
    }
  } catch (emailError) {
    console.error('Error sending failover notification:', emailError);
  }
}

// AI provider configuration
interface AIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  timeout: 30000,
  maxRetries: 2,
});

// Initialize Anthropic client (lazy loaded)
let anthropic: any = null;
function getAnthropicClient() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } catch (error) {
      console.error('Failed to initialize Anthropic client:', error);
    }
  }
  return anthropic;
}

// Check if API keys are available
function hasValidOpenAIKey(): boolean {
  return !!(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your-openai-key' &&
    process.env.OPENAI_API_KEY !== 'dummy-key' &&
    process.env.OPENAI_API_KEY.startsWith('sk-')
  );
}

function hasValidAnthropicKey(): boolean {
  return !!(
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your-anthropic-key' &&
    process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')
  );
}

// Generate chat completion with fallback support
export async function getChatCompletionWithFallback(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
    systemPrompt?: string;
  } = {}
): Promise<string> {
  const {
    model = 'gpt-3.5-turbo',
    maxTokens = 150,
    temperature = 0.7,
    timeout = 30000,
    systemPrompt,
  } = options;

  // Validate input
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }

  // Try OpenAI first
  if (hasValidOpenAIKey()) {
    try {
      console.log('Trying OpenAI...');

      const chatMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await Promise.race([
        openai.chat.completions.create({
          model,
          messages: chatMessages as any,
          max_tokens: maxTokens,
          temperature,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OpenAI timeout')), timeout)
        )
      ]) as any;

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        console.log('OpenAI success');
        return content;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('OpenAI failed, trying Anthropic:', errorMessage);

      // Send notification about OpenAI failure
      await sendFailoverNotification('openai', errorMessage, 'Chat Completion');
    }
  }

  // Try Anthropic as backup
  if (hasValidAnthropicKey()) {
    try {
      console.log('Trying Anthropic...');
      const client = getAnthropicClient();

      if (client) {
        // Get the last user message
        const userMessage = messages[messages.length - 1]?.content || '';

        const response = await Promise.race([
          client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: maxTokens,
            system: systemPrompt || 'You are a helpful assistant.',
            messages: [{ role: 'user', content: userMessage }]
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Anthropic timeout')), timeout)
          )
        ]) as any;

        const content = response.content?.[0]?.text;
        if (content) {
          console.log('Anthropic success (backup used)');
          return content;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Anthropic failed:', errorMessage);

      // Send notification about both providers failing
      await sendFailoverNotification('anthropic', errorMessage, 'Chat Completion (Backup)');
    }
  }

  // If both fail, throw error
  throw new Error('Both OpenAI and Anthropic APIs are unavailable');
}

// Conversational response specifically for job search
export async function generateJobSearchResponse(
  userMessage: string,
  conversationHistory: any[] = [],
  jobResults: any[] = [],
  filters: any = {}
): Promise<string> {
  const systemPrompt = `You're a friendly work buddy helping people find jobs in the 209 area (Central Valley). Keep responses SHORT and conversational like text messages from a friend.

209 area basics:
- Cities: Stockton, Modesto, Tracy, Manteca, Lodi, Turlock
- Big industries: warehouses, healthcare, agriculture, manufacturing
- Way cheaper than Bay Area, still close to everything

Your style:
- Talk like texting a friend - short, casual, helpful
- Use emojis occasionally 
- Keep responses under 2-3 sentences max
- Be encouraging but real
- Give quick, practical advice
- Don't be formal or wordy

Current context:
- Found ${jobResults.length} jobs
- Location: ${filters.location || 'any'}
- Job type: ${filters.job_type || 'any'}

If no jobs found, briefly mention 209 Works is building the database and suggest they check back.`;

  // Build conversation context
  const messages = [];
  
  // Add recent conversation history
  conversationHistory.slice(-4).forEach(msg => {
    messages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });

  // Add current message
  messages.push({
    role: 'user',
    content: userMessage
  });

  try {
    return await getChatCompletionWithFallback(messages, {
      systemPrompt,
      maxTokens: 150,
      temperature: 0.8,
      timeout: 20000,
    });
  } catch (error) {
    console.error('AI response generation failed:', error);
    
    // Fallback to basic response
    if (jobResults.length === 0) {
      return `No matches for "${userMessage}" yet 😅 We're still adding jobs to the database. Try "warehouse jobs" or "customer service" - those are popular in the 209! What type of work are you most interested in?`;
    } else if (jobResults.length > 10) {
      return `Found ${jobResults.length} jobs! 🔥`;
    } else {
      return `Found ${jobResults.length} jobs for you!`;
    }
  }
}

// Universal AI function for any text processing task
export async function processWithAI(
  prompt: string,
  options: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
    context?: string; // For error notifications
  } = {}
): Promise<string> {
  const {
    systemPrompt = 'You are a helpful assistant.',
    maxTokens = 500,
    temperature = 0.7,
    timeout = 30000,
    context = 'AI Processing'
  } = options;

  return await getChatCompletionWithFallback(
    [{ role: 'user', content: prompt }],
    { systemPrompt, maxTokens, temperature, timeout }
  );
}

// Extract job search filters with AI fallback
export async function extractJobFiltersWithAI(
  userMessage: string,
  conversationHistory: any[] = []
): Promise<any> {
  const systemPrompt = `Extract job search filters from the user's message. Focus on the 209 area (Central Valley, California).

Extract these fields (set to null if not mentioned):
- location (must be in 209 area: Stockton, Modesto, Tracy, etc.)
- job_type (use: full_time, part_time, contract, internship, temporary)
- role (job title/position)
- industry (healthcare, retail, warehouse, etc.)
- salary (salary requirements)
- experience_level (entry-level, mid-level, senior)
- company (specific company name)
- isRemote (boolean)
- skills (array of skills)
- sortBy (salary_desc, salary_asc, date_desc, date_asc, relevance)

Return as JSON only.`;

  try {
    const response = await processWithAI(
      `Extract filters from: "${userMessage}"`,
      {
        systemPrompt,
        maxTokens: 400,
        temperature: 0.1,
        context: 'Job Filter Extraction'
      }
    );

    // Parse JSON response
    const jsonMatch = response.match(/{[\s\S]*}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI filter extraction failed:', error);
    return null;
  }
}

// Parse resume with AI fallback
export async function parseResumeWithAI(resumeText: string): Promise<any> {
  const systemPrompt = `You are a resume parser. Extract structured information from resumes and return it as JSON.

Focus on extracting:
- name: Full name of the person
- location: City and state
- currentJobTitle: Most recent job title
- skills: Array of skills (max 10)
- experienceLevel: entry, mid, senior, or executive
- email: Email address if present
- phoneNumber: Phone number if present

Return only valid JSON that matches this schema. If information is not found, omit the field or return null.`;

  try {
    const response = await processWithAI(
      `Please parse this resume and extract the information as JSON:\n\n${resumeText}`,
      {
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.1,
        context: 'Resume Parsing'
      }
    );

    // Parse JSON response
    const jsonMatch = response.match(/{[\s\S]*}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI resume parsing failed:', error);
    return null;
  }
}

// Health check for AI services
export async function checkAIHealth(): Promise<{
  openai: { available: boolean; error?: string };
  anthropic: { available: boolean; error?: string };
}> {
  const result = {
    openai: { available: false, error: undefined as string | undefined },
    anthropic: { available: false, error: undefined as string | undefined },
  };

  // Check OpenAI
  if (hasValidOpenAIKey()) {
    try {
      await getChatCompletionWithFallback([
        { role: 'user', content: 'Hello' }
      ], { maxTokens: 10, timeout: 5000 });
      result.openai.available = true;
    } catch (error) {
      result.openai.error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    result.openai.error = 'No valid API key';
  }

  // Check Anthropic
  if (hasValidAnthropicKey()) {
    try {
      const client = getAnthropicClient();
      if (client) {
        await client.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        });
        result.anthropic.available = true;
      }
    } catch (error) {
      result.anthropic.error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    result.anthropic.error = 'No valid API key';
  }

  return result;
}
