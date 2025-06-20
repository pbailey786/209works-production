import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
import { Session } from 'next-auth';

// GET /api/employers/candidates/:id - Get candidate snapshot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
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

    const mockParsedResume = {
      skills: application.user.skills || [
        'JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'SQL',
        'Git', 'AWS', 'Docker', 'REST APIs', 'MongoDB', 'Express.js'
      ],
      experience: [
        {
          title: 'Senior Software Developer',
          company: 'Tech Innovations LLC',
          duration: '2022 - Present',
          description: 'Lead development of scalable web applications serving 100K+ users. Implemented microservices architecture, reduced load times by 40%, and mentored junior developers. Technologies: React, Node.js, AWS, Docker.',
        },
        {
          title: 'Full Stack Developer',
          company: 'Digital Solutions Corp',
          duration: '2020 - 2022',
          description: 'Built and maintained e-commerce platforms with integrated payment systems. Collaborated with cross-functional teams to deliver features on time. Improved database performance by 30% through query optimization.',
        },
        {
          title: 'Junior Web Developer',
          company: 'StartupXYZ',
          duration: '2019 - 2020',
          description: 'Developed responsive web interfaces and RESTful APIs. Participated in agile development process and code reviews. Gained experience with modern JavaScript frameworks and cloud deployment.',
        },
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          institution: 'University of California, Davis',
          year: '2019',
        },
        {
          degree: 'Associate of Arts in Mathematics',
          institution: 'Sacramento City College',
          year: '2017',
        },
      ],
      summary: application.user.bio || 'Passionate full-stack developer with 5+ years of experience building scalable web applications. Expertise in modern JavaScript frameworks, cloud technologies, and agile development practices. Strong problem-solving skills and commitment to writing clean, maintainable code.',
    };

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
