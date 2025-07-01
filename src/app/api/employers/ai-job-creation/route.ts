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

const SYSTEM_PROMPT = `You're an AI assistant trained on 25+ years of Central Valley hiring data. You're friendly, knowledgeable, and know what works for local hiring. You help employers write job posts that actually get good applicants.

PERSONALITY:
- Warm and conversational, but always honest about being AI
- Knowledgeable about Central Valley job market patterns
- Give practical advice based on what works locally
- Ask follow-up questions naturally when helpful
- Be encouraging and supportive

YOUR CONVERSATION FLOW:
1. If missing basics (job title/location), ask naturally: "Hi! I'm an AI assistant trained on Central Valley hiring patterns. What position are you looking to fill, and where's it located?"

2. If you have job/location but need pay info, ask conversationally: "Nice! [Job] positions are always in demand around [City]. What's the pay range you're thinking, and what's the schedule like?"

3. When you have enough basics, you can:
   - Ask about how people should apply ("How should people apply? If email, what's your email address? Or do you prefer phone calls or applications through our website?")
   - Ask about special requirements ("Anything specific you're looking for, or any deal-breakers?")
   - Ask about what makes this job appealing ("What would make someone excited to work there?")

4. When ready to create the job post, be enthusiastic: "Perfect! I've got everything I need. Here's what I'm thinking for your posting..." then create headline and description.

5. Answer follow-up questions naturally and helpfully

IMPORTANT:
- Be flexible - don't follow a rigid script
- Extract info from entire conversation 
- Have natural back-and-forth conversations
- Always ask about contact method (email, phone, etc.)
- Generate duties/requirements automatically from your experience

Return JSON with conversational response and extracted data:
{
  "response": "Your natural, conversational response as an AI assistant",
  "jobData": { "title": "", "location": "", "salary": "", "schedule": "", "contactMethod": "", "description": "", "requirements": "" },
  "isComplete": true when you have enough to create a complete job post
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
          /^([a-z\s]+?)(?:\s+at|\s+in)/i,
          /janitor/i,
          /custodian/i,
          /cleaner/i,
          /driver/i,
          /warehouse/i,
          /cashier/i,
          /receptionist/i,
          /cook/i,
          /server/i,
          /mechanic/i
        ];
        
        for (const pattern of titlePatterns) {
          const match = allMessages.match(pattern);
          if (match) {
            if (typeof match[1] === 'string') {
              newJobData.title = match[1].trim();
            } else if (match[0]) {
              // For simple job title matches like "janitor"
              newJobData.title = match[0].trim();
            }
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
      
      // Extract contact method from any message
      if (!newJobData.contactMethod) {
        // Look for email addresses first (most specific)
        const emailMatch = allMessages.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          newJobData.contactMethod = emailMatch[0];
        } else if (allMessages.includes('phone') || allMessages.includes('call')) {
          // Look for phone numbers
          const phoneMatch = allMessages.match(/\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/);
          newJobData.contactMethod = phoneMatch ? phoneMatch[0] : 'phone';
        } else if (allMessages.includes('website') || allMessages.includes('online') || allMessages.includes('apply here')) {
          newJobData.contactMethod = 'website';
        } else if (allMessages.includes('email')) {
          // Only set generic 'email' if no actual email address found
          newJobData.contactMethod = 'email';
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
      
      // Smart questioning based on what we have - conversational style
      const isFirstMessage = messages.length <= 1;
      const askedForSalary = allMessages.includes('pay') || allMessages.includes('salary') || allMessages.includes('schedule');
      const askedForContact = allMessages.includes('apply') || allMessages.includes('contact') || allMessages.includes('reach out');
      
      // Handle greetings and casual conversation
      const casualGreetings = ['hey', 'hi', 'hello', 'heyo', 'howdy', 'sup'];
      const isGreeting = casualGreetings.some(greeting => message.includes(greeting));
      const complaintsAboutRigid = message.includes('rigid') || message.includes('strict') || message.includes('checklist') || allMessages.includes('straight to it') || allMessages.includes('no hi hello');
      
      if (isGreeting && (!newJobData.title || !newJobData.location)) {
        response = "Well hello there! I'm an AI assistant trained on Central Valley hiring data. What kind of position are you looking to fill, and where at?";
      } else if (complaintsAboutRigid) {
        response = "Ha! You caught me being too robotic - let me be more conversational! I'm an AI but I'm trained on lots of Central Valley hiring experience. What position are you hiring for?";
      } else if (!newJobData.title && !newJobData.location) {
        response = "Hi! I'm an AI assistant that'll help you write a job post that attracts good local folks. What position are you looking to fill, and where's it located?";
      } else if (newJobData.title && newJobData.location && !newJobData.salary && !askedForSalary) {
        response = `Nice! ${newJobData.title} positions are always in demand around ${newJobData.location.replace(', CA', '')}. What's the pay range you're thinking, and what's the schedule like?`;
      } else if (newJobData.title && newJobData.location && newJobData.salary && newJobData.contactMethod === 'email' && !newJobData.contactMethod.includes('@')) {
        response = `Perfect! I just need your actual email address so people can apply. What email should they use?`;
      } else if (newJobData.title && newJobData.location && newJobData.salary && !newJobData.contactMethod && !askedForContact) {
        response = `Great info! How should people apply for this ${newJobData.title} position? If email, what's your email address? Or do you prefer phone calls or applications through our website?`;
      } else if (!newJobData.salary && askedForSalary) {
        response = `I need the hourly rate to create your job post. Something like "$18/hr" or "$15-20/hour" works perfect.`;
      } else if (message.includes('need anything else') || message.includes('anything else') || message.includes('that all')) {
        if (newJobData.title && newJobData.location && newJobData.salary) {
          response = `Actually, we're pretty much set! I could ask about benefits or specific requirements, but honestly, for most ${newJobData.title} positions around ${newJobData.location.replace(', CA', '')}, what you've told me is perfect. Want me to put together the job posting now?`;
        } else {
          response = `Well, I'd love to get the contact info - how should people apply? Email, phone, or through the website?`;
        }
      } else {
        // We have enough to create a job posting - generate it like the example
        const template = findJobTemplate(newJobData.title);
        if (template && newJobData.title && newJobData.location) {
          // Generate headline based on job type and schedule
          const cleanTitle = newJobData.title.charAt(0).toUpperCase() + newJobData.title.slice(1).toLowerCase();
          const cleanLocation = newJobData.location.replace(', CA', '');
          const isEvening = newJobData.schedule?.includes('pm') || newJobData.schedule?.includes('evening');
          const timeDescriptor = isEvening ? 'Evening' : newJobData.schedule ? 'Part-Time' : 'Steady';
          const headline = `${timeDescriptor} ${cleanTitle} Needed – Steady Work in ${cleanLocation}`.replace(/\s+/g, ' ');
          
          // Generate description in your exact style
          const workplace = cleanTitle.toLowerCase().includes('janitor') && lastUserMessage.includes('church') ? 'church community' : 'team';
          const shortDescription = `"Join a friendly ${workplace} as our ${isEvening ? 'evening' : ''} ${cleanTitle.toLowerCase()}. ${template.typicalDuties[0].toLowerCase()}. ${newJobData.salary}. ${newJobData.schedule ? newJobData.schedule + ' hours' : 'Steady hours'}. No experience required — just a good attitude!"`;
          
          // Create a more comprehensive job description
          const companyName = newJobData.company || 'our company';
          const introVariations = [
            `Join our growing team at ${companyName} in ${cleanLocation}! We're looking for a dedicated ${cleanTitle} to help us maintain our high standards of service.`,
            `${companyName} is seeking a reliable ${cleanTitle} to join our team in ${cleanLocation}. This is a great opportunity for someone who takes pride in their work.`,
            `We're a well-established business in ${cleanLocation} looking for a ${cleanTitle} who values hard work and attention to detail.`,
            `At ${companyName}, we believe in creating opportunities for hardworking individuals. We're currently seeking a ${cleanTitle} for our ${cleanLocation} location.`
          ];
          
          const intro = introVariations[Math.floor(Math.random() * introVariations.length)];
          
          // Build comprehensive description
          const duties = template.typicalDuties.slice(0, 4).map(duty => `• ${duty}`).join('\n');
          
          newJobData.description = `${intro}\n\n**What You'll Do:**\n${duties}\n\nThis position offers ${newJobData.salary} with ${newJobData.schedule || 'regular hours'}. We're looking for someone who brings a positive attitude and is ready to contribute to our team's success.`;
          newJobData.requirements = '• ' + template.typicalRequirements.slice(0, 3).join('\n• ');
          
          response = `Perfect! I've got everything I need. Here's what I'm thinking for your posting:\n\n**${headline}**\n\n${shortDescription}\n\nI've also added the typical duties and requirements that work well for ${cleanTitle} positions around here. You can edit everything in the next step - just hit 'Build Job Ad' when you're ready!`;
          
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