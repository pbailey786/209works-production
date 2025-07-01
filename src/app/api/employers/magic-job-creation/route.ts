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
    const systemPrompt = `You're a professional job posting writer for Central Valley employers. Your job is to extract the EXACT job title and requirements from the user's prompt and create structured job data.

CRITICAL: READ THE USER'S PROMPT CAREFULLY AND EXTRACT THE EXACT JOB THEY'RE ASKING FOR!

IMPORTANT: You must return structured JSON with separated fields:
- description: Company intro and role overview ONLY (no bullet points)
- requirements: Bullet point list of qualifications
- benefitOptions: Array of benefit objects with icon, title, description

EXAMPLE 1 - Warehouse Associate:
"Ready to join a growing team? We're seeking a reliable Warehouse Associate for our fast-paced distribution center.

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
"Love helping people? Our customer service team is the heart of our operation, and we need someone who shares our passion for exceptional service.

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

INTRO VARIETY REQUIREMENTS:
You MUST vary your company introduction style. Choose from these approaches (rotate through them):

Style 1 - Question Hook: "Ready to join..." / "Looking for..." / "Want to..."
Style 2 - Company Pride: "We're [company type] with deep Central Valley roots..."
Style 3 - Mission Focus: "Our mission is..." / "We believe in..."
Style 4 - Team Focus: "Join our tight-knit team..." / "Be part of..."
Style 5 - Opportunity Focus: "This is more than a job..." / "Here's your chance to..."
Style 6 - Direct & Friendly: "We're hiring!" / "Great opportunity for..."
Style 7 - Industry Expertise: "As [industry] leaders..." / "With [X] years in business..."

CRITICAL FORMATTING INSTRUCTIONS:

You MUST generate job posts with this EXACT format for ALL job types:

[Varied company intro - 1-2 sentences using different styles]

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

    const userPrompt = `ANALYZE THIS JOB POSTING REQUEST: "${prompt.trim()}"

STEP 1: EXTRACT THE EXACT JOB TITLE
Look for phrases like:
- "Property Manager" (use exactly this)
- "We need a warehouse worker" (title = "Warehouse Worker")  
- "Hiring a cashier" (title = "Cashier")
- "Storage facility manager" (title = "Storage Facility Manager")

DO NOT change the job title to something generic! If they say "Property Manager" don't make it "General Worker"!

CRITICAL: Structure your response properly:
- Put ONLY the company intro and role overview in "description" 
- Put the bullet point requirements in "requirements"
- Extract any benefits into the "benefitOptions" array

STEP 2: CREATE A UNIQUE COMPANY INTRO
Use one of the 7 intro styles and make it fresh:
${user?.companyName ? `Company: ${user.companyName}` : ''}
${user?.businessLocation ? `Default Location: ${user.businessLocation}` : ''}
${user?.industry ? `Industry: ${user.industry}` : ''}

CRITICAL ACCURACY RULES:
- EXTRACT the EXACT job title mentioned in the prompt above
- DO NOT make up benefits (health insurance, 401k, PTO) unless explicitly mentioned
- DO NOT change the job title to something different
- If prompt says "Property Manager" the title MUST be "Property Manager" 
- If prompt says "Storage Manager" the title MUST be "Storage Manager"
- Focus on the work itself - be specific about daily tasks and responsibilities
- Only mention what you know from the prompt - don't invent company details

CRITICAL STRUCTURE FOR JSON RESPONSE:

1. "description" field: Write a comprehensive 3-4 paragraph job description
   - Paragraph 1: Company introduction using varied intro styles (avoid "seeking", "looking for")  
   - Paragraph 2: Detailed daily responsibilities and specific tasks (be very specific!)
   - Paragraph 3: Why this role matters, growth opportunities, and impact on the business
   - Paragraph 4: Work environment, team dynamics, and company culture
   - Make it engaging and informative - this is the main content job seekers will read

2. "requirements" field: 5-7 specific bullet points
   • Must start each line with a bullet (•)
   • Be specific: "Previous property management experience" not just "experience"
   • Include both hard skills (Excel, software) and soft skills (customer service)
   • Add physical requirements if applicable

3. "benefitOptions" array: Create 3-5 compelling benefits
   - Always include competitive pay with the actual salary range
   - Add relevant benefits based on job type (health insurance for full-time, flexible schedule for part-time)
   - Each benefit needs: emoji icon, descriptive title, detailed description, unique key

DO NOT include:
- "What You'll Do" sections (save for later editing)
- Application instructions
- Contact details in the description

