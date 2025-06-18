import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

// Validation schema for job seeker profile
const jobSeekerProfileSchema = z.object({
  // Resume parsing results
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().optional(),
  zipCode: z.string().optional(),
  workHistory: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  education: z.string().optional(),
  
  // Availability
  availabilityDays: z.array(z.string()).optional().default([]),
  availabilityShifts: z.array(z.string()).optional().default([]),
  distanceWillingToTravel: z.number().min(0).max(50).optional().default(25),
  
  // Job preferences
  jobTypes: z.array(z.string()).optional().default([]),
  whatAreYouGoodAt: z.string().optional(),
  skillsCertifications: z.array(z.string()).optional().default([]),
  
  // Career goals
  careerGoal: z.string().optional(),
  
  // Opt-ins
  optInEmailAlerts: z.boolean().optional().default(false),
  optInSmsAlerts: z.boolean().optional().default(false),
  allowEmployerMessages: z.boolean().optional().default(false),
});

// POST /api/profile/jobseeker - Create/update job seeker profile
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession() as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'jobseeker') {
      return NextResponse.json(
        { error: 'Authentication required. Only job seekers can create profiles.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = jobSeekerProfileSchema.parse(body);

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user basic info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validatedData.name,
        phoneNumber: validatedData.phoneNumber,
        skills: validatedData.skills,
        preferredJobTypes: validatedData.jobTypes,
      },
    });

    // Create or update job seeker profile
    const profileData = {
      userId: user.id,
      zipCode: validatedData.zipCode,
      distanceWillingToTravel: validatedData.distanceWillingToTravel,
      availabilityDays: validatedData.availabilityDays,
      availabilityShifts: validatedData.availabilityShifts,
      jobTypes: validatedData.jobTypes,
      skills: validatedData.skillsCertifications,
      careerGoal: validatedData.careerGoal,
      optInEmailAlerts: validatedData.optInEmailAlerts,
      optInSmsAlerts: validatedData.optInSmsAlerts,
      allowEmployerMessages: validatedData.allowEmployerMessages,
      whatAreYouGoodAt: validatedData.whatAreYouGoodAt,
      resumeData: {
        workHistory: validatedData.workHistory,
        education: validatedData.education,
        skills: validatedData.skills,
      },
    };

    // Use upsert to create or update the profile
    const profile = await prisma.jobSeekerProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: profileData,
    });

    return NextResponse.json({
      success: true,
      message: 'Job seeker profile saved successfully!',
      profile: {
        id: profile.id,
        userId: profile.userId,
        careerGoal: profile.careerGoal,
        optInEmailAlerts: profile.optInEmailAlerts,
      },
    });
  } catch (error) {
    console.error('Job seeker profile error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid profile data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save job seeker profile. Please try again.' },
      { status: 500 }
    );
  }
}

// GET /api/profile/jobseeker - Get job seeker profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'jobseeker') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Get job seeker profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
