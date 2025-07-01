import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';
import { prisma } from '@/lib/database/prisma';

export const maxDuration = 15; // Reduced timeout - fail fast to fallback

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
    const systemPrompt = `You're an expert in writing clear, modern job ads that help small businesses quickly attract qualified applicants.

Create a job ad that is BRIEF but PERSUASIVE using this exact structure:

ABOUT THE ROLE (2-3 sentences MAX):
- 1st sentence: What the job is and what the company does
- 2nd sentence: Key daily tasks in plain language
- 3rd sentence (optional): Why this role matters to the business

REQUIREMENTS (4-5 bullet points):
• Must-have skills and experience
• Nice-to-have qualifications
• Physical requirements if applicable
• Schedule flexibility needs

BENEFITS (3-4 bullet points of what they get):
• Pay rate/range
• Schedule stability or flexibility
• Work environment perks
• Growth opportunities

CRITICAL RULES:
- Be DIRECT and CONVERSATIONAL - no corporate jargon
- Use PLAIN LANGUAGE that anyone can understand
- Keep it SHORT - job seekers scan, they don't read novels
- Focus on WHAT THEY'LL ACTUALLY DO, not vague descriptions
- Extract the EXACT job title from the prompt - don't change it!`;

    const userPrompt = `Job posting: "${prompt.trim()}"

Company info:
${user?.companyName ? `Name: ${user.companyName}` : ''}
${user?.businessLocation ? `Location: ${user.businessLocation}` : ''}

Write a BRIEF job ad following this EXACT format:

DESCRIPTION (2-3 short sentences total):
Example: "We're a busy medical office in Stockton looking for a Front Desk Receptionist. You'll greet patients, schedule appointments, handle payments, and keep the front office running smoothly. This role is essential to creating a positive first impression for our patients."

REQUIREMENTS (4-5 bullet points):
• [Must-have experience/skills]
• [Technical requirements] 
• [Soft skills needed]
• [Schedule requirements]
• [Nice-to-have qualifications]

BENEFITS (3-4 simple benefits):
- Always list pay first
- Include basic perks like stable schedule, good team, etc.
- Don't invent benefits not mentioned

Return JSON:
{
  "title": "[exact title from prompt]",
  "location": "[City, CA]",
  "salary": "[exact pay from prompt]",
  "description": "[2-3 sentences ONLY - what company does, what role does, why it matters]",
  "requirements": "[4-5 bullet points with • symbol]",
  "contactMethod": "[email/phone from prompt]",
  "schedule": "[schedule from prompt]",
  "benefitOptions": [
    {"icon": "💰", "title": "[Pay title]", "description": "[Pay details]", "key": "benefit_1"},
    {"icon": "[emoji]", "title": "[Benefit]", "description": "[Details]", "key": "benefit_2"}
  ]
}`;

    try {
      // Try OpenAI first with timeout
      console.log('🤖 Attempting GPT-4 generation for prompt:', prompt.trim().substring(0, 100) + '...');
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo', // Switch back for reliability
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4, // Balanced for variety + accuracy
          max_tokens: 1200,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 8000) // 8 second timeout
        )
      ]) as any;

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty AI response');
      }
      
      console.log('✅ GPT-4 responded with content length:', content.length);

      // Parse JSON response
      let jobData;
      try {
        // Clean up the response - remove markdown code blocks if present
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        jobData = JSON.parse(cleanContent);
      } catch (parseError: any) {
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

    } catch (aiError: any) {
      console.error('🔥 AI generation failed:', aiError?.message || aiError);
      
      try {
        // Rule-based fallback system - always works
        console.log('🔄 Using fallback system for prompt:', prompt.trim().substring(0, 50) + '...');
        const fallbackJobData = generateFallbackJob(prompt.trim(), user);
        
        return NextResponse.json({
          success: true,
          jobData: fallbackJobData,
          fallback: true,
          message: 'Generated using fallback system (AI temporarily unavailable)'
        });
      } catch (fallbackError: any) {
        console.error('Fallback generation failed:', fallbackError);
        
        // Emergency simple fallback
        return NextResponse.json({
          success: true,
          jobData: {
            title: 'General Worker',
            location: user?.businessLocation || 'Stockton, CA',
            salary: '$16-19/hr',
            description: `We're hiring in ${user?.businessLocation || 'Stockton'}! Join our team for steady work in a supportive environment. We value hard workers who take pride in their contributions and are looking for someone ready to grow with us.`,
            requirements: '• Must be 18+ with valid ID\n• Reliable transportation\n• Able to pass background check\n• Legal right to work in US\n• Strong work ethic and positive attitude\n• Ability to follow instructions',
            contactMethod: user?.contactEmail || clerkUser.emailAddresses[0]?.emailAddress || 'hr@company.com',
            schedule: 'Full-time',
            benefitOptions: [
              {
                icon: '💰',
                title: 'Competitive Pay',
                description: '$16-19/hr based on experience',
                key: 'benefit_1'
              },
              {
                icon: '📈',
                title: 'Growth Opportunities',
                description: 'Advance within our company',
                key: 'benefit_2'
              }
            ]
          },
          fallback: true,
          emergency: true,
          message: 'Generated using emergency fallback (please try again)'
        });
      }
    }

  } catch (error: any) {
    console.error('Magic job creation error:', error);
    
    // Final emergency fallback - ensure we always return valid JSON
    try {
      return NextResponse.json({
        success: true,
        jobData: {
          title: 'General Worker',
          location: 'Stockton, CA',
          salary: '$16-19/hr',
          description: `We're hiring! Join our team for steady work in a supportive environment where your hard work is valued and recognized.`,
          requirements: '• Must be 18+ with valid ID\n• Reliable transportation\n• Able to pass background check\n• Legal right to work in US\n• Strong work ethic\n• Team player mentality',
          contactMethod: 'hr@company.com',
          schedule: 'Full-time',
          benefitOptions: [
            {
              icon: '💰',
              title: 'Competitive Pay',
              description: 'Starting at $16-19/hr',
              key: 'benefit_1'
            }
          ]
        },
        fallback: true,
        emergency: true,
        message: 'System temporarily unavailable - generated basic job post'
      });
    } catch (finalError: any) {
      console.error('Final fallback failed:', finalError);
      return NextResponse.json(
        { 
          error: 'Job posting system temporarily unavailable. Please try again in a few minutes.',
          success: false 
        },
        { status: 500 }
      );
    }
  }
}

