import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface JobData {
  title?: string;
  description?: string;
  requirements?: string;
  salary?: string;
  location?: string;
  jobType?: string;
  urgency?: string;
  dealBreakers?: string[];
  priorities?: string[];
  contactMethod?: string;
}

const SYSTEM_PROMPT = `You are an expert job posting assistant for 209.works, a hyperlocal job board serving California's Central Valley (209 area code). Your goal is to help employers create effective job posts through natural conversation.

CONVERSATION FLOW:
1. Start by asking what position they're hiring for
2. Gather job details through natural questions:
   - Position title and basic responsibilities
   - Urgency (this week, this month, when right person found)
   - Salary/wage range
   - Key requirements and deal-breakers
   - What matters most for this specific role
   - How they want to be contacted
   - Location specifics

IMPORTANT GUIDELINES:
- Keep responses conversational and helpful
- Ask one main question at a time
- Show understanding of Central Valley job market
- Suggest local wage ranges when appropriate
- Help them think about what makes a good candidate
- Mention benefits of good job posts (better candidates, fewer bad applications)

CENTRAL VALLEY CONTEXT:
- Major cities: Stockton, Modesto, Fresno, Merced, Turlock
- Industries: Agriculture, manufacturing, healthcare, retail, logistics
- Worker demographics: Mix of bilingual workforce, young families, commuters
- Typical wages: $15-25/hr for entry level, $25-40/hr for skilled trades

RESPONSE FORMAT:
Always respond with JSON containing:
{
  "response": "Your conversational response to the user",
  "jobData": { extracted job data so far },
  "isComplete": boolean (true when you have enough info for a complete job post),
  "nextSteps": "What to ask next" 
}

Job is complete when you have: title, basic description, salary range, key requirements, and contact preference.`;

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
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
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