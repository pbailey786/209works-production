import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { openai } from '@/lib/ai';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await req.json();
    console.log('Publish job request body:', JSON.stringify(requestBody, null, 2));
    
    const { title, location, salary, description, requirements, contactMethod, requiresDegree, customQuestions, benefitOptions } = requestBody;
    
    // Validate required fields
    if (!title || !location || !salary) {
      console.error('Missing required fields:', { title: !!title, location: !!location, salary: !!salary });
      return NextResponse.json({ 
        error: 'Job title, location, and salary are required' 
      }, { status: 400 });
    }

    // Get or create employer profile
    const userEmail = clerkUser.emailAddresses[0].emailAddress;
    
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
          passwordHash: '', // Not used with Clerk
          role: 'employer'
        }
      });
    }

    // Parse salary for database storage
    const parseSalary = (salaryText: string) => {
      if (!salaryText) return null;
      const match = salaryText.match(/\$?(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    };

    const salaryMin = parseSalary(salary) || 0;
    const salaryMax = salary?.includes('-') ? (parseSalary(salary.split('-')[1]) || salaryMin) : salaryMin;

    // Generate embeddings for job search (optional AI enhancement)
    let embeddings = null;
    try {
      if (openai) {
        const searchText = `${title} ${location} ${description || ''} ${requirements || ''}`.trim();
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: searchText
        });
        embeddings = embeddingResponse.data[0]?.embedding;
      }
    } catch (error) {
      console.log('Embedding generation failed, job will still be published:', error);
      // Continue without embeddings
    }

    // Create job posting - store contact info and metadata in hidden tags
    let finalDescription = description?.trim() || '';
    
    // Add hidden contact info for email forwarding (not displayed to users)
    if (contactMethod?.trim()) {
      finalDescription += `\n\n[CONTACT_EMAIL:${contactMethod.trim()}]`;
    }
    
    // Add hidden degree requirement for filtering (not displayed to users)
    if (requiresDegree) {
      finalDescription += `\n[REQUIRES_DEGREE:true]`;
    }
    
    // Add benefits data as structured JSON (not displayed to users, used for rendering)
    if (benefitOptions && Array.isArray(benefitOptions) && benefitOptions.length > 0) {
      const validBenefits = benefitOptions.filter(b => b.title && b.title.trim() !== '');
      if (validBenefits.length > 0) {
        finalDescription += `\n[BENEFITS:${JSON.stringify(validBenefits)}]`;
      }
    }

    // Log the data we're about to save
    console.log('Creating job with data:', {
      title: title.trim(),
      location: location.trim(),
      salaryMin,
      salaryMax,
      employerId: user.id,
      hasEmbedding: !!embeddings
    });

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: finalDescription,
        requirements: requirements?.trim() || '',
        location: location.trim(),
        company: user.companyName || `${user.name}'s Company` || 'Local Business',
        source: '209.works',
        url: '',
        postedAt: new Date(),
        salaryMin: Math.round(salaryMin), // Ensure integer
        salaryMax: Math.round(salaryMax), // Ensure integer
        jobType: 'full_time', // Default to full time
        status: 'active',
        employerId: user.id,
        embedding: embeddings ? JSON.stringify(embeddings) : null,
        supplementalQuestions: customQuestions && customQuestions.length > 0 ? customQuestions.filter((q: string) => q.trim()) : []
      }
    });

    // TODO: Add analytics tracking after database migration
    // Create analytics records for custom questions
    // if (customQuestions && customQuestions.length > 0) {
    //   const filteredQuestions = customQuestions.filter(q => q.trim());
    //   
    //   for (let i = 0; i < filteredQuestions.length; i++) {
    //     await prisma.customQuestionAnalytics.create({
    //       data: {
    //         jobId: job.id,
    //         employerId: user.id,
    //         questionText: filteredQuestions[i].trim(),
    //         questionOrder: i + 1,
    //         jobTitle: job.title,
    //         industry: user.industry || null,
    //         location: job.location,
    //       }
    //     });
    //   }
    // }

    // TODO: Deduct credit here when payment system is ready
    // await deductEmployerCredit(user.id, 1);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job posted successfully!'
    });

  } catch (error) {
    console.error('Publish job error:', error);
    
    // Log the error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A job with similar details already exists' },
          { status: 400 }
        );
      }
      
      // Log specific Prisma errors
      if (error.message.includes('Prisma')) {
        console.error('Prisma error details:', JSON.stringify(error, null, 2));
      }
    }

    return NextResponse.json(
      { error: `Failed to publish job: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}