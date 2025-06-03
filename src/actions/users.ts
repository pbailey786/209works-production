'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { ActionResult } from './auth';

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional(),
  linkedinUrl: z.string().url('Please enter a valid LinkedIn URL').optional(),
  githubUrl: z.string().url('Please enter a valid GitHub URL').optional(),
  portfolioUrl: z.string().url('Please enter a valid portfolio URL').optional(),
  profilePictureUrl: z
    .string()
    .url('Please enter a valid image URL')
    .optional(),
  // Employer-specific fields
  companyName: z.string().optional(),
  companyWebsite: z
    .string()
    .url('Please enter a valid company website')
    .optional(),
  companySize: z
    .enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .optional(),
  industry: z.string().optional(),
  // Job seeker-specific fields
  currentTitle: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  skills: z.array(z.string()).optional(),
  expectedSalaryMin: z.number().min(0).optional(),
  expectedSalaryMax: z.number().min(0).optional(),
  isOpenToWork: z.boolean().optional(),
  preferredJobTypes: z
    .array(
      z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship'])
    )
    .optional(),
  preferredLocations: z.array(z.string()).optional(),
  isOpenToRemote: z.boolean().optional(),
});

const updateNotificationPreferencesSchema = z.object({
  emailJobAlerts: z.boolean().default(true),
  emailApplicationUpdates: z.boolean().default(true),
  emailMarketingEmails: z.boolean().default(false),
  emailWeeklyDigest: z.boolean().default(true),
  pushJobAlerts: z.boolean().default(false),
  pushApplicationUpdates: z.boolean().default(true),
  pushMessages: z.boolean().default(true),
  smsJobAlerts: z.boolean().default(false),
  smsApplicationUpdates: z.boolean().default(false),
});

const updatePrivacySettingsSchema = z.object({
  profileVisibility: z
    .enum(['public', 'private', 'employers-only'])
    .default('public'),
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  allowMessagesFromEmployers: z.boolean().default(true),
  allowJobRecommendations: z.boolean().default(true),
  showOnlineStatus: z.boolean().default(true),
  indexableBySearchEngines: z.boolean().default(true),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const deleteAccountSchema = z.object({
  confirmEmail: z.string().email('Please enter your email address'),
  reason: z.string().optional(),
});

const uploadResumeSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('Please provide a valid file URL'),
  fileSize: z.number().min(1, 'File size must be greater than 0'),
  fileType: z
    .string()
    .regex(
      /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
      'Only PDF, DOC, and DOCX files are allowed'
    ),
});

