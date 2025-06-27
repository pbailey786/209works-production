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
    const systemPrompt = `You are a veteran hiring manager with 20+ years of experience in California's Central Valley region (209, 916, 510 area codes). You specialize in creating job postings that attract local candidates who want stable work close to home.

Generate a complete job posting from the user's description. Focus on:
- Central Valley market rates and local business culture
- Family-friendly, stable employment messaging  
- Specific location within Stockton, Modesto, Fresno, Tracy, or nearby cities
- Realistic salary ranges for the region
- Clear requirements without being overly demanding

Return ONLY a JSON object with these exact fields:
{
  "title": "Professional job title",
  "location": "Specific city, CA (e.g., Stockton, CA)",
  "salary": "Hourly or annual rate (e.g., $17-19/hr or $35,000-40,000/year)",
  "description": "2-3 paragraph description emphasizing local benefits and company culture",
  "requirements": "Bullet-pointed requirements (realistic for Central Valley market)",
  "contactMethod": "Professional email or phone number format",
  "schedule": "Work schedule details (optional)",
  "benefits": "Benefits offered (optional)"
}

Make it sound professional but approachable, emphasizing local roots and family-friendly workplace.`;

    const userPrompt = `Create a job posting for: ${prompt.trim()}`;

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

// Rule-based fallback job generation
function generateFallbackJob(prompt: string): any {
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract title from prompt
  let title = 'General Worker';
  if (lowerPrompt.includes('warehouse')) title = 'Warehouse Associate';
  else if (lowerPrompt.includes('cashier')) title = 'Cashier';
  else if (lowerPrompt.includes('driver')) title = 'Driver';
  else if (lowerPrompt.includes('retail') || lowerPrompt.includes('sales')) title = 'Sales Associate';
  else if (lowerPrompt.includes('office') || lowerPrompt.includes('admin')) title = 'Administrative Assistant';
  else if (lowerPrompt.includes('cook') || lowerPrompt.includes('kitchen')) title = 'Kitchen Staff';
  else if (lowerPrompt.includes('clean')) title = 'Cleaner';
  else if (lowerPrompt.includes('security')) title = 'Security Guard';
  
  // Extract location
  let location = 'Stockton, CA';
  if (lowerPrompt.includes('modesto')) location = 'Modesto, CA';
  else if (lowerPrompt.includes('fresno')) location = 'Fresno, CA';
  else if (lowerPrompt.includes('tracy')) location = 'Tracy, CA';
  else if (lowerPrompt.includes('sacramento')) location = 'Sacramento, CA';
  
  // Extract salary or use defaults
  let salary = '$16-18/hr';
  const salaryMatch = prompt.match(/\$(\d+(?:\.\d+)?)/);
  if (salaryMatch) {
    const amount = parseFloat(salaryMatch[1]);
    if (amount > 1000) {
      salary = `$${amount.toLocaleString()}/year`;
    } else {
      salary = `$${amount}/hr`;
    }
  }
  
  // Extract contact method if provided
  let contactMethod = 'careers@company.com';
  const emailMatch = prompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = prompt.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (emailMatch) contactMethod = emailMatch[0];
  else if (phoneMatch) contactMethod = phoneMatch[0];
  
  return {
    title,
    location,
    salary,
    description: `Join our growing team in ${location.split(',')[0]}! We're looking for a reliable ${title.toLowerCase()} to join our family-owned business. This is a great opportunity for someone who wants steady work close to home with a company that values its employees.\n\nWe offer a supportive work environment where you can grow your skills and build a career. Our team has deep Central Valley roots and we understand what matters to local workers - stability, fair pay, and being part of something meaningful.`,
    requirements: `• Must be 18 years or older\n• Reliable transportation to ${location.split(',')[0]}\n• Strong work ethic and positive attitude\n• Able to work in a team environment\n• Previous experience preferred but not required`,
    contactMethod,
    schedule: lowerPrompt.includes('night') ? 'Night shift' : 
             lowerPrompt.includes('part') ? 'Part-time' : 'Full-time day shift',
    benefits: 'Health benefits • Paid time off • Employee discounts • Growth opportunities'
  };
}