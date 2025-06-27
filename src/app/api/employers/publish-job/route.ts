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

    const { title, location, salary, description, requirements, contactMethod } = await req.json();
    
    // Validate required fields
    if (!title || !location || !salary) {
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
      const match = salaryText.match(/\$?(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    };

    const salaryMin = parseSalary(salary);
    const salaryMax = salary.includes('-') ? parseSalary(salary.split('-')[1]) : salaryMin;

    // Generate embeddings for job search (optional AI enhancement)
    let embeddings = null;
    try {
      const searchText = `${title} ${location} ${description || ''} ${requirements || ''}`.trim();
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: searchText
      });
      embeddings = embeddingResponse.data[0]?.embedding;
    } catch (error) {
      console.log('Embedding generation failed, job will still be published');
    }

    // Create job posting with contact info embedded in description for now
    let finalDescription = description?.trim() || '';
    if (contactMethod?.trim()) {
      finalDescription += `\n\nHow to Apply: ${contactMethod.trim()}`;
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        description: finalDescription,
        requirements: requirements?.trim() || '',
        location: location.trim(),
        company: user.companyName || 'Company',
        source: '209.works',
        url: '',
        postedAt: new Date(),
        salaryMin,
        salaryMax,
        jobType: 'full_time', // Default to full time
        status: 'active',
        employerId: user.id,
        embedding: embeddings ? JSON.stringify(embeddings) : null
      }
    });

    // TODO: Deduct credit here when payment system is ready
    // await deductEmployerCredit(user.id, 1);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job posted successfully!'
    });

  } catch (error) {
    console.error('Publish job error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A job with similar details already exists' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to publish job. Please try again.' },
      { status: 500 }
    );
  }
}