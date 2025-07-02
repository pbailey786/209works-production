import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { openai } from '@/lib/ai';
import { JobPostingCreditsService } from '@/lib/services/job-posting-credits';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await req.json();
    console.log('Publish job request body:', JSON.stringify(requestBody, null, 2));
    
    const { title, location, salary, description, responsibilities, requirements, contactMethod, requiresDegree, customQuestions, benefitOptions } = requestBody;
    
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

    // Check if user has credits before proceeding
    const hasCredits = await JobPostingCreditsService.canPostJob(user.id);
    if (!hasCredits) {
      return NextResponse.json({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        message: 'You need at least 1 credit to post a job. Please purchase credits to continue.'
      }, { status: 402 }); // 402 Payment Required
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
        try {
          // Ensure clean JSON serialization
          const benefitsJson = JSON.stringify(validBenefits);
          console.log('Storing benefits JSON:', benefitsJson);
          finalDescription += `\n[BENEFITS:${benefitsJson}]`;
        } catch (jsonError) {
          console.error('Error serializing benefits:', jsonError);
          console.error('Benefits data:', validBenefits);
        }
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

    // Also store benefits in the dedicated benefits field for easier access
    let benefitsString = '';
    if (benefitOptions && Array.isArray(benefitOptions) && benefitOptions.length > 0) {
      const validBenefits = benefitOptions.filter(b => b.title && b.title.trim() !== '');
      if (validBenefits.length > 0) {
        try {
          benefitsString = JSON.stringify(validBenefits);
        } catch (error) {
          console.error('Error serializing benefits for benefits field:', error);
        }
      }
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: finalDescription,
        responsibilities: responsibilities?.trim() || '',
        requirements: requirements?.trim() || '',
        benefits: benefitsString, // Store benefits in dedicated field
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

    // Deduct credit after successful job creation
    const creditResult = await JobPostingCreditsService.useJobPostCredit(user.id, job.id);
    if (!creditResult.success) {
      // If credit deduction fails, we should ideally rollback the job creation
      // For now, log the error but don't fail the job posting
      console.error('Failed to deduct credit after job creation:', creditResult.error);
      
      // In a production system, you might want to:
      // 1. Delete the created job
      // 2. Return an error
      // For now, we'll log and continue since the job was already created
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job posted successfully!',
      creditsRemaining: creditResult.success ? await JobPostingCreditsService.getUserCredits(user.id) : undefined
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