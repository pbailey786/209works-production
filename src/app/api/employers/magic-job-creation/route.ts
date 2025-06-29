import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';
import { prisma } from '@/lib/database/prisma';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();
    
    // Get employer profile data for smart defaults
    const userEmail = clerkUser.emailAddresses[0].emailAddress;
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        companyName: true,
        businessLocation: true,
        contactEmail: true,
        contactPhone: true,
        industry: true
      }
    });
    
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

${user?.companyName ? `Company: ${user.companyName}` : ''}
${user?.businessLocation ? `Default Location: ${user.businessLocation}` : ''}
${user?.industry ? `Industry: ${user.industry}` : ''}

The tone should be friendly but professional, targeting Central Valley workers who want a steady job, a supportive team, and clear expectations.

Include these sections:

1. Company intro (2 sentences max - local, authentic, Central Valley focused)

2. "What you'll be doing:" (5-7 bullet points)
   - Start each with an action verb
   - Be specific but concise
   - Include both routine tasks AND growth opportunities

3. "What we need:" (4-6 bullet points)
   - Start with absolute must-haves
   - Include soft skills (reliability, teamwork)
   - End with nice-to-haves (experience, bilingual)

4. "The details:" (3-4 bullet points)
   - Schedule/shift information
   - Physical requirements if any
   - Work environment (indoor/outdoor, team size)
   - Any special conditions

Keep each bullet point to ONE line (under 70 characters). Be specific but not overwhelming.
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
      const fallbackJobData = generateFallbackJob(prompt.trim(), user);
      
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
function generateFallbackJob(prompt: string, user: any): any {
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
  
  // Extract location - use user's business location as default
  let location = user?.businessLocation || 'Stockton, CA';
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
  
  // Extract contact method if provided - use user's contact info as default
  let contactMethod = user?.contactEmail || user?.contactPhone || 'hr@localcompany.com';
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
  
  // Generate job-specific descriptions with company context
  const companyIntro = user?.companyName 
    ? `${user.companyName} is looking for` 
    : `We're a growing local business in ${location.split(',')[0]} looking for`;
  
  const jobDescriptions = {
    warehouse: `${companyIntro} reliable warehouse workers. ${user?.companyName ? 'We have' : 'Family-owned with'} strong Central Valley roots and value hard work and treating our team right.

What you'll be doing:
• Load and unload trucks using pallet jacks and hand trucks
• Pick and pack customer orders with accuracy
• Organize inventory and maintain warehouse cleanliness  
• Operate warehouse equipment safely (training provided)
• Work with team to meet daily shipping goals
• Assist with inventory counts and cycle checks
• Help train new team members as you grow

What we need:
• Reliable transportation to ${location.split(',')[0]}
• Ability to lift 50 lbs repeatedly throughout shift
• Strong work ethic and positive attitude
• Basic math skills for counting inventory
• Previous warehouse experience (preferred but not required)
• Bilingual English/Spanish is a plus

The details:
• ${schedule === 'Early morning shift' ? '5 AM - 1:30 PM shift' : 'Full-time day shift'}
• Non-climate controlled warehouse environment
• 10-person team in 50,000 sq ft facility
• Safety shoes required (we provide discount program)`,
    
    retail: `Join our ${location.split(',')[0]} retail team! ${user?.companyName || 'We\'re'} ${user?.companyName ? 'is' : ''} a community staple that's been serving Central Valley families for years. Looking for friendly folks who enjoy helping neighbors find what they need.

What you'll be doing:
• Greet and assist customers with product selection
• Operate POS system and handle cash/card transactions
• Stock shelves and maintain attractive displays
• Answer product questions and make recommendations
• Process returns and exchanges professionally
• Keep store clean and organized throughout shift
• Support teammates during busy periods

What we need:
• Friendly personality and genuine desire to help
• Weekend and evening availability required
• Basic math skills for handling money
• Ability to stand/walk for entire shift
• Retail or customer service experience preferred
• Bilingual English/Spanish strongly desired

The details:
• Rotating schedule (must have open availability)
• Climate-controlled retail environment
• 15-20 person team across all shifts
• Employee discount on all merchandise`,
    
    driver: `${user?.companyName || 'We'} need${user?.companyName ? 's' : ''} dependable drivers to join our ${location.split(',')[0]} team. Perfect for someone who knows the Central Valley roads and wants to stay local - no long hauls or overnight trips.

What you'll be doing:
• Make local deliveries throughout ${location.split(',')[0]} area
• Load and secure cargo safely in delivery vehicles
• Maintain accurate delivery logs and collect signatures
• Provide friendly customer service at each stop
• Perform pre-trip vehicle safety inspections
• Plan efficient routes to meet delivery deadlines
• Handle packages with care and professionalism

What we need:
• Valid CA driver's license with clean record
• Ability to lift packages up to 50 pounds repeatedly
• Smartphone skills for GPS and delivery apps
• Self-motivated with minimal supervision needed
• Previous delivery or driving experience (preferred)
• Bilingual English/Spanish is a plus

The details:
• ${schedule === 'Early morning shift' ? '4 AM - 12 PM shift' : 'Full-time day shift'}
• Company vehicle provided for deliveries
• Average 15-20 stops per day
• Weekly pay with performance bonuses`,
    
    security: `Join ${user?.companyName ? `${user.companyName}'s` : 'our'} security team protecting a ${location.split(',')[0]} facility. We're looking for observant, reliable individuals who take pride in keeping people and property safe.

What you'll be doing:
• Monitor facility entrances and check credentials
• Conduct hourly patrols of premises and parking areas
• Write detailed incident reports when needed
• Respond quickly to alarms and emergencies
• Assist employees and visitors with directions
• Operate security cameras and access control systems
• Maintain professional presence at all times

What we need:
• High school diploma or equivalent
• Ability to stand/walk for entire shift
• Strong written and verbal communication skills
• Clean background check required
• Valid CA Guard Card (or ability to obtain)
• Previous security experience preferred

The details:
• ${schedule.includes('Night') ? 'Night shift (10 PM - 6 AM)' : 'Day shift (6 AM - 2 PM)'}
• Solo posts with radio backup support
• Indoor/outdoor patrol responsibilities
• Uniform and equipment provided`,
    
    general: `${user?.companyName || 'We\'re'} ${user?.companyName ? 'is' : ''} hiring in ${location.split(',')[0]}! Looking for hardworking individuals to join our growing team. This is a great opportunity for someone seeking stable employment close to home.

What you'll be doing:
• Perform various tasks as assigned by supervisors
• Maintain clean and organized work areas
• Assist team members with daily operations
• Follow all safety protocols and procedures
• Learn new skills through on-the-job training
• Communicate effectively with team and management
• Complete tasks efficiently and accurately

What we need:
• Reliable transportation to ${location.split(',')[0]}
• Strong work ethic and positive attitude
• Ability to follow instructions carefully
• Team player who helps where needed
• Physical ability for standing/lifting
• Open to learning new skills

The details:
• ${schedule} schedule available
• On-the-job training provided
• Growth opportunities for motivated workers
• Supportive team environment`
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