Return ONLY a JSON object with these exact fields:
{
  "title": "EXACT job title from the prompt (not generic!)",
  "location": "City, CA", 
  "salary": "$XX-XX/hr or annual",
  "description": "Write a comprehensive job description with 3-4 detailed paragraphs: 1) Company introduction and culture, 2) Detailed role overview and daily responsibilities, 3) Why this position matters and growth opportunities, 4) Work environment and team dynamics. Make it engaging and specific - include actual tasks, not just generic descriptions.",
  "requirements": "5-7 bullet points starting with • for qualifications, experience, skills needed",
  "contactMethod": "Email or phone from the prompt",
  "schedule": "Shift details if mentioned", 
  "benefitOptions": [
    {"icon": "💰", "title": "Competitive Pay", "description": "Details if mentioned", "key": "benefit_1"},
    {"icon": "🏥", "title": "Health Benefits", "description": "If mentioned", "key": "benefit_2"},
    {"icon": "📅", "title": "PTO/Vacation", "description": "If mentioned", "key": "benefit_3"}
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
  const companyIntro = user?.companyName 
    ? `${user.companyName} is looking for` 
    : `We're a growing local business in ${location.split(',')[0]} looking for`;
  
  const jobDescriptions = {
    warehouse: `${companyIntro} reliable warehouse workers to join our distribution team. ${user?.companyName ? 'We have' : 'As a family-owned business with'} strong Central Valley roots, we value hard work, treat our team right, and offer opportunities for growth. Our ${location.split(',')[0]} facility operates with a close-knit team where everyone's contribution matters. This is more than just a job - it's a chance to build a career with a company that invests in its people.`,
    
    retail: `Join our ${location.split(',')[0]} retail team! ${user?.companyName || 'We\'re'} ${user?.companyName ? 'is' : ''} a community staple that's been serving Central Valley families for years. We pride ourselves on creating a welcoming environment where both customers and employees feel valued. If you enjoy helping people and want to be part of a team that makes a difference in the community, this is the place for you.`,
    
    driver: `${companyIntro} dependable delivery drivers to join our ${location.split(',')[0]} team. Perfect for someone who knows the Central Valley roads and wants to stay local - no long hauls or overnight trips. We offer steady routes, competitive pay, and the chance to be home every night with your family. Our drivers are the face of our company, and we value those who take pride in safe driving and excellent customer service.`,

    security: `Join ${user?.companyName ? `${user.companyName}'s` : 'our'} security team protecting our ${location.split(',')[0]} facility. We're looking for observant, reliable individuals who take pride in keeping people and property safe. This role offers stability, professional growth opportunities, and the satisfaction of being an essential part of our operations. We believe in treating our security team as valued professionals who contribute to everyone's safety and success.`,
    
    management: `${user?.companyName || 'We\'re'} ${user?.companyName ? 'is' : ''} seeking an experienced ${title} for our ${location.split(',')[0]} facility. This is a perfect opportunity for someone with leadership skills who wants to make a real impact in a growing Central Valley business.

In this hands-on management role, you'll oversee all aspects of daily operations including customer relations, facility maintenance coordination, staff supervision, and financial management. Your typical day includes meeting with prospective tenants, conducting facility tours, processing rental agreements, handling customer service inquiries, coordinating maintenance repairs, managing delinquent accounts, and ensuring our facility maintains the highest standards of cleanliness and security.

This position offers significant growth potential and the opportunity to directly impact our business success. As a key decision-maker, you'll implement operational improvements, develop customer retention strategies, and build strong relationships within the local community. We believe in promoting from within and providing our management team with the resources and support needed to excel.

You'll work in a professional environment with a close-knit team that values collaboration, innovation, and exceptional customer service. Our facility features modern amenities, and we pride ourselves on maintaining a positive workplace culture where your contributions are recognized and rewarded.`,
    
    general: `${user?.companyName || 'We\'re'} ${user?.companyName ? 'is' : ''} hiring in ${location.split(',')[0]}! Looking for hardworking individuals to join our growing team. This is a great opportunity for someone seeking stable employment with a company that values its employees. We believe in fair pay, respectful treatment, and providing opportunities for our team members to learn and advance. If you're ready to contribute to a positive work environment and grow your career, we want to hear from you.`
  };
  
  const description = jobDescriptions[jobType as keyof typeof jobDescriptions] || jobDescriptions.general;
  
  // Extract only the company intro paragraphs, not the full job listing
  const descriptionLines = description.split('\n');
  let companyDescription = '';
  
  // Find where "What you'll be doing:" starts and only take content before that
  for (const line of descriptionLines) {
    if (line.includes('What you') || line.includes('What we') || line.includes('The details')) {
      break;
    }
    companyDescription += line + '\n';
  }
  
  const fullDescription = companyDescription.trim() || description.split('\n\n')[0];
  
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