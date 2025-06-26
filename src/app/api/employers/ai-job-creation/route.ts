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

CRITICAL: You MUST respond with valid JSON only. No other text before or after the JSON.

RESPONSE FORMAT - ALWAYS return exactly this JSON structure:
{
  "response": "Your conversational response as an experienced hiring manager",
  "jobData": {
    "title": "extracted job title or empty string if not discussed",
    "location": "specific Central Valley city or empty string if not discussed", 
    "salary": "wage range discussed or empty string if not discussed",
    "jobType": "full-time/part-time/contract or empty string if not discussed",
    "description": "role description gathered so far or empty string if not discussed",
    "requirements": "requirements discussed or empty string if not discussed",
    "schedule": "work schedule if discussed or empty string if not discussed",
    "benefits": "benefits mentioned or empty string if not discussed",
    "contactMethod": "how to apply or empty string if not discussed"
  },
  "isComplete": false,
  "nextSteps": "What information still needed"
}

IMPORTANT: 
- Always include ALL fields in jobData, use empty strings for undiscussed items
- Set isComplete to true only when you have: title, location, salary, basic description, requirements, and contact method
- Extract and update jobData progressively with each response`;

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
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      console.log('✅ AI Response parsed successfully:', parsedResponse);
    } catch (parseError) {
      console.log('❌ AI Response parsing failed, using fallback:', aiResponse);
      // Fallback if AI doesn't return proper JSON
      parsedResponse = {
        response: aiResponse,
        jobData: currentJobData || {},
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
    
    // Fallback response
    return NextResponse.json({
      response: "I'm sorry, I encountered an error. Could you please tell me more about the position you're looking to fill?",
      jobData: {},
      isComplete: false,
      nextSteps: "Restart conversation"
    });
  }
}