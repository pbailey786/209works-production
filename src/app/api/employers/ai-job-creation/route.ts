import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';

// Set max duration for Netlify functions
export const maxDuration = 30;

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface JobData {
  title?: string;
  company?: string;
  description?: string;
  requirements?: string;
  salary?: string;
  location?: string;
  jobType?: string;
  urgency?: string;
  dealBreakers?: string[];
  priorities?: string[];
  contactMethod?: string;
  schedule?: string;
  benefits?: string;
}

const SYSTEM_PROMPT = `You are a veteran hiring manager for 209.works with 20+ years in the Central Valley. Be direct and professional - help employers create job posts that attract qualified local candidates.

CRITICAL: You MUST respond in valid JSON format. Always include ALL collected job data in every response.

YOUR APPROACH:
- Direct and efficient - 2-3 sentences per response max
- Ask ONE specific question at a time
- Push for concrete details, not vague descriptions
- Focus on LOCAL, IN-PERSON jobs only (no remote work)
- If user pastes an existing job description, extract all details immediately

CONVERSATION FLOW:
1. Job title and which Central Valley city (Stockton, Modesto, Fresno, etc.)
2. Exact pay range (push for numbers, not "competitive")
3. Work schedule (days/hours) and full-time/part-time
4. Day-to-day responsibilities (what they'll actually DO)
5. Must-have requirements vs nice-to-haves
6. How candidates should apply (email, website, walk-in)
7. Key benefits that matter to workers

CENTRAL VALLEY CONTEXT:
- Typical wages: $16-22/hr entry, $22-35/hr skilled, $35-50/hr specialized
- Major employers: Agriculture, food processing, manufacturing, healthcare, logistics
- Workers value: Stable hours, clear expectations, growth opportunities, family-friendly

PUSH FOR SPECIFICS:
- Vague: "Handle customer service" → Better: "Answer 50+ calls daily, resolve billing issues"
- Vague: "Competitive pay" → Better: "$18-22/hour based on experience"
- Vague: "Some weekends" → Better: "Every other Saturday, 8am-2pm"

HANDLING PASTED JOB DESCRIPTIONS:
If user pastes a job description (even incomplete):
1. Extract whatever details you can find
2. Fill in jobData with any information available (use null for missing fields)
3. Ask for the MOST CRITICAL missing piece first (location if missing, then salary)
4. Don't ask for everything at once - focus on ONE missing field
5. If you can't extract much, ask: "What city is this job located in?"

ALWAYS RESPOND WITH:
{
  "response": "Your direct 1-2 sentence response with specific question",
  "jobData": {
    "title": "exact job title",
    "company": "company name",
    "location": "specific city, CA",
    "salary": "exact range like $18-22/hour",
    "jobType": "Full-time or Part-time",
    "schedule": "specific days and hours",
    "description": "detailed day-to-day tasks",
    "requirements": "specific must-haves",
    "benefits": "concrete benefits offered",
    "contactMethod": "how to apply - email/website/phone",
    "urgency": "when they need someone",
    "dealBreakers": ["specific disqualifiers"],
    "priorities": ["top 3 must-haves"]
  },
  "isComplete": false
}

Include ALL previously collected data in jobData, not just new fields.`;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, currentJobData } = await req.json();
    
    // Build conversation context
    const conversationMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Add current job data context if exists
    if (currentJobData && Object.keys(currentJobData).length > 0) {
      conversationMessages.push({
        role: 'system',
        content: `Current job data collected: ${JSON.stringify(currentJobData, null, 2)}`
      });
    }

    // Get AI response with timeout protection
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 400  // Reduced to prevent timeouts
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Look for JSON in the response (sometimes AI adds text before/after)
      const jsonMatch = aiResponse.match(/\{.*\}/s);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      
      parsedResponse = JSON.parse(jsonString);
      
      // Ensure jobData exists
      if (!parsedResponse.jobData) {
        parsedResponse.jobData = {};
      }
      
    } catch (parseError) {
      
      // Extract job info from natural language response using simple patterns
      const extractedData: any = {};
      
      // Simple extraction patterns
      const titleMatch = aiResponse.match(/(?:position|job|role|title).*?(?:is|:)\s*([^.\n]+)/i);
      if (titleMatch) extractedData.title = titleMatch[1].trim();
      
      const salaryMatch = aiResponse.match(/(?:\$[\d,]+-?\$?[\d,]*|[\d,]+\s*(?:per hour|\/hour|hourly|per year|annually))/i);
      if (salaryMatch) extractedData.salary = salaryMatch[0].trim();
      
      const locationMatch = aiResponse.match(/(?:in|at|location)\s*([A-Za-z\s,]+)(?:,\s*CA|California)?/i);
      if (locationMatch) extractedData.location = locationMatch[1].trim();
      
      // Fallback response
      parsedResponse = {
        response: aiResponse,
        jobData: { ...currentJobData, ...extractedData },
        isComplete: false,
        nextSteps: "Continue gathering job details"
      };
    }

    // Extract and merge job data
    const updatedJobData = {
      ...currentJobData,
      ...parsedResponse.jobData
    };

    // Check if we have minimum required fields for completion
    const requiredFields = ['title', 'salary', 'urgency'];
    const hasRequiredFields = requiredFields.every(field => 
      updatedJobData[field as keyof JobData]
    );

    return NextResponse.json({
      response: parsedResponse.response,
      jobData: updatedJobData,
      isComplete: hasRequiredFields && parsedResponse.isComplete,
      nextSteps: parsedResponse.nextSteps
    });

  } catch (error) {
    console.error('AI job creation error:', error);
    
    // More helpful error response based on the error type
    let errorMessage = "Let me try a simpler approach. What position are you hiring for and in which Central Valley city?";
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('502')) {
        errorMessage = "That was a lot to process! Let's break it down - what's the job title and which city?";
      } else if (error.message.includes('API key')) {
        errorMessage = "Technical issue on my end. While I sort it out, what position and city?";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Too many requests right now. What's the job title and location?";
      }
    }
    
    // Return error with current job data preserved (don't lose what we have)
    const { currentJobData } = await req.json().catch(() => ({ currentJobData: {} }));
    
    return NextResponse.json({
      response: errorMessage,
      jobData: currentJobData || {}, // Preserve existing data
      isComplete: false,
      nextSteps: "Continue with basic job details"
    });
  }
}