// Update user profile action
export async function updateProfileAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!currentUser) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Extract form data
    const rawData: any = {
      name: (formData.get('name') as string) || undefined,
      bio: (formData.get('bio') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      linkedinUrl: (formData.get('linkedinUrl') as string) || undefined,
      githubUrl: (formData.get('githubUrl') as string) || undefined,
      portfolioUrl: (formData.get('portfolioUrl') as string) || undefined,
      profilePictureUrl:
        (formData.get('profilePictureUrl') as string) || undefined,
    };

    // Add role-specific fields
    if (currentUser.role === 'employer') {
      rawData.companyName =
        (formData.get('companyName') as string) || undefined;
      rawData.companyWebsite =
        (formData.get('companyWebsite') as string) || undefined;
      rawData.companySize =
        (formData.get('companySize') as string) || undefined;
      rawData.industry = (formData.get('industry') as string) || undefined;
    } else if (currentUser.role === 'jobseeker') {
      rawData.currentTitle =
        (formData.get('currentTitle') as string) || undefined;
      rawData.experienceLevel =
        (formData.get('experienceLevel') as string) || undefined;
      rawData.skills = formData.get('skills')
        ? JSON.parse(formData.get('skills') as string)
        : undefined;
      rawData.expectedSalaryMin = formData.get('expectedSalaryMin')
        ? Number(formData.get('expectedSalaryMin'))
        : undefined;
      rawData.expectedSalaryMax = formData.get('expectedSalaryMax')
        ? Number(formData.get('expectedSalaryMax'))
        : undefined;
      rawData.isOpenToWork = formData.get('isOpenToWork')
        ? formData.get('isOpenToWork') === 'true'
        : undefined;
      rawData.preferredJobTypes = formData.get('preferredJobTypes')
        ? JSON.parse(formData.get('preferredJobTypes') as string)
        : undefined;
      rawData.preferredLocations = formData.get('preferredLocations')
        ? JSON.parse(formData.get('preferredLocations') as string)
        : undefined;
      rawData.isOpenToRemote = formData.get('isOpenToRemote')
        ? formData.get('isOpenToRemote') === 'true'
        : undefined;
    }

    const validatedData = updateProfileSchema.parse(rawData);

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/profile');
    revalidatePath('/profile/settings');

    return {
      success: true,
      message: 'Profile updated successfully!',
      data: { userId: updatedUser.id },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Update profile error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Update notification preferences action
export async function updateNotificationPreferencesAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    // Extract form data
    const rawData = {
      emailJobAlerts: formData.get('emailJobAlerts') === 'true',
      emailApplicationUpdates:
        formData.get('emailApplicationUpdates') === 'true',
      emailMarketingEmails: formData.get('emailMarketingEmails') === 'true',
      emailWeeklyDigest: formData.get('emailWeeklyDigest') === 'true',
      pushJobAlerts: formData.get('pushJobAlerts') === 'true',
      pushApplicationUpdates: formData.get('pushApplicationUpdates') === 'true',
      pushMessages: formData.get('pushMessages') === 'true',
      smsJobAlerts: formData.get('smsJobAlerts') === 'true',
      smsApplicationUpdates: formData.get('smsApplicationUpdates') === 'true',
    };

    const validatedData = updateNotificationPreferencesSchema.parse(rawData);

    // Update user notification preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Remove notificationPreferences field as it doesn't exist in schema
        // TODO: Implement notification preferences in a separate table or JSON field
        updatedAt: new Date(),
      },
    });

    revalidatePath('/profile/settings');

    return {
      success: true,
      message: 'Notification preferences updated successfully!',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Update notification preferences error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Update privacy settings action
export async function updatePrivacySettingsAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    // Extract form data
    const rawData = {
      profileVisibility: formData.get('profileVisibility') as any,
      showEmail: formData.get('showEmail') === 'true',
      showPhone: formData.get('showPhone') === 'true',
      allowMessagesFromEmployers:
        formData.get('allowMessagesFromEmployers') === 'true',
      allowJobRecommendations:
        formData.get('allowJobRecommendations') === 'true',
      showOnlineStatus: formData.get('showOnlineStatus') === 'true',
      indexableBySearchEngines:
        formData.get('indexableBySearchEngines') === 'true',
    };

    const validatedData = updatePrivacySettingsSchema.parse(rawData);

    // Update user privacy settings
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Remove privacySettings field as it doesn't exist in schema
        // TODO: Implement privacy settings in a separate table or JSON field
        updatedAt: new Date(),
      },
    });

    revalidatePath('/profile/settings');

    return {
      success: true,
      message: 'Privacy settings updated successfully!',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Update privacy settings error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Change password action
export async function changePasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const rawData = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const validatedData = changePasswordSchema.parse(rawData);

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return {
        success: false,
        message: 'User not found or password not set',
      };
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: 'Current password is incorrect',
      };
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Password changed successfully!',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Change password error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Upload resume action
export async function uploadResumeAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const rawData = {
      fileName: formData.get('fileName') as string,
      fileUrl: formData.get('fileUrl') as string,
      fileSize: Number(formData.get('fileSize')),
      fileType: formData.get('fileType') as string,
    };

    const validatedData = uploadResumeSchema.parse(rawData);

    // Update user with resume URL
    await prisma.user.update({
      where: { id: userId },
      data: {
        resumeUrl: validatedData.fileUrl,
        updatedAt: new Date(),
      },
    });

    // TODO: Store resume metadata if needed
    // await prisma.userResume.create({
    //   data: {
    //     userId,
    //     fileName: validatedData.fileName,
    //     fileUrl: validatedData.fileUrl,
    //     fileSize: validatedData.fileSize,
    //     fileType: validatedData.fileType,
    //   },
    // });

    revalidatePath('/profile');
    revalidatePath('/profile/resume');

    return {
      success: true,
      message: 'Resume uploaded successfully!',
      data: { resumeUrl: validatedData.fileUrl },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Upload resume error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Delete account action
export async function deleteAccountAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // TODO: Get current user from session
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const rawData = {
      confirmEmail: formData.get('confirmEmail') as string,
      reason: (formData.get('reason') as string) || undefined,
    };

    const validatedData = deleteAccountSchema.parse(rawData);

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Verify email confirmation
    if (user.email !== validatedData.confirmEmail) {
      return {
        success: false,
        message: 'Email confirmation does not match your account email',
      };
    }

    // TODO: Store deletion reason for analytics
    if (validatedData.reason) {
      // await prisma.accountDeletionReason.create({
      //   data: {
      //     userId,
      //     reason: validatedData.reason,
      //   },
      // });
    }

    // Use safe deletion to prevent cascading delete issues
    const { DataIntegrityService } = await import(
      '@/lib/database/data-integrity'
    );
    const deletionResult = await DataIntegrityService.safeDeleteUser(
      userId,
      validatedData.reason || 'User requested account deletion'
    );

    if (!deletionResult.success) {
      return {
        success: false,
        message:
          deletionResult.errors?.[0] || 'Failed to delete account safely',
      };
    }

    // TODO: Sign out user and redirect
    // await signOut();

    return {
      success: true,
      message: "Account deleted successfully. We're sorry to see you go!",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your input',
        errors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).filter(
            ([_, value]) => value !== undefined
          )
        ) as Record<string, string[]>,
      };
    }

    console.error('Delete account error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Get user profile action (for viewing other profiles)
export async function getUserProfileAction(
  profileUserId: string,
  currentUserId?: string
): Promise<{
  user: any | null;
  canViewProfile: boolean;
  isOwnProfile: boolean;
}> {
  try {
    // Get the profile user
    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        linkedinUrl: true,
        profilePictureUrl: true,
        role: true,
        createdAt: true,
        // Remove bio field as it doesn't exist in schema
        // Remove website field as it doesn't exist in schema
        // Job seeker fields
        currentJobTitle: true,
        skills: true,
        // Employer fields
        companyWebsite: true,
        // Aggregate data
        _count: {
          select: {
            // Remove jobsPosted field as it doesn't exist in schema
            // TODO: Add proper job count relation if needed
          },
        },
      },
    });

    if (!profileUser) {
      return {
        user: null,
        canViewProfile: false,
        isOwnProfile: false,
      };
    }

    const isOwnProfile = currentUserId === profileUserId;

    // Check if user can view this profile
    let canViewProfile = false;
    // TODO: Implement privacy settings when schema supports it
    // const privacySettings = profileUser.privacySettings as any;

    if (isOwnProfile) {
      canViewProfile = true;
    } else {
      // Default to public profile visibility until privacy settings are implemented
      canViewProfile = true;
      // TODO: Implement proper privacy checks when schema supports it
      // } else if (privacySettings?.profileVisibility === 'public') {
      //   canViewProfile = true;
      // } else if (privacySettings?.profileVisibility === 'employers-only' && currentUserId) {
      //   // Check if current user is an employer
      //   const currentUser = await prisma.user.findUnique({
      //     where: { id: currentUserId },
      //     select: { role: true },
      //   });
      //   canViewProfile = currentUser?.role === 'employer';
    }

    // Filter sensitive information based on privacy settings
    if (!isOwnProfile && canViewProfile) {
      // TODO: Implement privacy settings check when schema supports it
      // if (!privacySettings?.showEmail) {
      profileUser.email = '';
      // }
    }

    return {
      user: canViewProfile ? profileUser : null,
      canViewProfile,
      isOwnProfile,
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      user: null,
      canViewProfile: false,
      isOwnProfile: false,
    };
  }
}

