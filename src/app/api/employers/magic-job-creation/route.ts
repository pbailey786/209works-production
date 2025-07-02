import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';
import { prisma } from '@/lib/database/prisma';
import { jobEnhancer } from '@/lib/onet/job-enhancer';

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

    // Enhanced AI prompt for readable yet professional job descriptions 
    const systemPrompt = `You're an expert in writing job descriptions that balance professionalism with readability - more detailed than basic ads but more scannable than verbose corporate postings.

Create a well-structured job description using this format:

ABOUT THIS ROLE (3-4 sentences):
- What the company does and why this role matters
- 2-3 key daily responsibilities using action verbs
- What type of person thrives in this position

WHAT YOU'LL DO (5-6 specific bullet points):
• [Specific daily task with tools/systems mentioned]
• [Customer/client interaction responsibilities]
• [Technical duties or equipment operated]
• [Quality, safety, or compliance requirements]
• [Team collaboration or communication tasks]
• [Problem-solving or troubleshooting scenarios]

WHAT WE'RE LOOKING FOR (5-7 bullet points total):
Must-Have:
• [Required experience level and key skills]
• [Required certifications, licenses, or education]
• [Essential technical abilities or software]
• [Physical requirements if applicable]
Preferred:
• [Preferred experience that sets candidates apart]
• [Additional skills or certifications valued]
• [Nice-to-have qualifications]

WHAT WE OFFER (4-5 compelling benefits):
• Competitive compensation with specifics
• Professional development opportunities
• Work-life balance features
• Health and wellness benefits
• Company culture highlights

CRITICAL RULES:
- Write at PROFESSIONAL level but keep scannable
- Use INDUSTRY-SPECIFIC terminology appropriately  
- Be SPECIFIC about daily tasks, not vague
- Extract the EXACT job title from the prompt
- Focus on what they'll actually DO each day
- Balance detail with readability for job seekers`;

    const userPrompt = `Job posting: "${prompt.trim()}"

Company info:
${user?.companyName ? `Name: ${user.companyName}` : ''}
${user?.businessLocation ? `Location: ${user.businessLocation}` : ''}

Write a professional job description following the new format:

ABOUT THIS ROLE (3-4 sentences):
Example: "We're a growing plumbing company serving residential and commercial clients throughout Stockton and the Central Valley. As our Plumber, you'll diagnose and repair plumbing systems, install new fixtures, and ensure customer satisfaction on every call. You'll work with modern tools and equipment while building lasting relationships with clients who depend on our expertise. This role offers the opportunity to grow your skills while making a real impact in our community."

WHAT YOU'LL DO (5-6 specific daily tasks):
• [Specific task with tools/equipment mentioned]
• [Customer interaction or service delivery]
• [Technical work with systems/software] 
• [Quality or safety responsibilities]
• [Team collaboration or communication]
• [Problem-solving or troubleshooting]

WHAT WE'RE LOOKING FOR (split required vs preferred):
Required: 3-4 must-haves
Preferred: 2-3 nice-to-haves

WHAT WE OFFER (4-5 compelling benefits):
Always include compensation first, then growth, culture, benefits

Return JSON:
{
  "title": "[exact title from prompt]",
  "location": "[City, CA]", 
  "salary": "[exact pay from prompt]",
  "description": "[3-4 sentence professional role summary]",
  "responsibilities": "[5-6 specific daily tasks with • bullets]",
  "requirements": "[3-4 required qualifications with • bullets]", 
  "niceToHave": "[2-3 preferred qualifications with • bullets]",
  "contactMethod": "[email/phone from prompt]",
  "schedule": "[schedule from prompt]",
  "benefitOptions": [
    {"icon": "💰", "title": "Competitive Pay", "description": "[Detailed compensation info]", "key": "benefit_1"},
    {"icon": "📈", "title": "Career Growth", "description": "[Professional development opportunities]", "key": "benefit_2"},
    {"icon": "🏥", "title": "Benefits Package", "description": "[Health, PTO, retirement if mentioned]", "key": "benefit_3"},
    {"icon": "🎯", "title": "Great Culture", "description": "[Work environment and team culture]", "key": "benefit_4"}
  ]
}`;

    try {
      // Extract basic job info for O*NET lookup
      const jobTitleMatch = prompt.match(/(?:hiring|need|looking for|seeking)\s+(?:a\s+)?([^,.]+?)(?:\s+for|\s+in|\s+at|\s+to|,|\.)/i);
      const extractedTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'General Worker';
      
      // Try to get O*NET data first (non-blocking)
      let onetData = null;
      try {
        console.log('🔍 Looking up O*NET data for:', extractedTitle);
        onetData = await Promise.race([
          jobEnhancer.enhanceJobPosting({ 
            title: extractedTitle, 
            location: user?.businessLocation || 'Stockton, CA' 
          }),
          new Promise((resolve) => setTimeout(() => resolve(null), 3000)) // 3 second timeout for O*NET
        ]);
        
        if (onetData) {
          console.log('✅ O*NET data retrieved successfully');
        }
      } catch (onetError) {
        console.log('⚠️ O*NET lookup failed, continuing without enhancement');
      }

      // Enhance the user prompt with O*NET data if available
      let enhancedUserPrompt = userPrompt;
      if (onetData) {
        enhancedUserPrompt += `\n\nO*NET DATA AVAILABLE - Use this to enhance accuracy:
Title: ${onetData.title}
Salary Range: ${onetData.salary?.display || 'Use market rates'}
Key Responsibilities: ${onetData.responsibilities.slice(0, 3).join('; ')}
Required Skills: ${onetData.skills.join(', ')}
Suggested Requirements: ${onetData.requirements.slice(0, 3).join('; ')}`;
      }

      // Try OpenAI first with timeout
      console.log('🤖 Attempting GPT-3.5 generation for prompt:', prompt.trim().substring(0, 100) + '...');
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo', // Switch back for reliability
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: enhancedUserPrompt }
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
        const fallbackJobData = await generateFallbackJob(prompt.trim(), user, onetData);
        
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
            responsibilities: '• Support daily operations and assist team members with various tasks\n• Follow company procedures and maintain quality standards consistently\n• Communicate effectively with supervisors and coworkers throughout shifts\n• Complete assigned tasks efficiently while maintaining attention to detail\n• Adapt to changing priorities and take on additional responsibilities\n• Maintain clean and safe work environment following safety guidelines',
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
          responsibilities: '• Support daily operations and assist team members with various tasks\n• Follow company procedures and maintain quality standards consistently\n• Communicate effectively with supervisors and coworkers throughout shifts\n• Complete assigned tasks efficiently while maintaining attention to detail\n• Adapt to changing priorities and take on additional responsibilities\n• Maintain clean and safe work environment following safety guidelines',
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
async function generateFallbackJob(prompt: string, user: any, onetData: any = null): Promise<any> {
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
  
  // Use O*NET data if available for better accuracy
  if (onetData) {
    // Use O*NET recommended title if ours is generic
    if (title === 'General Worker' && onetData.title) {
      title = onetData.title;
    }
  }

  // Extract salary or use O*NET data or defaults
  let salary = onetData?.salary?.display || '$16-19/hr';
  
  // Try to match salary ranges first if O*NET didn't provide
  if (!onetData?.salary) {
    const rangeMatch = prompt.match(/\$(\d+(?:\.\d+)?)\s*[-–]\s*\$?(\d+(?:\.\d+)?)\s*(?:\/hr|per hour|hourly)?/i);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      if (min > 1000 || max > 1000) {
        salary = `$${min.toLocaleString()}-${max.toLocaleString()}/year`;
      } else {
        salary = `$${min}–$${max}/hr`;
      }
    } else {
      // Try single salary amount
      const singleMatch = prompt.match(/\$(\d+(?:\.\d+)?)\s*(?:\/hr|per hour|hourly)?/i);
      if (singleMatch) {
        const amount = parseFloat(singleMatch[1]);
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
    }
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

  // Generate job-specific requirements (must-haves)
  const requirementsByType = {
    warehouse: `• Must be 18+ with valid ID\n• Reliable transportation to ${location.split(',')[0]}\n• Ability to lift 50 lbs repeatedly\n• Able to pass background check`,
    
    retail: `• Must be 18+ with valid ID\n• Reliable transportation to ${location.split(',')[0]}\n• Weekend and evening availability\n• Friendly personality and customer focus`,
    
    driver: `• Valid CA driver's license with clean record\n• Reliable transportation to ${location.split(',')[0]}\n• Ability to lift packages up to 50 pounds\n• Able to pass background check and drug test`,
    
    security: `• Must be 18+ with valid ID\n• CA Guard Card (or ability to obtain)\n• High school diploma or equivalent\n• Able to stand/walk for entire shift`,
    
    management: `• Previous management or supervisory experience\n• Strong customer service skills\n• Proficiency with Microsoft Excel\n• Professional appearance`,
    
    office: `• Must be 18+ with valid ID\n• Reliable transportation to ${location.split(',')[0]}\n• Friendly and professional demeanor\n• Basic computer skills`,
    
    general: `• Must be 18+ with valid ID\n• Reliable transportation to ${location.split(',')[0]}\n• Strong work ethic and positive attitude\n• Legal right to work in US`
  };

  // Generate nice-to-have qualifications
  const niceToHaveByType = {
    warehouse: `• Previous warehouse experience\n• Forklift certification\n• Basic math skills for inventory`,
    
    retail: `• Previous retail/customer service experience\n• Basic math skills for cash handling\n• Second language skills`,
    
    driver: `• Previous delivery experience\n• Smartphone skills for delivery apps\n• Local area knowledge`,
    
    security: `• Previous security experience\n• Clean background check\n• Military or law enforcement background`,
    
    management: `• Bilingual English/Spanish\n• Advanced Excel skills\n• Leadership training or certification`,
    
    office: `• Experience with Microsoft Excel\n• Previous receptionist experience\n• Medical office experience`,
    
    general: `• Previous experience in similar role\n• Physical ability for standing/lifting\n• Positive attitude and team player`
  };

  // Generate job-specific responsibilities (what you'll do daily)
  const responsibilitiesByType = {
    warehouse: `• Receive, inspect, and organize incoming inventory shipments\n• Pick and pack orders accurately using RF scanners and inventory systems\n• Operate forklifts and pallet jacks to move products safely\n• Maintain clean and organized warehouse areas following safety protocols\n• Collaborate with team members to meet daily shipping deadlines\n• Conduct inventory counts and report discrepancies to supervisors`,
    
    retail: `• Greet customers warmly and assist with product selection and questions\n• Process sales transactions accurately using POS systems and handle cash\n• Stock shelves, create displays, and maintain store appearance standards\n• Handle customer complaints and returns professionally\n• Work with team members to achieve sales goals and store targets\n• Learn product features to provide knowledgeable recommendations`,
    
    driver: `• Plan and execute efficient delivery routes using GPS and route planning tools\n• Load and unload packages safely, following proper lifting techniques\n• Interact with customers professionally during deliveries and pickups\n• Inspect vehicle daily and report maintenance issues to dispatch\n• Complete delivery documentation and maintain accurate records\n• Communicate with dispatch about delays or delivery issues`,
    
    management: `• Oversee daily operations and supervise team members effectively\n• Handle customer inquiries, complaints, and resolve issues promptly\n• Monitor facility maintenance, safety standards, and compliance requirements\n• Analyze performance metrics and implement improvements to operations\n• Conduct staff training, meetings, and performance evaluations\n• Coordinate with vendors, contractors, and corporate management`,
    
    office: `• Answer phones professionally and direct calls to appropriate departments\n• Manage calendars, schedule appointments, and coordinate meetings\n• Process paperwork, data entry, and maintain organized filing systems\n• Greet visitors and clients, providing excellent customer service\n• Support team members with administrative tasks and special projects\n• Handle confidential information with discretion and professionalism`,
    
    cleaning: `• Clean and sanitize facilities according to established protocols and schedules\n• Empty trash, restock supplies, and maintain restroom cleanliness standards\n• Operate cleaning equipment safely including vacuums, buffers, and chemicals\n• Report maintenance issues and safety hazards to facility management\n• Work efficiently to complete assigned areas within designated timeframes\n• Follow infection control procedures and maintain supply inventory`,
    
    security: `• Monitor facility premises through patrols and surveillance equipment\n• Check credentials and control access to restricted areas\n• Respond to alarms, incidents, and emergency situations professionally\n• Complete detailed incident reports and maintain accurate security logs\n• Collaborate with law enforcement and emergency services when needed\n• Ensure compliance with safety protocols and company security policies`,
    
    general: `• Support daily operations and assist team members with various tasks\n• Follow company procedures and maintain quality standards consistently\n• Communicate effectively with supervisors and coworkers throughout shifts\n• Complete assigned tasks efficiently while maintaining attention to detail\n• Adapt to changing priorities and take on additional responsibilities\n• Maintain clean and safe work environment following safety guidelines`
  };

  // Use O*NET data for responsibilities and requirements if available
  const responsibilities = onetData?.responsibilities?.join('\n') || 
    responsibilitiesByType[jobType as keyof typeof responsibilitiesByType] || 
    responsibilitiesByType.general;
    
  const requirements = onetData?.requirements?.join('\n') || 
    requirementsByType[jobType as keyof typeof requirementsByType] || 
    requirementsByType.general;

  // Enhance benefits with O*NET suggestions if available
  if (onetData?.benefits && benefitOptions.length < 4) {
    onetData.benefits.forEach((benefit: string, index: number) => {
      if (benefitOptions.length < 5 && !benefitOptions.some(b => b.description.includes(benefit))) {
        benefitOptions.push({
          icon: ['🎯', '📚', '🏆', '🤝'][index % 4],
          title: benefit.split(' ').slice(0, 3).join(' '),
          description: benefit,
          key: `benefit_${benefitOptions.length + 1}`
        });
      }
    });
  }

  return {
    title,
    location,
    salary,
    description: onetData?.description || fullDescription,
    responsibilities,
    requirements,
    niceToHave: niceToHaveByType[jobType as keyof typeof niceToHaveByType] || niceToHaveByType.general,
    contactMethod,
    schedule,
    benefitOptions,
    onetEnhanced: !!onetData
  };
}