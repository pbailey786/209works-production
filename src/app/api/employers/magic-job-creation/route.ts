import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();
    
    if (!prompt?.trim()) {
      return NextResponse.json({ 
        error: 'Job description prompt is required' 
      }, { status: 400 });
    }

    // Enhanced AI prompt for Central Valley specific job generation
    const systemPrompt = `Your job is to write helpful, friendly job descriptions for working-class folks in California's Central Valley. Don't be corporate. Don't be too casual. Think 'Craigslist meets Indeed.'

You're a veteran hiring manager who knows the Central Valley (209, 916, 510 areas) inside and out. Write job posts that:
- Sound professional yet conversational
- Include real-world details and clear expectations
- Target local workers who want steady jobs with supportive teams
- Are under 400 words total
- Feel legitimate and informative without being dry

Always mention:
- Commute context ("Easy drive from Highway 99", "Great for Stockton/Manteca locals")
- Work environment details (outdoor? standing? early shifts?)
- What makes this job stable and worthwhile
- Clear next steps for applying`;

    const userPrompt = `Write a job post for: ${prompt.trim()}

The tone should be friendly but professional, targeting Central Valley workers who want a steady job, a supportive team, and clear expectations.

Include:
- A 2-sentence company intro (make one up if none provided, keep it local and authentic)
- What you'll be doing (4-6 bullet points max, use "You'll be:" format)
- Must be comfortable with (physical/environment expectations)
- Nice to have qualifications (keep realistic, mention bilingual as plus if relevant)

DO NOT include "How to Apply" sections - applications will be handled through the platform.

Return ONLY a JSON object with these exact fields:
{
  "title": "Specific job title (not generic)",
  "location": "City, CA",
  "salary": "$XX-XX/hr or annual",
  "description": "The complete job post text with all sections",
  "requirements": "Extracted key requirements as bullet points",
  "contactMethod": "Email or phone from the prompt",
  "schedule": "Shift details if mentioned",
  "benefits": "Any benefits mentioned"
}`;

    try {
      // Try OpenAI first
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty AI response');
      }

      // Parse JSON response
      let jobData;
      try {
        // Clean up the response - remove markdown code blocks if present
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        jobData = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        throw new Error('Invalid AI response format');
      }

      // Validate required fields
      if (!jobData.title || !jobData.location || !jobData.salary) {
        throw new Error('AI response missing required fields');
      }

      // Clean the description to remove "How to Apply" sections
      if (jobData.description) {
        jobData.description = jobData.description
          .replace(/How to Apply:.*$/gms, '')
          .replace(/Ready to start ASAP\?.*$/gms, '')
          .trim();
      }

      return NextResponse.json({
        success: true,
        jobData
      });

    } catch (aiError) {
      console.error('AI generation failed:', aiError);
      
      // Rule-based fallback system - always works
      const fallbackJobData = generateFallbackJob(prompt.trim());
      
      return NextResponse.json({
        success: true,
        jobData: fallbackJobData,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Magic job creation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate job posting. Please try again.' },
      { status: 500 }
    );
  }
}

