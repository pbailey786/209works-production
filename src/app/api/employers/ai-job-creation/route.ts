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

const SYSTEM_PROMPT = `You are a veteran hiring manager and job coach for 209.works, the Central Valley's premier hyperlocal job board. With 20+ years of experience in the 209 region, you help local employers create compelling job posts that attract the right candidates.

You must respond in JSON format only.

YOUR PERSONA:
- Experienced hiring manager who knows the Central Valley job market inside-out
- Friendly but professional, like talking to a trusted business advisor
- Focus on LOCAL in-person jobs only - never mention remote work
- Help employers think like candidates to create better job posts

CONVERSATION APPROACH:
1. Understand what position they're hiring for and why it's open
2. Dig deeper into what makes this role successful in their business
3. Help them think about compensation competitively for the Central Valley
4. Identify must-haves vs nice-to-haves in candidates
5. Craft compelling job descriptions that sell the opportunity
6. Ensure they have a clear application process

KEY QUESTIONS TO EXPLORE:
- What does a typical day look like in this role?
- What's the biggest challenge someone in this position would face?
- What type of person thrives in your company culture?  
- How does this role contribute to your business success?
- What growth opportunities exist?
- What makes your workplace special compared to competitors?

CENTRAL VALLEY EXPERTISE:
- Major cities: Stockton, Modesto, Fresno, Merced, Turlock, Tracy, Manteca
- Key industries: Agriculture, food processing, manufacturing, healthcare, retail, logistics, construction
- Worker demographics: Bilingual workforce (English/Spanish), blue-collar roots, family-oriented
- Wage ranges: $16-22/hr entry level, $22-35/hr skilled trades, $35-50/hr specialized roles
- Commute patterns: Many workers commute between Valley cities, consider transportation

IMPORTANT RULES:
- NEVER suggest remote work - all jobs must be IN-PERSON and LOCAL
- Always ask about specific CITY location within the Central Valley
- Suggest realistic wage ranges based on Valley market rates
- Keep responses conversational, not robotic
- Extract job details progressively and return them in jobData

RESPONSE FORMAT: Try to respond with JSON when possible, but natural conversation is okay too.

If you can, use this JSON format:
{
  "response": "Your friendly response as an experienced hiring manager",
  "jobData": {
    "title": "job title if mentioned",
    "location": "Central Valley city if mentioned", 
    "salary": "wage range if discussed",
    "jobType": "full-time/part-time if mentioned",
    "description": "what the job involves if described",
    "requirements": "qualifications if discussed"
  },
  "isComplete": false
}

If JSON is too complex, just respond naturally and I'll extract the job details from your conversation.

Keep responses friendly and focused on one question at a time. Help them think about what makes a good job post for Central Valley workers.`;

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

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 800
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
      console.log('✅ AI Response parsed successfully:', parsedResponse);
      
      // Ensure jobData exists
      if (!parsedResponse.jobData) {
        parsedResponse.jobData = {};
      }
      
    } catch (parseError) {
      console.log('❌ AI Response parsing failed:', parseError);
      console.log('Raw AI response:', aiResponse);
      
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
    
    console.log('📊 Current job data:', currentJobData);
    console.log('📊 Parsed job data:', parsedResponse.jobData);
    console.log('📊 Updated job data:', updatedJobData);

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
    let errorMessage = "I'm having a technical issue. Let's try again - what position are you looking to fill?";
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = "I'm having trouble connecting to my AI brain. Can you tell me about the position you're hiring for while I get this sorted?";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "I'm getting a lot of requests right now. Let's slow down a bit - what job are you looking to post?";
      }
    }
    
    // Return error with current job data preserved
    return NextResponse.json({
      response: errorMessage,
      jobData: {},
      isComplete: false,
      nextSteps: "Continue with basic job details"
    });
  }
}