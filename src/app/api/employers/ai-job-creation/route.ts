import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';
import { findJobTemplate, generateJobDescription } from '@/lib/ai/job-knowledge-base';
import { JobLearningSystem } from '@/lib/ai/job-learning-system';

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

const SYSTEM_PROMPT = `You are a Central Valley hiring expert. Follow this EXACT conversation pattern:

STEP 1: If missing job title OR location, ask: "I'll help you create a job post that attracts qualified Central Valley candidates. What position are you hiring for and in which city?"

STEP 2: If you have job title AND location BUT missing salary/schedule, ask: "Got it! Let's make sure we attract someone dependable and local. What's the starting hourly pay and shift schedule?"

STEP 3: If you have job title AND location AND salary, create complete job posting with headline and description like this:
"Great. Here's a starting headline:
[Job Type] Needed – Steady Work in [City]
And here's a draft for the description:
'[Compelling description with salary and schedule]. No experience required — just a good attitude!'

I've also added typical duties and qualifications based on similar successful posts. You can edit everything in the next step - just click 'Build Job Ad' when ready!"

CRITICAL RULES:
1. ONLY use the 3 responses above - don't ask other questions
2. Extract information from ALL messages in conversation history
3. Never ask for "requirements" or "duties" - generate them automatically
4. Always generate complete job posting when you have title + location + salary

Look at entire conversation to extract:
- Job title from phrases like "hire a janitor"
- Location from city names like "Modesto" 
- Salary from "$18/hr" format
- Schedule from "6pm to 10pm, Mon-Fri" format

Return JSON:
{
  "response": "One of the 3 exact responses above",
  "jobData": { "title": "", "location": "", "salary": "", "schedule": "", "description": "", "requirements": "" },
  "isComplete": true if you have title + location + salary
}`;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, currentJobData } = await req.json();
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    
    // Build conversation history for AI
    const conversationHistory = messages.map((msg: Message) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    // Try AI first, but fallback to rule-based system if it fails
    let aiResponse = null;
    
    try {
      // Quick AI attempt with very short timeout
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory
          ],
          temperature: 0.3, // Lower temperature for more consistent responses
          max_tokens: 300   // More tokens for complete responses
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 3000) // 3 second timeout
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
      
      // Look at ENTIRE conversation to understand context
      const allMessages = messages.map((m: Message) => m.content).join(' ').toLowerCase();
      const message = lastUserMessage.toLowerCase();
      
      console.log('AI failed, using fallback. Current data:', currentJobData);
      console.log('All messages:', allMessages);
      console.log('Last message:', lastUserMessage);
      
      // Extract from ENTIRE conversation (not just last message)
      
      // Extract job title from any message
      if (!newJobData.title) {
        const titlePatterns = [
          /(?:hire|need|looking for)\s+(?:a|an)?\s*([a-z\s]+?)(?:\s+at|\s+in|\s+for|$)/i,
          /^([a-z\s]+?)(?:\s+at|\s+in)/i
        ];
        
        for (const pattern of titlePatterns) {
          const match = allMessages.match(pattern);
          if (match) {
            newJobData.title = match[1].trim();
            break;
          }
        }
      }
      
      // Extract location from any message
      if (!newJobData.location) {
        const locations = ['stockton', 'modesto', 'fresno', 'merced', 'turlock', 'tracy', 'manteca', 'lodi', 'oakdale'];
        for (const loc of locations) {
          if (allMessages.includes(loc)) {
            newJobData.location = loc.charAt(0).toUpperCase() + loc.slice(1) + ', CA';
            break;
          }
        }
      }
      
      // Extract salary from any message
      if (!newJobData.salary) {
        const salaryMatch = allMessages.match(/\$?(\d+(?:\.\d+)?)\s*(?:[-–]?\s*\$?(\d+(?:\.\d+)?))?\s*(?:per\s+)?(?:hour|hr|hourly|\/hr)/i);
        if (salaryMatch) {
          if (salaryMatch[2]) {
            newJobData.salary = `$${salaryMatch[1]}-${salaryMatch[2]}/hour`;
          } else {
            newJobData.salary = `$${salaryMatch[1]}/hour`;
          }
        }
      }
      
      // Extract schedule from any message
      if (!newJobData.schedule) {
        const scheduleMatch = allMessages.match(/(\d+)\s*(?:pm|am)\s*(?:to|-)?\s*(\d+)\s*(?:pm|am)(?:\s*,?\s*(?:mon|tue|wed|thu|fri|sat|sun)[\w\s,–-]*)?/i);
        if (scheduleMatch) {
          newJobData.schedule = scheduleMatch[0];
        } else {
          // Try to match day patterns separately
          const dayMatch = allMessages.match(/(?:mon|tue|wed|thu|fri|sat|sun)[\w\s,–-]*/i);
          if (dayMatch) {
            newJobData.schedule = dayMatch[0];
          }
        }
      }
      
      // If we have the basics, generate a complete job description
      if (newJobData.title && newJobData.location && newJobData.salary) {
        const template = findJobTemplate(newJobData.title);
        
        if (template) {
          // Use template to fill in missing details
          newJobData.description = template.typicalDuties.slice(0, 5).join('\n• ');
          newJobData.requirements = template.typicalRequirements.slice(0, 4).join('\n• ');
          newJobData.benefits = template.typicalBenefits.slice(0, 3).join(', ');
          
          response = `Great! I've created a job posting for your ${newJobData.title} position in ${newJobData.location} at ${newJobData.salary}. ` +
                    `I've added typical duties and requirements based on similar positions. You can edit everything in the next step!`;
          
          return NextResponse.json({
            response,
            jobData: newJobData,
            isComplete: true,
            nextSteps: "Ready to build job ad"
          });
        }
      }
      
      console.log('After extraction:', newJobData);
      
      // Smart questioning based on what we have - NEVER repeat questions
      const isFirstMessage = messages.length <= 1;
      const askedForSalary = allMessages.includes('pay') || allMessages.includes('salary') || allMessages.includes('schedule');
      
      if (!newJobData.title && !newJobData.location) {
        response = "I'll help you create a job post that attracts qualified Central Valley candidates. What position are you hiring for and in which city?";
      } else if (newJobData.title && newJobData.location && !newJobData.salary && !askedForSalary) {
        response = `Got it! Let's make sure we attract someone dependable and local. What's the starting hourly pay and shift schedule?`;
      } else if (!newJobData.salary && askedForSalary) {
        // They were asked for salary but we couldn't extract it - be more specific
        response = `I need the hourly rate to create your job post. For example: "$18/hr" or "$15-20/hour"`;
      } else {
        // We have enough to create a job posting - generate it like the example
        const template = findJobTemplate(newJobData.title);
        if (template) {
          // Generate headline based on job type and schedule
          const isEvening = newJobData.schedule?.includes('pm') || newJobData.schedule?.includes('evening');
          const timeDescriptor = isEvening ? 'Evening' : newJobData.schedule ? 'Part-Time' : 'Steady';
          const headline = `${timeDescriptor} ${newJobData.title} Needed – Steady ${newJobData.schedule ? 'Part-Time' : ''} Work in ${newJobData.location.replace(', CA', '')}`.replace(/\s+/g, ' ');
          
          // Generate description in your exact style
          const workplace = newJobData.title.toLowerCase().includes('janitor') && lastUserMessage.includes('church') ? 'church community' : 'team';
          const description = `"Join a friendly ${workplace} as our ${isEvening ? 'evening' : ''} ${newJobData.title.toLowerCase()}. ${template.typicalDuties[0].toLowerCase()}. ${newJobData.salary}. ${newJobData.schedule ? newJobData.schedule + ' hours' : 'Steady hours'}. No experience required — just a good attitude!"`;
          
          newJobData.description = '• ' + template.typicalDuties.slice(0, 4).join('\n• ');
          newJobData.requirements = '• ' + template.typicalRequirements.slice(0, 3).join('\n• ');
          
          response = `Great. Here's a starting headline:\n${headline}\n\nAnd here's a draft for the description:\n${description}`;
          
          return NextResponse.json({
            response,
            jobData: newJobData,
            isComplete: true,
            nextSteps: "Ready to build job ad"
          });
        }
        
        response = `Perfect! I have the basics for your ${newJobData.title} position. Let me create a job posting for you.`;
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

    // If AI gave us the basics but no description, use knowledge base
    if (updatedJobData.title && updatedJobData.location && updatedJobData.salary) {
      const template = findJobTemplate(updatedJobData.title);
      
      if (template && !updatedJobData.description) {
        updatedJobData.description = '• ' + template.typicalDuties.slice(0, 5).join('\n• ');
      }
      
      if (template && !updatedJobData.requirements) {
        updatedJobData.requirements = '• ' + template.typicalRequirements.slice(0, 4).join('\n• ');
      }
      
      if (template && !updatedJobData.benefits) {
        updatedJobData.benefits = template.typicalBenefits.slice(0, 3).join(', ');
      }
      
      if (!updatedJobData.schedule && template) {
        updatedJobData.schedule = template.typicalSchedule;
      }
    }

    // Check if we have minimum required fields for completion
    const requiredFields = ['title', 'salary', 'location'];
    const hasRequiredFields = requiredFields.every(field => 
      updatedJobData[field as keyof JobData]
    );

    // If we have enough for a complete job posting, ensure we have duties and requirements
    if (hasRequiredFields && updatedJobData.title) {
      const template = findJobTemplate(updatedJobData.title);
      if (template && !updatedJobData.description) {
        updatedJobData.description = '• ' + template.typicalDuties.slice(0, 5).join('\n• ');
      }
      if (template && !updatedJobData.requirements) {
        updatedJobData.requirements = '• ' + template.typicalRequirements.slice(0, 4).join('\n• ');
      }
      if (template && !updatedJobData.benefits) {
        updatedJobData.benefits = template.typicalBenefits.slice(0, 3).join(', ');
      }
    }

    // Enhance with learned insights
    const enhancedResponse = await JobLearningSystem.enhanceJobGenieResponse(
      updatedJobData.title || '',
      updatedJobData.location || '',
      updatedJobData.salary || '',
      {
        response: parsedResponse.response || "I've gathered your job details. Ready to create your job post!",
        jobData: updatedJobData,
        isComplete: hasRequiredFields,
        nextSteps: hasRequiredFields ? "Ready to build job ad" : "Continue gathering details"
      }
    );

    return NextResponse.json(enhancedResponse);

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