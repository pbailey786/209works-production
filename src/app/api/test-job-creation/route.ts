import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing job creation...');
    
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User ID:', session.user.id);

    // Try to create a minimal test job
    const testJobData = {
      title: 'Test Job Creation',
      company: 'Test Company',
      description: 'This is a test job description to verify that job creation works properly in the database.',
      location: 'Test Location, CA',
      source: 'test',
      url: 'https://test.com/job/test-123',
      postedAt: new Date(),
      categories: ['test'],
      jobType: 'full_time' as const,
      employerId: session.user.id,
      status: 'active',
      region: '209',
    };

    console.log('Creating test job with data:', JSON.stringify(testJobData, null, 2));

    const createdJob = await prisma.job.create({
      data: testJobData,
    });

    console.log('Test job created successfully:', createdJob.id);

    // Clean up - delete the test job
    await prisma.job.delete({
      where: { id: createdJob.id }
    });

    console.log('Test job deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Job creation test passed',
      jobId: createdJob.id,
    });

  } catch (error) {
    console.error('Test job creation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    }, { status: 500 });
  }
}
