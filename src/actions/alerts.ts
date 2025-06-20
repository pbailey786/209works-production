import { revalidatePath } from '@/components/ui/card';
import { z } from '@/components/ui/card';
import { prisma } from '@/components/ui/card';
import { ActionResult } from '@/types/actions';

'use server';

import {
  import {
  createAlertSchema,
  updateAlertSchema,
  testAlertSchema,
  AlertCriteria
} from '@/components/ui/card';
import {
  EnhancedJobMatchingService,
  findMatchingJobs as enhancedFindMatchingJobs,
  calculateMatchQuality as enhancedCalculateMatchQuality,
  generateOptimizationRecommendations as enhancedGenerateOptimizationRecommendations,
} from '@/lib/search/job-matching';

// Create job alert action
export async function createAlertAction(
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

    // Check user's current alert count
    const alertCount = await prisma.jobAlert.count({
      where: { userId },
    });

    // Get user role for limit checking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const maxAlerts = user?.role === 'admin' ? 100 : 20;

    if (alertCount >= maxAlerts) {
      return {
        success: false,
        message: `You have reached the maximum limit of ${maxAlerts} alerts`,
      };
    }

    // Extract and validate form data
    const rawData = {
      title: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      keywords: JSON.parse(formData.get('criteria') as string).keywords || [],
      location:
        JSON.parse(formData.get('criteria') as string).location || undefined,
      jobType: JSON.parse(formData.get('criteria') as string).jobType as
        | 'contract'
        | 'internship'
        | 'temporary'
        | 'full_time'
        | 'part_time'
        | undefined,
      salaryMin:
        JSON.parse(formData.get('criteria') as string).salaryMin || undefined,
      salaryMax:
        JSON.parse(formData.get('criteria') as string).salaryMax || undefined,
      frequency: formData.get('frequency') as any,
      isActive: formData.get('isActive') === 'true',
    };

    const validatedData = createAlertSchema.parse(rawData);

    // Create the alert
    const alert = await prisma.jobAlert.create({
      data: {
        userId,
        title: rawData.title,
        keywords: rawData.keywords,
        location: rawData.location,
        jobType: rawData.jobType,
        salaryMin: rawData.salaryMin,
        salaryMax: rawData.salaryMax,
        frequency: rawData.frequency,
        isActive: rawData.isActive,
      },
    });

    revalidatePath('/alerts');
    revalidatePath('/profile/settings');

    return {
      success: true,
      message: 'Job alert created successfully!',
      data: { alertId: alert.id },
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

    console.error('Create alert error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Update job alert action
export async function updateAlertAction(
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

    const alertId = formData.get('id') as string;
    if (!alertId) {
      return {
        success: false,
        message: 'Alert ID is required',
      };
    }

    // Verify alert ownership
    const existingAlert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
    });

    if (!existingAlert) {
      return {
        success: false,
        message: 'Alert not found or access denied',
      };
    }

    // Extract and validate form data
    const rawData = {
      id: alertId,
      name: (formData.get('name') as string) || undefined,
      description: (formData.get('description') as string) || undefined,
      criteria: formData.get('criteria')
        ? JSON.parse(formData.get('criteria') as string)
        : undefined,
      frequency: (formData.get('frequency') as any) || undefined,
      isActive:
        formData.get('isActive') !== null
          ? formData.get('isActive') === 'true'
          : undefined,
      maxResults: formData.get('maxResults')
        ? Number(formData.get('maxResults'))
        : undefined,
    };

    const validatedData = updateAlertSchema.parse(rawData);

    // Remove undefined values and id
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(
        ([key, value]) => value !== undefined && key !== 'id'
      )
    );

    // Update the alert
    const updatedAlert = await prisma.jobAlert.update({
      where: { id: alertId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/alerts');
    revalidatePath(`/alerts/${alertId}`);

    return {
      success: true,
      message: 'Alert updated successfully!',
      data: { alertId: updatedAlert.id },
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

    console.error('Update alert error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Delete job alert action
export async function deleteAlertAction(
  alertId: string,
  userId: string
): Promise<ActionResult> {
  try {
    // Verify alert ownership
    const existingAlert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
    });

    if (!existingAlert) {
      return {
        success: false,
        message: 'Alert not found or access denied',
      };
    }

    // Delete the alert (this will cascade delete notifications)
    await prisma.jobAlert.delete({
      where: { id: alertId },
    });

    revalidatePath('/alerts');

    return {
      success: true,
      message: 'Alert deleted successfully',
    };
  } catch (error) {
    console.error('Delete alert error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Toggle alert status action
export async function toggleAlertStatusAction(
  alertId: string,
  userId: string
): Promise<ActionResult> {
  try {
    // Verify alert ownership
    const existingAlert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
      select: { id: true, isActive: true, title: true },
    });

    if (!existingAlert) {
      return {
        success: false,
        message: 'Alert not found or access denied',
      };
    }

    // Toggle status
    const newStatus = !existingAlert.isActive;

    await prisma.jobAlert.update({
      where: { id: alertId },
      data: { isActive: newStatus },
    });

    revalidatePath('/alerts');
    revalidatePath(`/alerts/${alertId}`);

    return {
      success: true,
      message: `Alert ${newStatus ? 'activated' : 'paused'} successfully`,
      data: { isActive: newStatus },
    };
  } catch (error) {
    console.error('Toggle alert status error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Test job alert action
export async function testAlertAction(
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
      alertId: formData.get('alertId') as string,
      dryRun: formData.get('dryRun') !== 'false', // Default to true
    };

    const validatedData = testAlertSchema.parse(rawData);

    // Verify alert ownership
    const alert = await prisma.jobAlert.findFirst({
      where: {
        id: validatedData.alertId,
        userId,
      },
    });

    if (!alert) {
      return {
        success: false,
        message: 'Alert not found or access denied',
      };
    }

    // Use enhanced job matching algorithm
    const alertCriteria: AlertCriteria = {
      keywords: alert.keywords,
      location: alert.location || undefined,
      jobType: alert.jobType as
        | 'contract'
        | 'internship'
        | 'temporary'
        | 'full_time'
        | 'part_time'
        | undefined,
      salaryMin: alert.salaryMin || undefined,
      salaryMax: alert.salaryMax || undefined,
    };

    const matchingJobs = await enhancedFindMatchingJobs(alertCriteria, 10);

    // Calculate match quality using enhanced algorithm
    const matchQuality = enhancedCalculateMatchQuality(
      alertCriteria,
      matchingJobs
    );

    // Generate recommendations using enhanced algorithm
    const recommendations = enhancedGenerateOptimizationRecommendations(
      alertCriteria,
      matchingJobs
    );

    // Generate notification preview if not dry run
    let notificationPreview = null;
    if (!validatedData.dryRun && matchingJobs.length > 0) {
      notificationPreview = generateNotificationPreview(alert, matchingJobs);
    }

    return {
      success: true,
      message: 'Alert test completed successfully',
      data: {
        alert: {
          id: alert.id,
          title: alert.title,
          frequency: alert.frequency,
        },
        testResults: {
          totalMatches: matchingJobs.length,
          matchingJobs: matchingJobs.slice(0, 5), // Show top 5 for preview
          matchQuality,
          recommendations,
        },
        notificationPreview,
        dryRun: validatedData.dryRun,
      },
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

    console.error('Test alert error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Bulk operation on alerts
export async function bulkAlertOperationAction(
  operation: 'activate' | 'deactivate' | 'delete',
  alertIds: string[],
  userId: string
): Promise<ActionResult> {
  try {
    if (alertIds.length === 0) {
      return {
        success: false,
        message: 'No alerts selected',
      };
    }

    if (alertIds.length > 50) {
      return {
        success: false,
        message: 'Cannot process more than 50 alerts at once',
      };
    }

    // Verify all alerts belong to the user
    const userAlerts = await prisma.jobAlert.findMany({
      where: {
        id: { in: alertIds },
        userId,
      },
      select: { id: true },
    });

    if (userAlerts.length !== alertIds.length) {
      return {
        success: false,
        message: 'Some alerts not found or access denied',
      };
    }

    let result;
    switch (operation) {
      case 'activate':
        result = await prisma.jobAlert.updateMany({
          where: { id: { in: alertIds } },
          data: { isActive: true },
        });
        break;
      case 'deactivate':
        result = await prisma.jobAlert.updateMany({
          where: { id: { in: alertIds } },
          data: { isActive: false },
        });
        break;
      case 'delete':
        result = await prisma.jobAlert.deleteMany({
          where: { id: { in: alertIds } },
        });
        break;
    }

    revalidatePath('/alerts');

    return {
      success: true,
      message: `Successfully ${operation}d ${result.count} alert${result.count !== 1 ? 's' : ''}`,
      data: { affectedCount: result.count },
    };
  } catch (error) {
    console.error('Bulk alert operation error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Note: Job matching helper functions have been moved to @/lib/search/job-matching.ts
// for enhanced algorithm implementation with semantic analysis, TF-IDF scoring,
// and improved relevance calculations.

// Generate notification preview
function generateNotificationPreview(alert: any, jobs: any[]): any {
  const topJobs = jobs.slice(0, 3);

  return {
    subject: `${jobs.length} new job${jobs.length !== 1 ? 's' : ''} matching "${alert.title}"`,
    preview: `Found ${jobs.length} new opportunities including ${topJobs.map(job => job.title).join(', ')}`,
    emailBody: {
      heading: `New Job Matches for "${alert.title}"`,
      summary: `We found ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} that match your alert criteria.`,
      jobs: topJobs.map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        salary:
          job.salaryMin && job.salaryMax
            ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
            : 'Salary not specified',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${job.id}`,
      })),
      footerText:
        jobs.length > 3
          ? `View all ${jobs.length} matches on 209jobs`
          : undefined,
    },
  };
}