// Rule-based fallback job generation with improved format
function generateFallbackJob(prompt: string): any {
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract title from prompt
  let title = 'General Worker';
  let jobType = 'general';
  if (lowerPrompt.includes('warehouse')) { title = 'Warehouse Associate'; jobType = 'warehouse'; }
  else if (lowerPrompt.includes('cashier')) { title = 'Cashier'; jobType = 'retail'; }
  else if (lowerPrompt.includes('driver')) { title = 'Delivery Driver'; jobType = 'driver'; }
  else if (lowerPrompt.includes('retail') || lowerPrompt.includes('sales')) { title = 'Sales Associate'; jobType = 'retail'; }
  else if (lowerPrompt.includes('office') || lowerPrompt.includes('admin')) { title = 'Administrative Assistant'; jobType = 'office'; }
  else if (lowerPrompt.includes('cook') || lowerPrompt.includes('kitchen')) { title = 'Line Cook'; jobType = 'kitchen'; }
  else if (lowerPrompt.includes('clean')) { title = 'Janitor/Cleaner'; jobType = 'cleaning'; }
  else if (lowerPrompt.includes('security')) { title = 'Security Officer'; jobType = 'security'; }
  else if (lowerPrompt.includes('forklift')) { title = 'Forklift Operator'; jobType = 'warehouse'; }
  
  // Extract location
  let location = 'Stockton, CA';
  if (lowerPrompt.includes('modesto')) location = 'Modesto, CA';
  else if (lowerPrompt.includes('fresno')) location = 'Fresno, CA';
  else if (lowerPrompt.includes('tracy')) location = 'Tracy, CA';
  else if (lowerPrompt.includes('lathrop')) location = 'Lathrop, CA';
  else if (lowerPrompt.includes('manteca')) location = 'Manteca, CA';
  else if (lowerPrompt.includes('sacramento')) location = 'Sacramento, CA';
  
  // Extract salary or use defaults based on job type
  let salary = '$16-19/hr';
  const salaryMatch = prompt.match(/\$(\d+(?:\.\d+)?)/);
  if (salaryMatch) {
    const amount = parseFloat(salaryMatch[1]);
    if (amount > 1000) {
      salary = `$${amount.toLocaleString()}/year`;
    } else {
      salary = `$${amount}/hr`;
    }
  } else {
    // Default salaries by job type
    if (jobType === 'warehouse') salary = '$17-20/hr';
    else if (jobType === 'driver') salary = '$18-22/hr';
    else if (jobType === 'office') salary = '$18-21/hr';
    else if (jobType === 'security') salary = '$16-19/hr';
  }
  
  // Extract contact method if provided
  let contactMethod = 'hr@localcompany.com';
  const emailMatch = prompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = prompt.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (emailMatch) contactMethod = emailMatch[0];
  else if (phoneMatch) contactMethod = phoneMatch[0];
  
  // Extract schedule details
  let schedule = 'Full-time';
  if (lowerPrompt.includes('night')) schedule = 'Night shift';
  else if (lowerPrompt.includes('swing')) schedule = 'Swing shift';
  else if (lowerPrompt.includes('weekend')) schedule = 'Weekends required';
  else if (lowerPrompt.includes('part')) schedule = 'Part-time';
  else if (lowerPrompt.includes('morning') || lowerPrompt.includes('early')) schedule = 'Early morning shift';
  
  // Generate job-specific descriptions
  const jobDescriptions = {
    warehouse: `We're a busy distribution center in ${location.split(',')[0]} looking for a reliable ${title} to join our team. We're locally owned and operated, with strong ties to the Central Valley community. Easy commute from Highway 99 or I-5.

You'll be:
• Loading and unloading trucks using pallet jacks or forklifts
• Organizing inventory and maintaining warehouse cleanliness
• Picking and packing orders accurately
• Working as part of a team to meet daily goals
• Following safety protocols at all times

Must be comfortable with:
• Standing and walking for full shifts
• Lifting up to 50 pounds regularly
• Working in a non-climate controlled warehouse
• ${schedule === 'Early morning shift' ? 'Starting work at 5 AM' : 'Flexible scheduling'}

Nice to have: Forklift certification, warehouse experience, bilingual (English/Spanish).`,
    
    retail: `Join our retail team in ${location.split(',')[0]}! We're a community-focused store that takes pride in serving our neighbors. Great for locals looking for steady work with a flexible schedule.

You'll be:
• Greeting customers with a friendly attitude
• Operating cash register and handling transactions
• Stocking shelves and maintaining store appearance
• Answering customer questions about products
• Working with team members to ensure smooth operations

Must be comfortable with:
• Standing for extended periods
• Weekend and evening availability
• Basic math and computer skills
• Interacting with diverse customers

Nice to have: Previous retail or customer service experience, bilingual abilities.`,
    
    driver: `We need dependable drivers to join our ${location.split(',')[0]} team. Perfect for someone who knows the Central Valley roads and wants to stay local - no long hauls or overnight trips.

You'll be:
• Making deliveries throughout the ${location.split(',')[0]} area
• Loading and securing cargo in delivery vehicles
• Maintaining delivery logs and collecting signatures
• Providing excellent customer service at each stop
• Performing basic vehicle inspections

Must be comfortable with:
• Valid CA driver's license with clean record
• Lifting packages up to 50 pounds
• Using GPS and delivery apps
• Working independently with minimal supervision

Nice to have: Commercial driving experience, knowledge of local routes, bilingual skills.`,
    
    security: `Join our security team protecting a ${location.split(',')[0]} facility. We're looking for observant, reliable individuals who take pride in keeping people and property safe.

You'll be:
• Monitoring facility entrances and checking credentials
• Conducting regular patrols of the premises
• Writing clear incident reports when needed
• Responding to alarms and emergencies
• Assisting employees and visitors with directions

Must be comfortable with:
• Standing and walking for extended periods
• Working alone during quiet hours
• ${schedule.includes('Night') ? 'Staying alert during overnight shifts' : 'Interacting professionally with employees'}
• Basic computer skills for report writing

Nice to have: Guard card, previous security experience, bilingual abilities.`,
    
    general: `We're hiring in ${location.split(',')[0]}! Looking for hardworking individuals to join our growing team. This is a great opportunity for someone seeking stable employment close to home.

You'll be:
• Performing various tasks as assigned by supervisors
• Maintaining a clean and safe work environment
• Working collaboratively with team members
• Following company policies and procedures
• Learning new skills on the job

Must be comfortable with:
• Physical work in various conditions
• Following directions and staying on task
• Reliable attendance and punctuality
• Working as part of a team

Nice to have: Related work experience, strong work ethic, bilingual skills.`
  };
  
  const description = jobDescriptions[jobType as keyof typeof jobDescriptions] || jobDescriptions.general;
  
  // Don't add application instructions - will be handled by the platform
  const fullDescription = description;
  
  return {
    title,
    location,
    salary,
    description: fullDescription,
    requirements: `• Must be 18+ with valid ID\n• Reliable transportation to ${location.split(',')[0]}\n• Able to pass background check\n• ${jobType === 'driver' ? 'Valid CA driver\'s license' : 'Legal right to work in US'}`,
    contactMethod,
    schedule,
    benefits: lowerPrompt.includes('benefit') ? 'Health insurance • Paid time off • 401k matching' : ''
  };
}