import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: jobId } = params;

    // Find the original job and verify ownership
    const originalJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        employerId: userId
      },
      include: {
        categories: true,
        skills: true
      }
    });

    if (!originalJob) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    // Create a duplicate job with modified title
    const duplicatedJob = await prisma.job.create({
      data: {
        title: `${originalJob.title} (Copy)`,
        company: originalJob.company,
        description: originalJob.description,
        requirements: originalJob.requirements,
        benefits: originalJob.benefits,
        location: originalJob.location,
        jobType: originalJob.jobType,
        salaryMin: originalJob.salaryMin,
        salaryMax: originalJob.salaryMax,
        currency: originalJob.currency,
        employerId: userId,
        status: 'DRAFT', // Start as draft
        featured: false, // Don't duplicate featured status
        urgent: false, // Don't duplicate urgent status
        remote: originalJob.remote,
        experienceLevel: originalJob.experienceLevel,
        educationLevel: originalJob.educationLevel,
        applicationDeadline: null, // Reset deadline
        expiresAt: null, // Reset expiration
        postedAt: new Date(),
        // Connect categories and skills
        categories: {
          connect: originalJob.categories.map(cat => ({ id: cat.id }))
        },
        skills: {
          connect: originalJob.skills.map(skill => ({ id: skill.id }))
        }
      }
    });

    return NextResponse.json({
      success: true,
      jobId: duplicatedJob.id,
      message: 'Job duplicated successfully'
    });

  } catch (error) {
    console.error('Error duplicating job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
