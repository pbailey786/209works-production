import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { openai } from '@/lib/ai';
import { prisma } from '@/lib/database/prisma';
import { jobEnhancer } from '@/lib/onet/job-enhancer';

export const maxDuration = 30; // Increased timeout for AI generation

export async function POST(req: NextRequest) {
  console.log('🚀 Magic job creation API called');
  try {
    console.log('🔐 Getting current user...');
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', clerkUser.emailAddresses[0].emailAddress);

    console.log('📝 Parsing request body...');
    const { prompt } = await req.json();
    console.log('✅ Request parsed, prompt length:', prompt?.length || 0);
    
    // Get employer profile data for smart defaults
    console.log('🗄️ Querying user profile...');
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
    console.log('✅ User profile found:', { 
      companyName: user?.companyName, 
      location: user?.businessLocation 
    });
    
    if (!prompt?.trim()) {
      return NextResponse.json({ 
        error: 'Job description prompt is required' 
      }, { status: 400 });
    }

    // Simplified AI prompt to avoid memory issues
    const systemPrompt = `Create a professional job description in JSON format. Extract the exact job title, location, and salary from the user's prompt. Generate realistic responsibilities, requirements, and benefits for the Central Valley region.

Return JSON with: title, location, salary, description, responsibilities, requirements, niceToHave, contactMethod, schedule, benefitOptions (array with icon, title, description, key)`;

    const userPrompt = `Job posting: "${prompt.trim()}"
Company: ${user?.companyName || 'Our company'}
Location: ${user?.businessLocation || 'Central Valley, CA'}

Create a professional job description with realistic details for this role.`;

    // Extract basic job info for O*NET lookup
    const jobTitleMatch = prompt.match(/(?:hiring|need|looking for|seeking)\s+(?:a\s+)?([^,.]+?)(?:\s+for|\s+in|\s+at|\s+to|,|\.)/i);
    const extractedTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'General Worker';
    
    // Try to get O*NET data first (non-blocking) - declare outside try block
    let onetData: any = null;

    // Try to get O*NET data first (non-blocking)
    try {
      console.log('🔍 Looking up O*NET data for:', extractedTitle);
      console.log('🔍 User location:', user?.businessLocation || 'Stockton, CA');
      
      onetData = await Promise.race([
        jobEnhancer.enhanceJobPosting({ 
          title: extractedTitle, 
          location: user?.businessLocation || 'Stockton, CA' 
        }),
        new Promise((resolve) => setTimeout(() => resolve(null), 5000)) // Increased to 5 second timeout
      ]) as any;
      
      if (onetData) {
        console.log('✅ O*NET data retrieved successfully:', {
          title: onetData.title,
          salaryDisplay: onetData.salary?.display,
          responsibilitiesCount: onetData.responsibilities?.length || 0,
          skillsCount: onetData.skills?.length || 0
        });
      } else {
        console.log('⏱️ O*NET lookup timed out (5 seconds)');
      }
    } catch (onetError: any) {
      console.log('⚠️ O*NET lookup failed:', onetError?.message || onetError);
    }

    try {
      console.log('🤖 Starting AI generation...');

      // Enhance the user prompt with O*NET data if available
      let enhancedUserPrompt = userPrompt;
      if (onetData && onetData.title) {
        console.log('🔧 Enhancing prompt with O*NET data');
        enhancedUserPrompt += `\n\nO*NET DATA AVAILABLE - Use this to enhance accuracy:
Title: ${onetData.title}
Salary Range: ${onetData.salary?.display || 'Use market rates'}
Key Responsibilities: ${onetData.responsibilities?.slice(0, 3).join('; ') || 'See job description'}
Required Skills: ${onetData.skills?.join(', ') || 'Standard skills for role'}
Suggested Requirements: ${onetData.requirements?.slice(0, 3).join('; ') || 'See requirements section'}`;
      }

      // Try OpenAI first with timeout
      console.log('🤖 Calling OpenAI GPT-3.5 for prompt:', prompt.trim().substring(0, 100) + '...');
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

      console.log('✅ OpenAI API call completed');
      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        console.log('❌ Empty AI response received');
        throw new Error('Empty AI response');
      }
      
      console.log('✅ AI content received, length:', content.length);

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
      
      // Ensure responsibilities and requirements are present
      if (!jobData.responsibilities || typeof jobData.responsibilities !== 'string' || !jobData.responsibilities.trim()) {
        console.log('AI missing responsibilities, using fallback');
        jobData.responsibilities = '• Support daily operations and assist team members with various tasks\n• Follow company procedures and maintain quality standards consistently\n• Communicate effectively with supervisors and coworkers throughout shifts\n• Complete assigned tasks efficiently while maintaining attention to detail\n• Adapt to changing priorities and take on additional responsibilities\n• Maintain clean and safe work environment following safety guidelines';
      }
      
      if (!jobData.requirements || typeof jobData.requirements !== 'string' || !jobData.requirements.trim()) {
        console.log('AI missing requirements, using fallback');
        jobData.requirements = '• Must be 18+ with valid ID\n• Reliable transportation to work location\n• Strong work ethic and positive attitude\n• Legal right to work in US\n• Ability to follow instructions and work as part of a team\n• Professional appearance and demeanor';
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
        jobData,
        onetData: onetData, // Include O*NET data for guided mode
        onetUsed: !!(onetData && onetData.title),
        debug: {
          extractedTitle,
          onetTimeout: !onetData,
          aiModel: 'gpt-3.5-turbo'
        }
      });

    } catch (aiError: any) {
      console.error('🔥 AI generation failed:', aiError?.message || aiError);
      console.error('🔥 Full error object:', aiError);
      
      try {
        // Rule-based fallback system - always works
        console.log('🔄 Using fallback system for prompt:', prompt.trim().substring(0, 50) + '...');
        
        // Try to use O*NET data in fallback too
        let fallbackOnetData = null;
        if (onetData) {
          console.log('✅ Using O*NET data in fallback system');
          fallbackOnetData = onetData;
        } else {
          console.log('🔄 Fallback: Attempting O*NET lookup...');
          try {
            const fallbackJobTitleMatch = prompt.match(/(?:hiring|need|looking for|seeking)\s+(?:a\s+)?([^,.]+?)(?:\s+for|\s+in|\s+at|\s+to|,|\.)/i);
            const fallbackExtractedTitle = fallbackJobTitleMatch ? fallbackJobTitleMatch[1].trim() : 'General Worker';
            
            fallbackOnetData = await jobEnhancer.enhanceJobPosting({ 
              title: fallbackExtractedTitle, 
              location: user?.businessLocation || 'Stockton, CA' 
            });
            
            if (fallbackOnetData) {
              console.log('✅ Fallback: O*NET data retrieved successfully');
            }
          } catch (fallbackOnetError) {
            console.log('⚠️ Fallback: O*NET lookup failed, using rule-based only');
          }
        }
        
        const fallbackJobData = await generateFallbackJob(prompt.trim(), user, fallbackOnetData);
        
        return NextResponse.json({
          success: true,
          jobData: fallbackJobData,
          onetData: fallbackOnetData, // Include O*NET data for guided mode
          fallback: true,
          onetUsed: !!fallbackOnetData,
          message: fallbackOnetData ? 
            'Generated using fallback system with O*NET enhancement' : 
            'Generated using fallback system (AI temporarily unavailable)'
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
            contactMethod: '',
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
    console.error('💥 Magic job creation error:', error?.message || error);
    console.error('💥 Full error stack:', error?.stack);
    console.error('💥 Error type:', typeof error);
    
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
          contactMethod: '',
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
  
  // Extract contact method if provided - leave blank by default for employer to fill
  let contactMethod = '';
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
  
  // Generate job-specific descriptions with company context and O*NET enhancement
  const companyName = user?.companyName || 'Our company';
  const city = location.split(',')[0];
  
  // Enhanced descriptions using O*NET data when available
  let fullDescription;
  
  if (onetData?.description) {
    // Use O*NET description as base, but localize it
    const onetDesc = onetData.description;
    fullDescription = `Join ${companyName} as a ${title} in ${city}. ${onetDesc.replace(/\b(workers?|employees?|individuals?)\b/gi, 'team members')} This role offers growth opportunities in our established ${city} operation, with the chance to develop expertise in this field while contributing to our company's success.`;
  } else {
    // Fallback to original descriptions
    const jobDescriptions = {
      warehouse: `Join ${companyName}'s growing ${city} warehouse team. You'll be responsible for inventory management, order fulfillment, and maintaining our efficient distribution operation. This role offers excellent opportunities for advancement and skills development in the logistics industry.`,
      
      retail: `${companyName} is seeking customer-focused team members for our ${city} location. You'll create positive shopping experiences, handle transactions, and help maintain our store's reputation for excellent service. Perfect for someone who enjoys helping people and wants to grow in retail.`,
      
      driver: `${companyName} needs professional drivers to serve our ${city} area customers. You'll operate delivery vehicles safely and efficiently while representing our company with every interaction. Home nightly with local routes - ideal for drivers seeking work-life balance.`,
      
      management: `Lead ${companyName}'s ${city} operations as our ${title}. You'll oversee daily activities, develop team members, and drive performance improvements. This strategic role offers significant growth potential for an experienced leader ready to make an impact.`,
      
      office: `Support ${companyName}'s ${city} operations as our ${title}. You'll coordinate administrative functions, assist customers and team members, and help maintain our professional standards. Computer proficiency and strong communication skills essential.`,
      
      cleaning: `Maintain ${companyName}'s professional standards as a member of our ${city} facilities team. You'll ensure clean, safe environments through systematic cleaning protocols and attention to detail. Reliable schedules with opportunities for additional hours.`,
      
      security: `Protect ${companyName}'s ${city} facility as a licensed security professional. You'll monitor access, maintain safety protocols, and respond to incidents while representing our company's commitment to security excellence.`,
      
      general: `Join ${companyName}'s team in ${city} for stable employment with growth opportunities. You'll contribute to our daily operations while developing new skills in a supportive work environment. We value reliability, teamwork, and dedication to quality work.`
    };
    
    fullDescription = jobDescriptions[jobType as keyof typeof jobDescriptions] || jobDescriptions.general;
  }
  
  // Generate benefit options based on job type and prompt
  const benefitOptions: Array<{ icon: string; title: string; description: string; key: string }> = [];
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
  console.log('🔧 Fallback O*NET data structure:', {
    hasOnetData: !!onetData,
    responsibilitiesType: onetData?.responsibilities ? typeof onetData.responsibilities : 'undefined',
    responsibilitiesLength: onetData?.responsibilities?.length || 0,
    firstResponsibility: onetData?.responsibilities?.[0] || 'none'
  });
  
  const responsibilities = (onetData?.responsibilities && Array.isArray(onetData.responsibilities)) 
    ? onetData.responsibilities.map((r: string) => `• ${r}`).join('\n')
    : (responsibilitiesByType[jobType as keyof typeof responsibilitiesByType] || responsibilitiesByType.general);
    
  const requirements = (onetData?.requirements && Array.isArray(onetData.requirements))
    ? onetData.requirements.map((r: string) => `• ${r}`).join('\n')
    : (requirementsByType[jobType as keyof typeof requirementsByType] || requirementsByType.general);

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