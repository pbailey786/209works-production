import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { z } from 'zod';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// Validation schema for autofill request
const autofillSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  companyName: z.string().optional(),
  location: z.string().optional(),
});

// POST /api/job-post-optimizer/autofill - Generate template content for job title
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required. Only employers can use autofill.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = autofillSchema.parse(body);

    // Generate simple template content based on job title
    const templateContent = generateJobTemplate(validatedData);

    return NextResponse.json({
      success: true,
      templateContent,
      message: 'Template content generated successfully!',
    });
  } catch (error) {
    console.error('Job autofill error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate template content. Please try again.' },
      { status: 500 }
    );
  }
}

// Generate simple template content based on job title
function generateJobTemplate(data: { jobTitle: string; companyName?: string; location?: string }) {
  const { jobTitle, companyName = 'Our Company', location = 'the 209 area' } = data;
  
  // Extract job category and level from title
  const titleLower = jobTitle.toLowerCase();
  
  // Determine if it's entry level, senior, etc.
  const isEntry = titleLower.includes('entry') || titleLower.includes('junior') || titleLower.includes('trainee');
  const isSenior = titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('manager');
  const isRemote = titleLower.includes('remote');
  
  // Determine job category for tailored content
  let category = 'general';
  if (titleLower.includes('sales') || titleLower.includes('account')) category = 'sales';
  else if (titleLower.includes('customer') || titleLower.includes('support')) category = 'customer_service';
  else if (titleLower.includes('warehouse') || titleLower.includes('driver') || titleLower.includes('logistics')) category = 'warehouse';
  else if (titleLower.includes('admin') || titleLower.includes('assistant') || titleLower.includes('clerk')) category = 'administrative';
  else if (titleLower.includes('nurse') || titleLower.includes('medical') || titleLower.includes('healthcare')) category = 'healthcare';
  else if (titleLower.includes('tech') || titleLower.includes('developer') || titleLower.includes('engineer')) category = 'tech';
  else if (titleLower.includes('cook') || titleLower.includes('server') || titleLower.includes('food')) category = 'food_service';
  else if (titleLower.includes('retail') || titleLower.includes('cashier') || titleLower.includes('store')) category = 'retail';

  // Generate category-specific content
  const templates = {
    sales: {
      schedule: 'Full-time, Monday-Friday with some weekend opportunities',
      companyDescription: `${companyName} is a growing company in ${location} looking for motivated sales professionals to join our team.`,
      idealFit: 'We\'re looking for someone who is outgoing, goal-oriented, and enjoys building relationships with customers. Previous sales experience is a plus but not required.',
      culture: 'We believe in supporting our team with ongoing training, competitive compensation, and a collaborative work environment.',
      growthPath: 'Opportunities for advancement to senior sales roles, team leadership, and management positions.',
      perks: 'Base salary plus commission, health benefits, paid time off, and performance bonuses.',
    },
    customer_service: {
      schedule: 'Full-time with flexible scheduling options',
      companyDescription: `${companyName} is committed to providing excellent customer service and is looking for friendly, helpful team members.`,
      idealFit: 'Perfect for someone who enjoys helping others, has strong communication skills, and can handle multiple tasks efficiently.',
      culture: 'We value teamwork, respect, and going the extra mile for our customers and each other.',
      growthPath: 'Growth opportunities into supervisory roles, training positions, and specialized customer service areas.',
      perks: 'Competitive hourly wage, health insurance, paid time off, and employee discounts.',
    },
    warehouse: {
      schedule: 'Full-time, various shifts available including days, evenings, and weekends',
      companyDescription: `${companyName} operates a fast-paced warehouse facility serving the ${location} region.`,
      idealFit: 'Looking for reliable, hardworking individuals who can work in a team environment and handle physical demands.',
      culture: 'Safety-first environment with a focus on teamwork, efficiency, and getting the job done right.',
      growthPath: 'Advancement opportunities to lead positions, equipment operation, and supervisory roles.',
      perks: 'Competitive hourly pay, overtime opportunities, health benefits, and safety bonuses.',
    },
    administrative: {
      schedule: 'Full-time, Monday-Friday business hours',
      companyDescription: `${companyName} is seeking organized, detail-oriented administrative support to help our operations run smoothly.`,
      idealFit: 'Ideal for someone with strong organizational skills, attention to detail, and proficiency with office software.',
      culture: 'Professional, supportive office environment where accuracy and teamwork are valued.',
      growthPath: 'Opportunities to take on additional responsibilities and advance to senior administrative roles.',
      perks: 'Competitive salary, health benefits, paid time off, and professional development opportunities.',
    },
    healthcare: {
      schedule: 'Various shifts available including days, evenings, nights, and weekends',
      companyDescription: `${companyName} is dedicated to providing quality healthcare services to the ${location} community.`,
      idealFit: 'Seeking compassionate, skilled healthcare professionals committed to patient care and safety.',
      culture: 'Patient-centered care environment with emphasis on teamwork, continuous learning, and professional growth.',
      growthPath: 'Continuing education support, specialty training opportunities, and leadership development.',
      perks: 'Competitive salary, comprehensive benefits, retirement plan, and continuing education assistance.',
    },
    tech: {
      schedule: 'Full-time with flexible work arrangements and remote options',
      companyDescription: `${companyName} is an innovative technology company looking for talented developers to join our growing team.`,
      idealFit: 'Perfect for someone passionate about technology, problem-solving, and creating innovative solutions.',
      culture: 'Collaborative, fast-paced environment that values creativity, continuous learning, and work-life balance.',
      growthPath: 'Career advancement opportunities, mentorship programs, and leadership development paths.',
      perks: 'Competitive salary, equity options, comprehensive benefits, flexible PTO, and professional development budget.',
    },
    food_service: {
      schedule: 'Part-time and full-time positions available with flexible scheduling',
      companyDescription: `${companyName} is a popular dining establishment in ${location} known for great food and excellent service.`,
      idealFit: 'Looking for energetic, friendly team members who enjoy working in a fast-paced environment.',
      culture: 'Fun, team-oriented atmosphere where we work together to create great experiences for our customers.',
      growthPath: 'Opportunities to advance to shift supervisor, assistant manager, and management positions.',
      perks: 'Competitive hourly wage, tips, flexible scheduling, employee meals, and advancement opportunities.',
    },
    retail: {
      schedule: 'Part-time and full-time positions with flexible scheduling including evenings and weekends',
      companyDescription: `${companyName} is a well-established retail business serving customers throughout ${location}.`,
      idealFit: 'Seeking friendly, customer-focused individuals who enjoy helping people find what they need.',
      culture: 'Customer-first environment where we value teamwork, positive attitudes, and going above and beyond.',
      growthPath: 'Growth opportunities into key holder, supervisor, assistant manager, and store management roles.',
      perks: 'Competitive pay, employee discounts, flexible scheduling, and advancement opportunities.',
    },
    general: {
      schedule: 'Full-time position with standard business hours',
      companyDescription: `${companyName} is a growing business in ${location} looking for dedicated team members.`,
      idealFit: 'We\'re looking for reliable, motivated individuals who are eager to contribute to our team\'s success.',
      culture: 'Supportive work environment that values teamwork, integrity, and professional growth.',
      growthPath: 'Opportunities for skill development, increased responsibilities, and career advancement.',
      perks: 'Competitive compensation, benefits package, and opportunities for professional development.',
    }
  };

  const template = templates[category as keyof typeof templates] || templates.general;

  // Adjust content based on experience level
  if (isEntry) {
    template.idealFit = template.idealFit.replace('Previous', 'Some previous').replace('experience is a plus but not required', 'experience helpful but we provide training');
    template.growthPath = `Perfect entry-level opportunity! ${template.growthPath}`;
  } else if (isSenior) {
    template.idealFit = template.idealFit.replace('not required', 'strongly preferred');
    template.growthPath = template.growthPath.replace('Opportunities', 'Leadership opportunities');
  }

  // Add remote work mention if applicable
  if (isRemote) {
    template.schedule = template.schedule.replace('Full-time', 'Full-time remote position');
    template.perks = `Remote work flexibility, ${template.perks}`;
  }

  return {
    schedule: template.schedule,
    companyDescription: template.companyDescription,
    idealFit: template.idealFit,
    culture: template.culture,
    growthPath: template.growthPath,
    perks: template.perks,
    applicationCTA: `Ready to join our team? We'd love to hear from you! Please submit your application and we'll be in touch soon.`
  };
}