// Rule-based fallback job generation with improved format
function generateFallbackJob(prompt: string, user: any): any {
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract title from prompt - check specific titles first, then general keywords
  let title = 'General Worker';
  let jobType = 'general';
  
  // Check for specific job titles first (most important)
  if (lowerPrompt.includes('property manager')) { title = 'Property Manager'; jobType = 'management'; }
  else if (lowerPrompt.includes('storage manager')) { title = 'Storage Manager'; jobType = 'management'; }
  else if (lowerPrompt.includes('facility manager')) { title = 'Facility Manager'; jobType = 'management'; }
  else if (lowerPrompt.includes('office manager')) { title = 'Office Manager'; jobType = 'office'; }
  else if (lowerPrompt.includes('warehouse supervisor')) { title = 'Warehouse Supervisor'; jobType = 'warehouse'; }
  
  // Then check for general job types
  else if (lowerPrompt.includes('front desk') || lowerPrompt.includes('receptionist')) { title = 'Front Desk Receptionist'; jobType = 'office'; }
  else if (lowerPrompt.includes('warehouse')) { title = 'Warehouse Associate'; jobType = 'warehouse'; }
  else if (lowerPrompt.includes('cashier')) { title = 'Cashier'; jobType = 'retail'; }
  else if (lowerPrompt.includes('driver')) { title = 'Delivery Driver'; jobType = 'driver'; }
  else if (lowerPrompt.includes('retail') || lowerPrompt.includes('sales associate')) { title = 'Sales Associate'; jobType = 'retail'; }
  else if (lowerPrompt.includes('office') || lowerPrompt.includes('admin')) { title = 'Administrative Assistant'; jobType = 'office'; }
  else if (lowerPrompt.includes('cook') || lowerPrompt.includes('kitchen')) { title = 'Line Cook'; jobType = 'kitchen'; }
  else if (lowerPrompt.includes('security')) { title = 'Security Officer'; jobType = 'security'; }
  else if (lowerPrompt.includes('forklift')) { title = 'Forklift Operator'; jobType = 'warehouse'; }
  
  // Only match cleaning jobs if it's clearly a cleaning position (not just mentions cleaning tasks)
  else if (lowerPrompt.includes('janitor') || lowerPrompt.includes('cleaner') || lowerPrompt.includes('cleaning position')) { 
    title = 'Janitor/Cleaner'; 
    jobType = 'cleaning'; 
  }
  
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
    else if (jobType === 'management') salary = '$19-23/hr';
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
  const companyName = user?.companyName || 'Our company';
  const city = location.split(',')[0];
  
  // Create varied intros based on job type
  const intros = {
    warehouse: [
      `${companyName} is expanding our ${city} warehouse team.`,
      `Ready to build a career in logistics? ${companyName} has an opportunity for you.`,
      `Join ${companyName}'s distribution center in ${city}.`
    ],
    retail: [
      `${companyName} is a trusted name in ${city} retail.`,
      `Be the face of ${companyName} in our ${city} location.`,
      `${companyName} believes great customer service starts with great people.`
    ],
    driver: [
      `${companyName} keeps ${city} moving with reliable delivery services.`,
      `Home every night - that's the ${companyName} promise to our drivers.`,
      `${companyName} values safe, professional drivers who know ${city}.`
    ],
    management: [
      `${companyName} is seeking experienced leadership for our ${city} facility.`,
      `This is your opportunity to lead at ${companyName}.`,
      `${companyName} believes in promoting from within and developing leaders.`
    ],
    general: [
      `${companyName} is hiring in ${city}.`,
      `Join the ${companyName} team and grow your career.`,
      `${companyName} offers stability and opportunity in ${city}.`
    ]
  };
  
  // Get a random intro for variety
  const introOptions = intros[jobType as keyof typeof intros] || intros.general;
  const intro = introOptions[Math.floor(Math.random() * introOptions.length)];
  
  // Generate clean, concise job descriptions (2-3 sentences)
  const jobDescriptions = {
    warehouse: `We're a ${city} warehouse operation looking for reliable team members. You'll handle inventory, fulfill orders, load/unload trucks, and keep the warehouse organized. This role keeps our business running and offers opportunities to advance to lead or supervisor positions.`,
    
    retail: `We're a ${city} retail store that needs friendly staff to help customers and run the register. You'll assist shoppers, handle sales, stock shelves, and keep the store looking great. Good people skills and weekend availability are essential for this customer-facing role.`,
    
    driver: `We need reliable local delivery drivers to serve ${city} area customers. You'll run daily routes, deliver packages safely, and provide friendly service at each stop. Home every night with no long hauls - perfect for drivers who want work-life balance.`,
    
    management: `We're hiring a ${title} to oversee our ${city} facility operations. You'll manage staff, handle customer issues, maintain facility standards, and drive business growth. This hands-on leadership role is perfect for someone ready to make a real impact.`,
    
    general: `${companyName} in ${city} is hiring for immediate openings. You'll support daily operations and work with a team that values reliability and hard work. Stable hours and fair pay for someone ready to contribute.`,
    
    office: `We need an organized professional for our ${city} office. You'll handle phones, manage schedules, process paperwork, and support the team. Computer skills and a friendly demeanor are essential for this front-office role.`,
    
    cleaning: `We're hiring reliable cleaners for facilities in ${city}. You'll maintain cleanliness standards, empty trash, sanitize surfaces, and ensure a professional environment. Evening or early morning shifts available with consistent schedules.`,
    
    security: `We need alert security officers to protect our ${city} facility. You'll monitor premises, check credentials, respond to incidents, and ensure safety protocols are followed. Must have CA Guard Card or ability to obtain one.`
  };
  
  const fullDescription = jobDescriptions[jobType as keyof typeof jobDescriptions] || jobDescriptions.general;
  
  // Generate benefit options based on job type and prompt
  const benefitOptions = [];
  let benefitKey = 1;
  
  // Always add competitive pay with detailed description
  benefitOptions.push({
    icon: '💰',
    title: 'Competitive Pay',
    description: `${salary} based on experience with opportunity for raises`,
    key: `benefit_${benefitKey++}`
  });
  
  // Add benefits if mentioned or typical for job type
  if (lowerPrompt.includes('health') || lowerPrompt.includes('insurance') || jobType === 'management') {
    benefitOptions.push({
      icon: '🏥',
      title: 'Health Insurance',
      description: 'Comprehensive medical, dental, and vision coverage',
      key: `benefit_${benefitKey++}`
    });
  }
  
  if (lowerPrompt.includes('pto') || lowerPrompt.includes('vacation') || jobType === 'management' || jobType === 'office') {
    benefitOptions.push({
      icon: '🏖️',
      title: 'Paid Time Off',
      description: 'Generous vacation and sick leave policy',
      key: `benefit_${benefitKey++}`
    });
  }
  
  // Add growth opportunities for management roles
  if (jobType === 'management') {
    benefitOptions.push({
      icon: '📈',
      title: 'Career Growth',
      description: 'Professional development and advancement opportunities',
      key: `benefit_${benefitKey++}`
    });
    
    benefitOptions.push({
      icon: '🎓',
      title: 'Management Training',
      description: 'Ongoing leadership development and training programs',
      key: `benefit_${benefitKey++}`
    });
  }
  
  if (lowerPrompt.includes('401k') || lowerPrompt.includes('retirement')) {
    benefitOptions.push({
      icon: '🏦',
      title: '401k Plan',
      description: 'Retirement savings with company match',
      key: `benefit_${benefitKey++}`
    });
  }
  
  // Add schedule flexibility if part-time or flexible mentioned
  if (schedule.includes('Part-time') || lowerPrompt.includes('flexible')) {
    benefitOptions.push({
      icon: '⏰',
      title: 'Flexible Schedule',
      description: 'Work-life balance',
      key: `benefit_${benefitKey++}`
    });
  }

  // Generate job-specific requirements
  const requirementsByType = {
    warehouse: `• Must be 18+ with valid ID\n• Reliable transportation to ${location.split(',')[0]}\n• Ability to lift 50 lbs repeatedly\n• Previous warehouse experience preferred\n• Basic math skills for inventory\n• Able to pass background check`,
    
    retail: `• Must be 18+ with valid ID\n• Reliable transportation to ${location.split(',')[0]}\n• Weekend and evening availability\n• Friendly personality and customer focus\n• Basic math skills for cash handling\n• Previous retail/customer service experience preferred`,
    
    driver: `• Valid CA driver\'s license with clean record\n• Reliable transportation to ${location.split(',')[0]}\n• Ability to lift packages up to 50 pounds\n• Smartphone skills for delivery apps\n• Previous delivery experience preferred\n• Able to pass background check and drug test`,
    
    security: `• Must be 18+ with valid ID\n• CA Guard Card (or ability to obtain)\n• High school diploma or equivalent\n• Able to stand/walk for entire shift\n• Clean background check required\n• Previous security experience preferred`,
    
    management: `• Previous management or supervisory experience\n• Strong customer service skills\n• Proficiency with Microsoft Excel\n• Ability to handle money and records\n• Professional appearance\n• Bilingual English/Spanish preferred`,
    
    general: `• Must be 18+ with valid ID\n• Reliable transportation to ${location.split(',')[0]}\n• Strong work ethic and positive attitude\n• Ability to follow instructions\n• Physical ability for standing/lifting\n• Legal right to work in US`
  };

  return {
    title,
    location,
    salary,
    description: fullDescription,
    requirements: requirementsByType[jobType as keyof typeof requirementsByType] || requirementsByType.general,
    contactMethod,
    schedule,
    benefitOptions
  };
}