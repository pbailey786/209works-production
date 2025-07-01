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
    const systemPrompt = `You're a professional job posting writer for Central Valley employers. Your job is to extract the EXACT job title from the user's prompt and create structured job data.

CRITICAL: Extract the EXACT job title mentioned in the prompt - don't change it!

You must return a JSON object with these fields:
- title: The exact job title from the prompt
- location: City, CA (use defaults if not mentioned)
- salary: Hourly or annual rate
- description: A clean 2-3 paragraph overview of the company and role (NO bullet points, NO sections)
- requirements: A simple bullet list of 5-7 requirements starting with •
- benefitOptions: Array of benefits (only include what's explicitly mentioned)

IMPORTANT RULES:
1. The "description" field should ONLY contain:
   - 1st paragraph: Company introduction (vary the style - avoid "seeking" or "looking for")
   - 2nd paragraph: Role overview and daily responsibilities
   - 3rd paragraph: Why this role matters and growth opportunities
   
2. DO NOT include these in the description:
   - "What You'll Do" sections
   - Bullet points or lists
   - Requirements or qualifications
   - Contact information
   - Application instructions

3. Keep requirements simple and clean:
   • Previous experience in [relevant field]
   • [Education/certification] required
   • Physical ability to [specific tasks]
   • [Technical skills] proficiency
   • [Soft skills] needed

INTRO VARIETY - Rotate through these styles:
- Question Hook: "Ready to make a difference in..."
- Company Pride: "As a leading [industry] company in [city]..."
- Mission Focus: "Our mission is to provide..."
- Team Focus: "Join our dedicated team of professionals..."
- Opportunity Focus: "This is your chance to grow with..."
- Direct: "We're hiring a [title] to help us..."
- Industry Expertise: "With over [X] years serving [city]..."`;

    const userPrompt = `Job posting request: "${prompt.trim()}"

Extract the EXACT job title from this request. Common patterns:
- "Property Manager" → use "Property Manager" 
- "We need a warehouse worker" → use "Warehouse Worker"
- "Hiring front desk" → use "Front Desk Coordinator"

Company context:
${user?.companyName ? `Company: ${user.companyName}` : ''}
${user?.businessLocation ? `Location: ${user.businessLocation}` : ''}
${user?.industry ? `Industry: ${user.industry}` : ''}

Create a professional job posting with:

1. DESCRIPTION (2-3 clean paragraphs, NO bullet points):
   - Paragraph 1: Company intro (vary the style, be engaging)
   - Paragraph 2: What they'll do in this role (be specific about daily tasks)
   - Paragraph 3: Why this role matters and growth opportunities

2. REQUIREMENTS (5-7 bullet points with •):
   • Relevant experience or education
   • Technical skills needed
   • Physical requirements if applicable
   • Soft skills and personality traits
   • Any certifications or licenses

3. BENEFITS (only what's mentioned in the prompt):
   - Don't make up benefits not in the original request
   - Always include the salary as first benefit

Return this exact JSON structure:
{
  "title": "[exact job title from prompt]",
  "location": "[City, CA]",
  "salary": "[$XX-XX/hr or annual]",
  "description": "[2-3 paragraphs - company intro, role overview, growth opportunities]",
  "requirements": "[bullet list with • starting each line]",
  "contactMethod": "[email or phone if provided]",
  "schedule": "[shift/schedule if mentioned]",
  "benefitOptions": [
    {"icon": "💰", "title": "Competitive Pay", "description": "[salary details]", "key": "benefit_1"}
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
  
  // Generate clean job descriptions (2-3 paragraphs)
  const jobDescriptions = {
    warehouse: `${intro} We're a growing operation that values hard work, safety, and teamwork. Our warehouse team is the backbone of our business, ensuring products move efficiently from our facility to customers throughout the Central Valley.

In this role, you'll handle inventory management, order fulfillment, and shipping/receiving duties. You'll work with a close-knit team that takes pride in maintaining an organized, efficient warehouse operation. This position offers steady hours, competitive pay, and the opportunity to advance into supervisory roles as you gain experience.`,
    
    retail: `${intro} We've built our reputation on exceptional customer service and creating a welcoming shopping experience for Central Valley families. Our team members are more than employees - they're the reason customers keep coming back.

As part of our retail team, you'll assist customers, handle transactions, maintain store appearance, and contribute to a positive shopping environment. This role is perfect for someone who enjoys interacting with people and takes pride in helping others find what they need. We offer a supportive work environment where your contributions are valued and recognized.`,
    
    driver: `${intro} Our delivery drivers are essential to our operations, ensuring timely and professional service to customers throughout the region. We prioritize safety, reliability, and customer satisfaction in everything we do.

You'll manage daily delivery routes, maintain accurate records, and provide excellent customer service at each stop. This position offers the independence of being on the road while being part of a supportive team. With no overnight trips and predictable schedules, you'll enjoy work-life balance while earning competitive wages.`,
    
    management: `${intro} This leadership position offers the opportunity to make a real impact on our operations and drive business growth. We're looking for someone who can balance operational excellence with exceptional customer service.

You'll oversee daily operations, manage staff, handle customer relations, and ensure facility standards are maintained. This includes everything from financial management to team development. Your leadership will directly influence our success and customer satisfaction. We provide the tools and support you need to excel, with clear paths for advancement within our organization.`,
    
    general: `${intro} We're looking for dedicated individuals who want to be part of a growing company that values its employees. This is an opportunity to join a stable organization with a strong presence in the Central Valley.

You'll contribute to our daily operations and be part of a team that takes pride in quality work. We offer competitive wages, consistent schedules, and a respectful work environment where your efforts are appreciated. This position provides the stability you need with the growth potential you want.`
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