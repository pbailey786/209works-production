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

    // Enhanced AI prompt for detailed job descriptions using O*NET data
    const systemPrompt = `You are an expert job posting creator specializing in Central Valley, California positions. Create a comprehensive, professional job description in JSON format.

CRITICAL RULES:
1. Extract the EXACT job title from the user's prompt
2. Generate HIGHLY TECHNICAL, SPECIFIC content - NO GENERIC PHRASES
3. ALWAYS use these Central Valley market salary ranges (ignore user-provided salaries if unrealistic):
   - HVAC/Refrigeration technicians: $25-35/hr
   - Plumbers/Electricians: $28-38/hr  
   - Warehouse/Forklift operators: $17-22/hr
   - Retail/Cashiers: $16-20/hr
   - Drivers (CDL): $22-28/hr
   - Security: $16-22/hr
   - Management/Supervisors: $22-32/hr
   - General labor: $16-19/hr

Generate HIGHLY SPECIFIC, INDUSTRY-FOCUSED content:
- DESCRIPTION: 150-200 words with technical details about the role, specific equipment/systems, work environment, and career growth paths
- RESPONSIBILITIES: 6-8 SPECIFIC technical tasks (NOT generic like "support operations" or "assist team")
- REQUIREMENTS: 5-7 industry-specific qualifications including certifications, tools, physical requirements
- NICE TO HAVE: 3-4 advanced certifications or specialized skills

CRITICAL - Use these industry-specific examples as templates:

HVAC/Refrigeration:
- Description: Must mention HVAC/R systems, diagnostic equipment, residential/commercial settings
- Responsibilities: "Diagnose system issues using manifold gauges and multimeters", "Replace compressors, evaporator coils, and condensers", "Program thermostats and control systems"
- Requirements: "EPA 608 Type II certification", "Own hand tools and gauges", "Read electrical schematics"

Warehouse/Logistics:
- Description: Mention WMS systems, material handling equipment, distribution center environment
- Responsibilities: "Pick orders using RF scanners", "Operate sit-down and reach forklifts", "Perform cycle counts"
- Requirements: "Forklift certification", "Experience with warehouse management systems", "Lift 50 lbs repeatedly"

Always use TECHNICAL TERMINOLOGY specific to the industry. When O*NET data is provided, incorporate it to make the posting even more authoritative and detailed.

Return JSON with: title, location, salary, description, responsibilities, requirements, niceToHave, contactMethod, schedule, benefitOptions (array with icon, title, description, key)`;

    // Extract basic job info for O*NET lookup - enhanced to handle direct job titles
    let extractedTitle = 'General Worker';
    
    // Try different patterns to extract job title
    const patterns = [
      // Pattern 1: "hiring/need/looking for [job title]"
      /(?:hiring|need|looking for|seeking)\s+(?:a\s+)?([^,.]+?)(?:\s+for|\s+in|\s+at|\s+to|,|\.)/i,
      // Pattern 2: Direct job title at start
      /^([A-Z][a-zA-Z\s]+?)(?:\s+for|\s+in|\s+at|\s+to|,|\.|$)/,
      // Pattern 3: Job title anywhere in prompt
      /(HVAC|warehouse|retail|driver|manager|technician|specialist|associate|coordinator|assistant)[^,.]*(?:worker|associate|technician|specialist|manager|supervisor|coordinator|assistant|operator)?/i
    ];
    
    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        extractedTitle = match[1].trim();
        console.log(`📋 Job title extracted using pattern: "${extractedTitle}"`);
        break;
      }
    }
    
    console.log(`📋 Final extracted title: "${extractedTitle}" from prompt: "${prompt.trim().substring(0, 50)}..."`);

    const userPrompt = `Job posting: "${prompt.trim()}"
Company: ${user?.companyName || 'Our company'}
Location: ${user?.businessLocation || 'Stockton, CA'}

IMPORTANT CONTEXT:
- Job Title Detected: "${extractedTitle}"
- This appears to be a ${extractedTitle.toLowerCase().includes('hvac') ? 'technical/trade' : extractedTitle.toLowerCase().includes('warehouse') ? 'warehouse/logistics' : 'general'} position
- Use appropriate salary range for this job type in Central Valley, CA
- Generate SPECIFIC technical content for this exact role type

Create a professional, detailed job description with industry-specific terminology and requirements.`;
    
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
        enhancedUserPrompt += `\n\nO*NET OCCUPATIONAL DATA - Use this authoritative information to create a comprehensive job description:

OCCUPATION: ${onetData.title}
REALISTIC SALARY: ${onetData.salary?.display || '$16-20/hr for entry level'}

DETAILED RESPONSIBILITIES (use these for comprehensive daily tasks):
${Array.isArray(onetData.responsibilities) ? onetData.responsibilities.slice(0, 8).map((task: string, i: number) => `• ${task}`).join('\n') : '• Handle daily operations and support team objectives'}

REQUIRED SKILLS & QUALIFICATIONS:
${Array.isArray(onetData.skills) ? onetData.skills.slice(0, 6).join(', ') : 'Standard professional skills'}

EDUCATION & EXPERIENCE REQUIREMENTS:
${Array.isArray(onetData.requirements) ? onetData.requirements.slice(0, 5).map((req: string, i: number) => `• ${req}`).join('\n') : '• High school diploma or equivalent'}

INDUSTRY CONTEXT:
${onetData.description || 'Professional role with growth opportunities'}

IMPORTANT: Create an in-depth, detailed job description using this O*NET data. Make it comprehensive and authoritative - this should be a complete, professional job posting that reflects real industry standards.`;
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
          max_tokens: 2000,
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
      
      // Validate and fix salary if AI provided unrealistic amount
      if (jobData.salary) {
        const aiSalaryMatch = jobData.salary.match(/\$(\d+(?:\.\d+)?)/);
        if (aiSalaryMatch) {
          const aiSalaryAmount = parseFloat(aiSalaryMatch[1]);
          
          // First try O*NET validation
          if (onetData?.salary?.display) {
            const onetSalaryMatch = onetData.salary.display.match(/\$(\d+(?:\.\d+)?)/);
            if (onetSalaryMatch) {
              const onetSalaryAmount = parseFloat(onetSalaryMatch[1]);
              if (aiSalaryAmount > onetSalaryAmount * 1.4) {
                console.log(`🚨 AI salary $${aiSalaryAmount}/hr is unrealistic, using O*NET: ${onetData.salary.display}`);
                jobData.salary = onetData.salary.display;
              }
            }
          } 
          // Fallback: Use hardcoded market data when O*NET unavailable
          else {
            const jobTitleLower = jobData.title.toLowerCase();
            let marketRange = null;
            
            // Define market ranges for specific job types
            if (jobTitleLower.includes('hvac') || jobTitleLower.includes('heating') || jobTitleLower.includes('air conditioning') || jobTitleLower.includes('refrigeration')) {
              marketRange = { min: 25, max: 35, median: 28 }; // Central Valley HVAC rates
            } else if (jobTitleLower.includes('warehouse')) {
              marketRange = { min: 17, max: 22, median: 18 };
            } else if (jobTitleLower.includes('retail') || jobTitleLower.includes('cashier')) {
              marketRange = { min: 16, max: 20, median: 17 };
            } else if (jobTitleLower.includes('driver') || jobTitleLower.includes('delivery')) {
              marketRange = { min: 18, max: 24, median: 20 };
            } else if (jobTitleLower.includes('security')) {
              marketRange = { min: 16, max: 22, median: 18 };
            } else if (jobTitleLower.includes('manager') || jobTitleLower.includes('supervisor')) {
              marketRange = { min: 22, max: 32, median: 26 };
            }
            
            // Always use market range for specific job types, regardless of AI salary
            if (marketRange) {
              console.log(`💰 Using market-appropriate salary for ${jobData.title}: $${marketRange.min}-${marketRange.max}/hr (was: ${jobData.salary})`);
              jobData.salary = `$${marketRange.min}-${marketRange.max}/hr`;
            } else if (aiSalaryAmount > 25) { // Only validate if no specific market range and salary seems high
              console.log(`⚠️ No market data for ${jobData.title}, keeping AI salary: ${jobData.salary}`);
            }
          }
        }
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
  if (lowerPrompt.includes('hvac') || lowerPrompt.includes('heating') || lowerPrompt.includes('air conditioning') || lowerPrompt.includes('refrigeration')) { 
    title = 'HVAC Repair Technician'; jobType = 'hvac'; 
  }
  else if (lowerPrompt.includes('property manager')) { title = 'Property Manager'; jobType = 'management'; }
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

  // Extract salary - prioritize O*NET/market data over user input for realism
  let salary = onetData?.salary?.display || '$16-19/hr';
  
  // If O*NET provided salary, use it (it's already validated and realistic)
  if (onetData?.salary?.display) {
    console.log('💰 Using O*NET validated salary:', onetData.salary.display);
    salary = onetData.salary.display;
  } else {
    // Try to match salary ranges from user input, but validate against market data
    console.log('💰 No O*NET salary, checking user input and market data');
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
    // Enhanced detailed fallback descriptions
    const jobDescriptions = {
      hvac: `Join ${companyName}'s skilled technical team as an HVAC Repair Technician in ${city}, where your expertise in heating, ventilation, and air conditioning systems makes a direct impact on customer comfort and satisfaction. In this essential role, you'll diagnose, repair, and maintain residential and commercial HVAC systems, working with cutting-edge equipment and technology while serving the growing ${city} area market. You'll have opportunities to specialize in advanced systems, earn additional certifications, and potentially advance into supervisory or field management roles within our expanding service operation. We provide ongoing training, professional development, and the tools you need to build a successful career in the high-demand HVAC industry.`,
      
      warehouse: `Join ${companyName}'s dynamic ${city} warehouse operation where efficiency meets opportunity. As a key member of our logistics team, you'll be responsible for comprehensive inventory management, accurate order fulfillment, and maintaining our streamlined distribution processes that serve customers across the region. This role offers excellent opportunities for professional advancement within the fast-growing logistics industry, with potential paths into supervisory roles, specialized equipment operation, and supply chain management. You'll work in a modern facility equipped with the latest technology and safety systems, collaborating with a dedicated team committed to operational excellence and continuous improvement.`,
      
      retail: `${companyName} is seeking passionate, customer-focused team members to join our thriving ${city} retail location. In this dynamic role, you'll create memorable shopping experiences by providing exceptional customer service, processing transactions with accuracy and efficiency, and helping maintain our store's reputation as a premier destination for quality products and outstanding service. This position is perfect for individuals who genuinely enjoy interacting with people, solving problems, and contributing to a positive team environment. You'll have opportunities to develop valuable retail skills, learn about inventory management, visual merchandising, and potentially advance into leadership roles within our growing company.`,
      
      driver: `${companyName} is looking for professional, safety-minded drivers to serve our valued customers throughout the ${city} area and surrounding communities. In this essential role, you'll operate company delivery vehicles with the highest standards of safety and efficiency while serving as a positive ambassador for our brand with every customer interaction. You'll enjoy the independence of the road while maintaining regular routes that get you home nightly, making this an ideal opportunity for experienced drivers seeking work-life balance. We provide comprehensive training, competitive compensation, and opportunities for advancement within our expanding transportation network.`,
      
      management: `Lead ${companyName}'s successful ${city} operations as our ${title} and drive our continued growth in this strategic leadership position. You'll oversee daily operational activities, develop and mentor team members to reach their full potential, and implement performance improvements that enhance both efficiency and employee satisfaction. This role offers significant growth potential for an experienced leader ready to make a meaningful impact while building upon our established reputation for excellence. You'll work with senior management to develop strategic initiatives, manage budgets, ensure compliance with industry standards, and foster a culture of continuous improvement and professional development.`,
      
      office: `Support ${companyName}'s growing ${city} operations as our ${title} in this versatile administrative role that combines customer service, team support, and operational coordination. You'll manage a variety of administrative functions, assist both customers and team members with professionalism and attention to detail, and help maintain the high professional standards that set us apart in our industry. This position requires strong computer proficiency, excellent communication skills, and the ability to multitask effectively in a dynamic office environment. You'll have opportunities to learn various aspects of business operations and potentially advance into specialized administrative or management roles.`,
      
      cleaning: `Maintain ${companyName}'s professional standards as an essential member of our ${city} facilities team, ensuring clean, safe, and welcoming environments through systematic cleaning protocols and meticulous attention to detail. In this important role, you'll be responsible for comprehensive facility maintenance that directly contributes to our professional image and the health and safety of our team members and visitors. We offer reliable schedules with opportunities for additional hours, competitive compensation, and the satisfaction of knowing your work makes a real difference in creating positive environments. You'll use professional-grade equipment and follow industry best practices while working independently and as part of our dedicated facilities team.`,
      
      security: `Protect ${companyName}'s ${city} facility and personnel as a licensed security professional, maintaining the highest standards of safety and security while representing our company's unwavering commitment to protection and peace of mind. In this critical role, you'll monitor facility access, maintain comprehensive safety protocols, respond to incidents with professionalism and appropriate action, and serve as a visible deterrent to potential security threats. You'll work with state-of-the-art security systems and receive ongoing training to stay current with industry best practices. This position offers the opportunity to build a career in the growing security field while contributing to a safe, secure environment for our entire team.`,
      
      general: `Join ${companyName}'s established team in ${city} for stable, long-term employment with genuine opportunities for professional growth and skill development. In this versatile role, you'll contribute to our daily operations while learning new skills in a supportive work environment that values reliability, teamwork, and dedication to quality work. We believe in investing in our people and providing clear paths for advancement based on performance and commitment. You'll work alongside experienced professionals who are committed to your success, receive comprehensive training, and have access to ongoing professional development opportunities that can help you build a rewarding career with our growing company.`
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
    hvac: `• EPA 608 certification or ability to obtain within 90 days\n• High school diploma or equivalent with technical/trade school preferred\n• Valid CA driver's license with clean driving record\n• Ability to lift 50+ lbs and work in various weather conditions\n• Own basic hand tools and willing to invest in specialized HVAC tools\n• Able to pass background check and drug screening`,
    
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
    hvac: `• 2+ years HVAC installation or repair experience\n• Additional certifications (NATE, HVAC Excellence, or manufacturer certifications)\n• Experience with residential and commercial systems\n• Knowledge of electrical systems and controls`,
    
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
    hvac: `• Install, repair, and maintain heating, ventilation, and air conditioning systems in residential and commercial settings\n• Diagnose system malfunctions using specialized testing equipment and technical manuals\n• Replace or repair defective components including compressors, motors, thermostats, and refrigerant lines\n• Perform routine maintenance inspections and preventive service on HVAC equipment\n• Handle refrigerants safely following EPA regulations and environmental guidelines\n• Document service calls, parts used, and system performance for customer records`,
    
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