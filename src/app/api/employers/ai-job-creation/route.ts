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

const SYSTEM_PROMPT = `You are an expert Central Valley hiring manager. Be direct and efficient.

CRITICAL: Respond in JSON format only. Include ALL job data in every response.

Ask ONE question at a time. Focus on LOCAL jobs only (no remote).

If user pastes job description, extract all possible details immediately.

JSON format:
{
  "response": "Brief question (max 15 words)",
  "jobData": {
    "title": "job title or null",
    "location": "Central Valley city or null", 
    "salary": "$X-Y/hour or null",
    "description": "duties or null",
    "requirements": "must-haves or null",
    "schedule": "hours/days or null",
    "contactMethod": "how to apply or null"
  },
  "isComplete": false
}

Priority order: 1) title/location 2) salary 3) description 4) requirements`;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, currentJobData } = await req.json();
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    
    // Try AI first, but fallback to rule-based system if it fails
    let aiResponse = null;
    
    try {
      // Quick AI attempt with very short timeout
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: lastUserMessage }
          ],
          temperature: 0.7,
          max_tokens: 100
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 8000) // 8 second timeout
        )
      ]) as any;

      aiResponse = completion.choices?.[0]?.message?.content;
    } catch (aiError) {
      console.log('AI failed, using fallback system');
      // Use rule-based fallback below
    }
    
    // Rule-based fallback system if AI fails
    if (!aiResponse) {
      const newJobData = { ...currentJobData };
      let response = "What position are you hiring for?";
      
      // Extract basic info from user message
      const message = lastUserMessage.toLowerCase();
      
      // Extract job title
      if (!newJobData.title && message.length > 10) {
        // Simple patterns for job titles
        const titlePatterns = [
          /hiring.*?(?:for|a)\s+([^,.\n]+)/i,
          /looking for.*?(?:a|an)\s+([^,.\n]+)/i,
          /need.*?(?:a|an)\s+([^,.\n]+)/i,
          /position.*?(?:for|as)\s+([^,.\n]+)/i
        ];
        
        for (const pattern of titlePatterns) {
          const match = lastUserMessage.match(pattern);
          if (match) {
            newJobData.title = match[1].trim();
            break;
          }
        }
      }
      
      // Extract location
      const locations = ['stockton', 'modesto', 'fresno', 'merced', 'turlock', 'tracy', 'manteca'];
      for (const loc of locations) {
        if (message.includes(loc)) {
          newJobData.location = loc.charAt(0).toUpperCase() + loc.slice(1) + ', CA';
          break;
        }
      }
      
      // Extract salary
      const salaryMatch = lastUserMessage.match(/\$?(\d+)[-–]?\$?(\d+)?\s*(?:per\s+)?(?:hour|hr|hourly)/i);
      if (salaryMatch) {
        if (salaryMatch[2]) {
          newJobData.salary = `$${salaryMatch[1]}-${salaryMatch[2]}/hour`;
        } else {
          newJobData.salary = `$${salaryMatch[1]}/hour`;
        }
      }
      
      // Determine next question
      if (!newJobData.title) {
        response = "What position are you hiring for?";
      } else if (!newJobData.location) {
        response = `What Central Valley city is this ${newJobData.title} position in?`;
      } else if (!newJobData.salary) {
        response = `What's the hourly pay range for this ${newJobData.title} position?`;
      } else {
        response = `What will this ${newJobData.title} person do day-to-day?`;
      }
      
      return NextResponse.json({
        response,
        jobData: newJobData,
        isComplete: false,
        nextSteps: "Continue gathering job details"
      });
    }

    // Try to parse AI response
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
      // Use rule-based extraction if JSON parsing fails
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
      if (error.message.includes('timeout') || error.message.includes('502') || error.message.includes('AI timeout')) {
        errorMessage = "Let's keep it simple - what job title and which Central Valley city?";
      } else if (error.message.includes('API key')) {
        errorMessage = "Technical issue. What position and city?";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "System busy. Job title and location?";
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