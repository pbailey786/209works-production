import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { Session } from 'next-auth';

// GET /api/employers/candidates/:id - Get candidate snapshot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applicationId = (await params).id;

    // Fetch the application with all related data
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            resumeUrl: true,
            bio: true,
            skills: true,
            location: true,
            linkedinUrl: true,
            phoneNumber: true,
            createdAt: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            jobType: true,
            description: true,
            postedAt: true,
            employerId: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify the application belongs to this employer's job
    if (application.job.employerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate mock AI score and parsed resume data for now
    // TODO: Implement actual AI scoring and resume parsing
    const mockAiScore = {
      overall: Math.floor(Math.random() * 40) + 60, // 60-100
      skillsMatch: Math.floor(Math.random() * 40) + 60,
      experienceMatch: Math.floor(Math.random() * 40) + 60,
      educationMatch: Math.floor(Math.random() * 40) + 60,
      breakdown: {
        strengths: [
          'Strong technical background in required technologies',
          'Relevant industry experience',
          'Good communication skills demonstrated in cover letter',
        ],
        gaps: [
          'Limited experience with specific framework mentioned in job',
          'No direct experience in this industry vertical',
        ],
        recommendations: [
          'Consider for technical interview to assess practical skills',
          'Strong candidate for mid-level position',
        ],
      },
    };

    const mockParsedResume = application.user.skills ? {
      skills: application.user.skills,
      experience: [
        {
          title: 'Software Developer',
          company: 'Tech Company Inc.',
          duration: '2021 - Present',
          description: 'Developed web applications using modern frameworks and technologies.',
        },
      ],
      education: [
        {
          degree: 'Bachelor of Computer Science',
          institution: 'University of California',
          year: '2021',
        },
      ],
      summary: application.user.bio || 'Experienced professional with strong technical skills.',
    } : undefined;

    // Mock screening answers - in real implementation, these would come from job application form
    const mockScreeningAnswers = [
      {
        question: 'Why are you interested in this position?',
        answer: 'I am passionate about this role because it aligns with my career goals and allows me to utilize my skills in a meaningful way.',
        type: 'text' as const,
      },
      {
        question: 'Are you authorized to work in the United States?',
        answer: 'Yes',
        type: 'multiple_choice' as const,
      },
    ];

    // Extract notes from coverLetter field (temporary workaround)
    const coverLetterContent = application.coverLetter || '';
    const hasNotes = coverLetterContent.includes('[EMPLOYER NOTE');

    let actualCoverLetter = coverLetterContent;
    let notes = null;

    if (hasNotes) {
      const parts = coverLetterContent.split('[EMPLOYER NOTE');
      actualCoverLetter = parts[0].trim();
      notes = '[EMPLOYER NOTE' + parts.slice(1).join('[EMPLOYER NOTE');
    }

    const candidateSnapshot = {
      id: application.id,
      status: application.status,
      appliedAt: application.appliedAt,
      coverLetter: actualCoverLetter || null,
      resumeUrl: application.resumeUrl,
      notes: notes,
      screeningAnswers: mockScreeningAnswers,
      job: application.job,
      user: application.user,
      aiScore: mockAiScore,
      parsedResume: mockParsedResume,
    };

    return NextResponse.json(candidateSnapshot);
  } catch (error) {
    console.error('Error fetching candidate snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