// Search users action (for employers to find candidates)
export async function searchUsersAction(
  formData: FormData
): Promise<{ users: any[]; totalCount: number; currentPage: number }> {
  try {
    const query = (formData.get('query') as string) || '';
    const skills = formData.get('skills')
      ? JSON.parse(formData.get('skills') as string)
      : [];
    const location = (formData.get('location') as string) || '';
    const experienceLevel = (formData.get('experienceLevel') as string) || '';
    const isOpenToWork = formData.get('isOpenToWork') === 'true';
    const page = Number(formData.get('page')) || 1;
    const limit = Math.min(Number(formData.get('limit')) || 20, 50);

    // Build where condition
    const whereCondition: any = {
      role: 'jobseeker',
      emailVerified: { not: null },
      privacySettings: {
        path: ['profileVisibility'],
        in: ['public', 'employers-only'],
      },
    };

    // Note: isOpenToWork field not available in current schema
    // if (isOpenToWork) {
    //   whereCondition.isOpenToWork = true;
    // }

    if (query) {
      whereCondition.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { currentJobTitle: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (location) {
      whereCondition.OR = [
        ...(whereCondition.OR || []),
        { location: { contains: location, mode: 'insensitive' } },
        { preferredLocations: { has: location } },
      ];
    }

    if (experienceLevel) {
      whereCondition.experienceLevel = experienceLevel;
    }

    if (skills.length > 0) {
      whereCondition.skills = {
        hasEvery: skills,
      };
    }

    // Get total count
    const totalCount = await prisma.user.count({ where: whereCondition });

    // Get users
    const users = await prisma.user.findMany({
      where: whereCondition,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePictureUrl: true,
        currentJobTitle: true,
        skills: true,
        createdAt: true,
      },
    });

    return {
      users,
      totalCount,
      currentPage: page,
    };
  } catch (error) {
    console.error('Search users error:', error);
    return {
      users: [],
      totalCount: 0,
      currentPage: 1,
    };
  }
}
