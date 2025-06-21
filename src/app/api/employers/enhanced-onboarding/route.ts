import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import path from "path";

const enhancedOnboardingSchema = z.object({
  // Company Information
  companyName: z.string().min(1, 'Company name is required'),
  companyDescription: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().optional(),
  foundedYear: z.string().optional(),
  headquarters: z.string().optional(),
  logoUrl: z.string().optional(),
  
  // Contact Information
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  contactTitle: z.string().optional(),
  
  // Company Culture & Benefits
  companyValues: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  workEnvironment: z.string().optional(),
  remotePolicy: z.string().optional(),
  
  // Hiring Information
  hiringGoals: z.array(z.string()).default([]),
  typicalRoles: z.array(z.string()).default([]),
  hiringVolume: z.string().optional(),
  urgentHiring: z.boolean().default(false),
  
  // Verification
  businessLicense: z.string().optional(),
  taxId: z.string().optional(),
  verificationDocuments: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = enhancedOnboardingSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { company: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create or update company profile
    let company;
    if (existingUser.companyId) {
      // Update existing company
      company = await prisma.company.update({
        where: { id: existingUser.companyId },
        data: {
          name: validatedData.companyName,
          description: validatedData.companyDescription || null,
          website: validatedData.website || null,
          industry: validatedData.industry,
          size: validatedData.companySize || null,
          founded: validatedData.foundedYear ? parseInt(validatedData.foundedYear) : null,
          headquarters: validatedData.headquarters || null,
          logo: validatedData.logoUrl || null,
          contactEmail: validatedData.contactEmail,
          contactPhone: validatedData.contactPhone || null,
          
          // Company culture data (stored as JSON)
          companyValues: validatedData.companyValues,
          benefits: validatedData.benefits,
          workEnvironment: validatedData.workEnvironment || null,
          remotePolicy: validatedData.remotePolicy || null,
          
          // Hiring information
          hiringGoals: validatedData.hiringGoals,
          typicalRoles: validatedData.typicalRoles,
          hiringVolume: validatedData.hiringVolume || null,
          urgentHiring: validatedData.urgentHiring,
          
          // Verification
          businessLicense: validatedData.businessLicense || null,
          taxId: validatedData.taxId || null,
          verificationStatus: (validatedData.businessLicense || validatedData.taxId) ? 'pending' : 'unverified',
          
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new company
      company = await prisma.company.create({
        data: {
          name: validatedData.companyName,
          slug: validatedData.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: validatedData.companyDescription || null,
          website: validatedData.website || null,
          industry: validatedData.industry,
          size: validatedData.companySize || null,
          founded: validatedData.foundedYear ? parseInt(validatedData.foundedYear) : null,
          headquarters: validatedData.headquarters || null,
          logo: validatedData.logoUrl || null,
          contactEmail: validatedData.contactEmail,
          contactPhone: validatedData.contactPhone || null,
          
          // Company culture data (stored as JSON)
          companyValues: validatedData.companyValues,
          benefits: validatedData.benefits,
          workEnvironment: validatedData.workEnvironment || null,
          remotePolicy: validatedData.remotePolicy || null,
          
          // Hiring information
          hiringGoals: validatedData.hiringGoals,
          typicalRoles: validatedData.typicalRoles,
          hiringVolume: validatedData.hiringVolume || null,
          urgentHiring: validatedData.urgentHiring,
          
          // Verification
          businessLicense: validatedData.businessLicense || null,
          taxId: validatedData.taxId || null,
          verificationStatus: (validatedData.businessLicense || validatedData.taxId) ? 'pending' : 'unverified',
        }
      });

      // Link company to user
      await prisma.user.update({
        where: { clerkId: userId },
        data: { companyId: company.id }
      });
    }

    // Update user profile with contact information
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        name: validatedData.contactName,
        email: validatedData.contactEmail,
        phone: validatedData.contactPhone || null,
        jobTitle: validatedData.contactTitle || null,
        companyName: validatedData.companyName,
        industry: validatedData.industry,
        location: validatedData.headquarters || null,
        
        // Mark enhanced onboarding as completed
        employerOnboardingCompleted: true,
        enhancedOnboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      }
    });

    // Create onboarding completion record for analytics
    await prisma.userActivity.create({
      data: {
        userId: existingUser.id,
        action: 'enhanced_onboarding_completed',
        details: {
          companyName: validatedData.companyName,
          industry: validatedData.industry,
          companySize: validatedData.companySize,
          hiringGoals: validatedData.hiringGoals,
          urgentHiring: validatedData.urgentHiring,
          verificationRequested: !!(validatedData.businessLicense || validatedData.taxId),
        }
      }
    }).catch(error => {
      console.error('Failed to log onboarding completion:', error);
      // Don't fail the request if activity logging fails
    });

    // If verification documents were provided, create verification request
    if (validatedData.businessLicense || validatedData.taxId) {
      await prisma.companyVerification.create({
        data: {
          companyId: company.id,
          businessLicense: validatedData.businessLicense || null,
          taxId: validatedData.taxId || null,
          status: 'pending',
          submittedAt: new Date(),
          documents: validatedData.verificationDocuments,
        }
      }).catch(error => {
        console.error('Failed to create verification request:', error);
        // Don't fail the request if verification creation fails
      });
    }

    // Send welcome email with next steps
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/emails/employer-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: validatedData.contactEmail,
          name: validatedData.contactName,
          companyName: validatedData.companyName,
          urgentHiring: validatedData.urgentHiring,
        }),
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Enhanced onboarding completed successfully',
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        verificationStatus: company.verificationStatus,
      },
      nextSteps: [
        'Post your first job',
        'Set up billing and credits',
        'Explore AI matching features',
        ...(validatedData.urgentHiring ? ['Contact our team for urgent hiring support'] : []),
      ]
    });

  } catch (error) {
    console.error('Enhanced onboarding error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        company: {
          include: {
            verification: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      onboardingCompleted: user.enhancedOnboardingCompleted || false,
      company: user.company ? {
        ...user.company,
        verification: user.company.verification
      } : null,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        jobTitle: user.jobTitle,
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
