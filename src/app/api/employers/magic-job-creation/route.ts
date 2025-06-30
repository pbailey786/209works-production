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

    // Enhanced AI prompt with professional examples
    const systemPrompt = `You're a professional job posting writer for Central Valley employers. Study these examples of well-written job posts and match their quality and structure:

EXAMPLE 1 - Warehouse Associate:
"About Our Company: We are seeking a capable Warehouse Associate to support our company's warehouse operations.

What You'll Do:
• Process, package, and ship orders accurately
• Organize stocks and maintain inventory
• Inspect products for defects and damages
• Receive and place incoming inventory items appropriately
• Operate forklift, hand truck, pallet jack safely
• Maintain a clean and organized warehouse daily

What We're Looking For:
• Proven warehouse experience preferred
• Ability to operate warehouse equipment
• Strong organizational skills
• Ability to lift and move heavy products
• High school diploma
• Team player with problem-solving abilities"

EXAMPLE 2 - Customer Service:
"Join Our Team! We are seeking a customer-oriented service representative.

Your Daily Impact:
• Manage large volumes of incoming phone calls with professionalism
• Generate sales leads and identify customer needs
• Build sustainable customer relationships through exceptional service
• Provide accurate information using CRM systems
• Handle customer complaints and provide solutions
• Maintain comprehensive customer interaction records

What You Bring:
• Proven customer support experience
• Strong phone and active listening skills
• Excellent communication and multi-tasking abilities
• Patient, empathetic, and passionate about helping others"

CRITICAL FORMATTING INSTRUCTIONS:

You MUST generate job posts with this EXACT format for ALL job types:

[Company intro - 1-2 sentences]

What You'll Do:
• [Action verb + specific task detail]
• [Action verb + specific task detail]
• [Action verb + specific task detail]
• [Action verb + specific task detail]
• [Action verb + specific task detail]
• [Action verb + specific task detail]

What We're Looking For:
• [Education/certification requirement]
• [Experience requirement]
• [Physical requirement if applicable]
• [Technical skill or ability]
• [Soft skill or personality trait]
• [Preferred qualification]

The Details:
• [Schedule/shift information]
• [Work environment details]
• [Any special conditions]

USE THE BULLET CHARACTER (•) NOT ASTERISKS (*) OR DASHES (-)
EVERY job must have these sections with bullet points - no exceptions!`;

    const userPrompt = `Write a job post for: ${prompt.trim()}

${user?.companyName ? `Company: ${user.companyName}` : ''}
${user?.businessLocation ? `Default Location: ${user.businessLocation}` : ''}
${user?.industry ? `Industry: ${user.industry}` : ''}

IMPORTANT RULES:
- DO NOT make up benefits (health insurance, 401k, PTO) unless explicitly mentioned in the prompt
- Focus on the work itself - be specific about daily tasks and responsibilities
- Add realistic details about the work environment and team dynamics
- Only mention what you know from the prompt - don't invent company details
- If they mention benefits in the prompt, include them. Otherwise, leave benefits section empty.

Write a professional job post following this exact structure:

1. **Company intro** (1-2 sentences) - Professional opening about the company and role

2. **"What You'll Do:" or "Your Daily Impact:"** (6-8 detailed bullet points)
   - Use action verbs (Process, Manage, Organize, Assist, etc.)
   - Think about a FULL day - what happens in morning vs afternoon?
   - Include both routine tasks AND occasional responsibilities
   - Be specific: instead of "help customers", say "greet customers at entrance, answer product questions, guide them to correct aisle"
   - Include team collaboration and who they'll work with

3. **"What We're Looking For:" or "What You Bring:"** (5-7 bullet points)
   - Start with education/experience requirements
   - Include specific skills and abilities
   - Mention physical requirements if applicable
   - Add personality traits and soft skills
   - End with preferred qualifications

4. **Optional "The Details:"** (only if shift/environment details needed)
   - Schedule information
   - Work environment specifics
   - Special conditions or benefits

MANDATORY REQUIREMENTS:
- MUST use bullet points (•) in "What You'll Do:" and "What We're Looking For:" sections
- Each bullet point MUST be a complete, detailed sentence (not just 3-4 words)
- Follow the professional structure shown in examples above
- Apply this format to ANY job type - the structure never changes

DO NOT include "How to Apply" sections - applications will be handled through the platform.

Return ONLY a JSON object with these exact fields:
{
  "title": "Specific job title (not generic)",
  "location": "City, CA", 
  "salary": "$XX-XX/hr or annual",
  "description": "Put the ENTIRE formatted job post here including company intro, What You'll Do section with bullet points, What We're Looking For section with bullet points, and any other sections. ALL content goes in this single description field.",
  "requirements": "5-7 bullet points for What We're Looking For section - education, experience, skills, physical requirements, personality traits, preferred qualifications",
  "contactMethod": "Email or phone from the prompt",
  "schedule": "Shift details if mentioned", 
  "benefits": "Any benefits mentioned"
}`;

    try {
      // Try OpenAI first
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1200,
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